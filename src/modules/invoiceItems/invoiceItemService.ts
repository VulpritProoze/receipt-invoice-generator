/**
 * Invoice Item Master Service
 * Handles CRUD operations for invoice item masters (catalog of billable services)
 */

import { z } from 'zod';
import { invoiceItemMasterSchema, type InvoiceItemMaster } from '@/models/invoice';
import { generateID } from '@/lib/idGenerator';
import * as invoiceItemMastersDB from '@/lib/db/invoiceItemMasters';
import * as billingHistoryDB from '@/lib/db/billingHistory';

// Input validation schemas
const createInvoiceItemInput = invoiceItemMasterSchema.omit({
  invoiceItemID: true,
  companyID: true,
  createdAt: true,
});
const updateInvoiceItemInput = invoiceItemMasterSchema
  .omit({ invoiceItemID: true, companyID: true, createdAt: true })
  .partial();

export type CreateInvoiceItemInput = z.infer<typeof createInvoiceItemInput>;
export type UpdateInvoiceItemInput = z.infer<typeof updateInvoiceItemInput>;

/**
 * Create a new invoice item master
 */
export async function createInvoiceItem(
  companyID: string,
  data: CreateInvoiceItemInput
): Promise<InvoiceItemMaster> {
  // Validate input
  const validated = createInvoiceItemInput.parse(data);

  // Generate ID and timestamp
  const invoiceItemID = generateID('II');
  const createdAt = new Date().toISOString().split('T')[0];

  // Create complete invoice item object
  const invoiceItem: InvoiceItemMaster = {
    invoiceItemID,
    companyID,
    createdAt,
    ...validated,
  };

  // Store in database
  await invoiceItemMastersDB.createInvoiceItemMaster(invoiceItem);

  return invoiceItem;
}

/**
 * Get a single invoice item master by ID
 */
export async function getInvoiceItem(
  invoiceItemID: string
): Promise<InvoiceItemMaster | null> {
  return invoiceItemMastersDB.getInvoiceItemMaster(invoiceItemID);
}

/**
 * Get invoice item master by description (case-insensitive)
 * Used for import matching
 */
export async function getInvoiceItemByDescription(
  companyID: string,
  description: string
): Promise<InvoiceItemMaster | null> {
  return invoiceItemMastersDB.getInvoiceItemMasterByDescription(
    companyID,
    description
  );
}

/**
 * Update an invoice item master
 */
export async function updateInvoiceItem(
  invoiceItemID: string,
  updates: UpdateInvoiceItemInput
): Promise<InvoiceItemMaster> {
  // Validate input
  const validated = updateInvoiceItemInput.parse(updates);

  // Check if invoice item exists
  const existing = await invoiceItemMastersDB.getInvoiceItemMaster(invoiceItemID);
  if (!existing) {
    throw new Error(`Invoice item ${invoiceItemID} not found`);
  }

  // Update invoice item
  await invoiceItemMastersDB.updateInvoiceItemMaster(invoiceItemID, validated);

  // Fetch and return updated invoice item
  const updated = await invoiceItemMastersDB.getInvoiceItemMaster(invoiceItemID);
  if (!updated) {
    throw new Error(`Failed to retrieve updated invoice item ${invoiceItemID}`);
  }

  return updated;
}

/**
 * Delete an invoice item master
 * Checks for cascade constraints (billing history entries)
 */
export async function deleteInvoiceItem(invoiceItemID: string): Promise<void> {
  // Check if invoice item exists
  const existing = await invoiceItemMastersDB.getInvoiceItemMaster(invoiceItemID);
  if (!existing) {
    throw new Error(`Invoice item ${invoiceItemID} not found`);
  }

  // Check for billing history entries using this item
  const historyEntries = await billingHistoryDB.listBillingHistoryForUser('', {
    invoiceItemID,
  });
  if (historyEntries.length > 0) {
    throw new Error(
      `Cannot delete invoice item ${invoiceItemID}: ${historyEntries.length} billing history entries exist`
    );
  }

  // Delete invoice item
  await invoiceItemMastersDB.deleteInvoiceItemMaster(invoiceItemID);
}

/**
 * List all invoice item masters for a company
 */
export async function listInvoiceItems(
  companyID: string
): Promise<InvoiceItemMaster[]> {
  return invoiceItemMastersDB.listInvoiceItemMasters(companyID);
}

// Made with Bob
