/**
 * Invoice service layer - handles business logic for invoice operations.
 * Coordinates between API routes and database operations.
 *
 * Modified for billing user system - uses billingUserID and billing history.
 */

import { Invoice, invoiceSchema, InvoiceItemWithHistory, BillingHistoryEntry } from '@/models/invoice';
import { BillingHistory } from '@/models/billingHistory';
import { generateInvoiceID } from '@/lib/idGenerator';
import {
  createInvoice as dbCreateInvoice,
  getInvoice as dbGetInvoice,
  updateInvoice as dbUpdateInvoice,
  deleteInvoice as dbDeleteInvoice,
  listInvoices as dbListInvoices,
  getNextInvoiceSequence
} from '@/lib/db/invoices';
import * as billingHistoryDB from '@/lib/db/billingHistory';
import * as invoiceItemMastersDB from '@/lib/db/invoiceItemMasters';

/**
 * Calculate invoice financial totals.
 * These values are NEVER stored - always computed at render time.
 * @param invoice - Invoice object with items
 * @returns Object with subtotal, taxAmount, and total
 */
export function calculateInvoiceTotals(invoice: Invoice): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  // Calculate subtotal from all billing history entries across all items
  const subtotal = invoice.invoiceItems.reduce((sum, item) => {
    const itemTotal = item.billingHistoryEntries.reduce((itemSum, entry) => {
      return itemSum + entry.amount;
    }, 0);
    return sum + itemTotal;
  }, 0);

  // Calculate tax amount
  const taxAmount = subtotal * invoice.taxRate;

  // Calculate total
  const total = subtotal + taxAmount;

  // Guard against negative totals (should be prevented by schema, but defense in depth)
  return {
    subtotal: Math.max(0, subtotal),
    taxAmount: Math.max(0, taxAmount),
    total: Math.max(0, total)
  };
}

/**
 * Create a new invoice from billing history entries.
 * @param billingUserID - Billing user's unique identifier
 * @param billingHistoryIDs - Array of billing history IDs to include in invoice
 * @param invoiceData - Invoice metadata (dates, terms, tax rate, currency)
 * @returns Created invoice with generated invoiceID
 * @throws Error if validation fails or billing history entries are invalid
 */
export async function createInvoice(
  billingUserID: string,
  billingHistoryIDs: string[],
  invoiceData: {
    invoiceDate: string;
    terms: string;
    dueDate: string;
    currency: 'PHP' | 'USD';
    taxRate: number;
  }
): Promise<Invoice> {
  if (billingHistoryIDs.length === 0) {
    throw new Error('Cannot create invoice without billing history entries');
  }

  // Fetch all billing history entries
  const billingHistoryEntries = await billingHistoryDB.getBillingHistoriesByIDs(billingHistoryIDs);

  // Verify all entries exist and belong to the same billing user
  if (billingHistoryEntries.length !== billingHistoryIDs.length) {
    throw new Error('One or more billing history entries not found');
  }

  for (const entry of billingHistoryEntries) {
    if (entry.billingUserID !== billingUserID) {
      throw new Error(`Billing history entry ${entry.billingHistoryID} does not belong to billing user ${billingUserID}`);
    }
    if (entry.invoiceID !== null) {
      throw new Error(`Billing history entry ${entry.billingHistoryID} is already billed`);
    }
  }

  // Group billing history entries by invoiceItemID
  const groupedByItem = new Map<string, BillingHistory[]>();
  for (const entry of billingHistoryEntries) {
    const existing = groupedByItem.get(entry.invoiceItemID) || [];
    existing.push(entry);
    groupedByItem.set(entry.invoiceItemID, existing);
  }

  // Build invoice items with nested billing history structure
  const invoiceItems: InvoiceItemWithHistory[] = [];
  
  for (const [invoiceItemID, entries] of groupedByItem) {
    // Fetch invoice item master for description
    const itemMaster = await invoiceItemMastersDB.getInvoiceItemMaster(invoiceItemID);
    if (!itemMaster) {
      throw new Error(`Invoice item master ${invoiceItemID} not found`);
    }

    // Build billing history entries for this item
    const billingHistoryEntries: BillingHistoryEntry[] = entries.map(entry => ({
      billingHistoryID: entry.billingHistoryID,
      quantity: entry.quantity,
      rate: entry.rate,
      date: entry.date,
      amount: entry.quantity * entry.rate // Calculate amount
    }));

    invoiceItems.push({
      invoiceItemID,
      description: itemMaster.description,
      billingHistoryEntries
    });
  }

  // Get next sequence number for this billing user
  const sequence = await getNextInvoiceSequence(billingUserID);

  // Generate invoice ID
  const invoiceID = generateInvoiceID(sequence);

  // Get current date in ISO format (YYYY-MM-DD)
  const createdAt = new Date().toISOString().split('T')[0];

  // Create complete invoice object
  const invoice: Invoice = {
    invoiceID,
    billingUserID,
    createdAt,
    invoiceItems,
    ...invoiceData
  };

  // Validate complete invoice object
  const validated = invoiceSchema.parse(invoice);

  // Store in database
  await dbCreateInvoice(billingUserID, validated);

  // Mark all billing history entries as billed
  await billingHistoryDB.markBillingHistoryAsBilled(billingHistoryIDs, invoiceID);

  return validated;
}

