import { Invoice, invoiceSchema, InvoiceItem } from '@/models/invoice';
import { generateInvoiceID } from '@/lib/idGenerator';
import {
  createInvoice as dbCreateInvoice,
  getInvoice as dbGetInvoice,
  updateInvoice as dbUpdateInvoice,
  deleteInvoice as dbDeleteInvoice,
  listInvoices as dbListInvoices,
  getNextInvoiceSequence
} from '@/lib/db/invoices';

/**
 * Invoice service layer - handles business logic for invoice operations.
 * Coordinates between API routes and database operations.
 */

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
  // Calculate subtotal from all line items
  const subtotal = invoice.invoiceItems.reduce((sum, item) => {
    return sum + item.quantity * item.rate;
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
 * Create a new invoice with generated invoice ID.
 * @param userID - User's unique identifier
 * @param invoiceData - Invoice data without invoiceID (will be generated)
 * @returns Created invoice with generated invoiceID
 * @throws Error if validation fails
 */
export async function createInvoice(
  userID: string,
  invoiceData: Omit<Invoice, 'invoiceID' | 'userID' | 'createdAt'>
): Promise<Invoice> {
  // Get next sequence number for this user
  const sequence = await getNextInvoiceSequence(userID);

  // Generate invoice ID
  const invoiceID = generateInvoiceID(sequence);

  // Get current date in ISO format (YYYY-MM-DD)
  const createdAt = new Date().toISOString().split('T')[0];

  // Create complete invoice object
  const invoice: Invoice = {
    invoiceID,
    userID,
    createdAt,
    ...invoiceData
  };

  // Validate complete invoice object
  const validated = invoiceSchema.parse(invoice);

  // Store in database
  await dbCreateInvoice(userID, validated);

  return validated;
}

/**
 * Get invoice by ID.
 * @param userID - User's unique identifier
 * @param invoiceID - Invoice ID
 * @returns Invoice object or null if not found
 */
export async function getInvoice(
  userID: string,
  invoiceID: string
): Promise<Invoice | null> {
  return dbGetInvoice(userID, invoiceID);
}

/**
 * Update invoice fields.
 * Cannot change invoiceID or userID.
 * @param userID - User's unique identifier
 * @param invoiceID - Invoice ID
 * @param updates - Partial invoice data to update
 * @returns Updated invoice object
 * @throws Error if invoice not found or validation fails
 */
export async function updateInvoice(
  userID: string,
  invoiceID: string,
  updates: Partial<Omit<Invoice, 'invoiceID' | 'userID' | 'createdAt'>>
): Promise<Invoice> {
  // Get existing invoice to verify it exists
  const existing = await dbGetInvoice(userID, invoiceID);
  if (!existing) {
    throw new Error('Invoice not found');
  }

  // Update in database
  await dbUpdateInvoice(userID, invoiceID, updates);

  // Return updated invoice
  const updated = await dbGetInvoice(userID, invoiceID);
  if (!updated) {
    throw new Error('Failed to retrieve updated invoice');
  }

  return updated;
}

/**
 * Delete an invoice.
 * @param userID - User's unique identifier
 * @param invoiceID - Invoice ID
 */
export async function deleteInvoice(userID: string, invoiceID: string): Promise<void> {
  await dbDeleteInvoice(userID, invoiceID);
}

/**
 * List all invoices for a user.
 * @param userID - User's unique identifier
 * @returns Array of invoices (empty if none exist)
 */
export async function listUserInvoices(userID: string): Promise<Invoice[]> {
  return dbListInvoices(userID);
}

// Made with Bob