/**
 * Get invoice by ID.
 * @param billingUserID - Billing user's unique identifier
 * @param invoiceID - Invoice ID
 * @returns Invoice object or null if not found
 */
export async function getInvoice(
  billingUserID: string,
  invoiceID: string
): Promise<Invoice | null> {
  return dbGetInvoice(billingUserID, invoiceID);
}

/**
 * Update invoice fields.
 * Cannot change invoiceID, billingUserID, or invoiceItems.
 * @param billingUserID - Billing user's unique identifier
 * @param invoiceID - Invoice ID
 * @param updates - Partial invoice data to update (metadata only)
 * @returns Updated invoice object
 * @throws Error if invoice not found or validation fails
 */
export async function updateInvoice(
  billingUserID: string,
  invoiceID: string,
  updates: Partial<Omit<Invoice, 'invoiceID' | 'billingUserID' | 'createdAt' | 'invoiceItems'>>
): Promise<Invoice> {
  // Get existing invoice to verify it exists
  const existing = await dbGetInvoice(billingUserID, invoiceID);
  if (!existing) {
    throw new Error('Invoice not found');
  }

  // Update in database
  await dbUpdateInvoice(billingUserID, invoiceID, updates);

  // Return updated invoice
  const updated = await dbGetInvoice(billingUserID, invoiceID);
  if (!updated) {
    throw new Error('Failed to retrieve updated invoice');
  }

  return updated;
}

/**
 * Delete an invoice.
 * Also unmarks associated billing history entries as unbilled.
 * @param billingUserID - Billing user's unique identifier
 * @param invoiceID - Invoice ID
 */
export async function deleteInvoice(
  billingUserID: string,
  invoiceID: string
): Promise<void> {
  // Get invoice to find associated billing history entries
  const invoice = await dbGetInvoice(billingUserID, invoiceID);
  if (invoice) {
    // Collect all billing history IDs from the invoice
    const billingHistoryIDs: string[] = [];
    for (const item of invoice.invoiceItems) {
      for (const entry of item.billingHistoryEntries) {
        billingHistoryIDs.push(entry.billingHistoryID);
      }
    }

    // Unmark billing history entries (set invoiceID to null)
    if (billingHistoryIDs.length > 0) {
      await billingHistoryDB.unmarkBillingHistoryAsBilled(billingHistoryIDs);
    }
  }

  // Delete invoice
  await dbDeleteInvoice(billingUserID, invoiceID);
}

/**
 * List all invoices for a billing user.
 * @param billingUserID - Billing user's unique identifier
 * @returns Array of invoices (empty if none exist)
 */
export async function listBillingUserInvoices(billingUserID: string): Promise<Invoice[]> {
  return dbListInvoices(billingUserID);
}

// Made with Bob
