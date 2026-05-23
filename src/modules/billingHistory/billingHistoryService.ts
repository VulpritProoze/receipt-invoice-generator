/**
 * Billing History Service
 * Handles billing history entries and their lifecycle
 */

import { z } from 'zod';
import { billingHistorySchema, type BillingHistory } from '@/models/billingHistory';
import { generateID } from '@/lib/idGenerator';
import * as billingHistoryDB from '@/lib/db/billingHistory';
import * as billingUsersDB from '@/lib/db/billingUsers';
import * as invoiceItemMastersDB from '@/lib/db/invoiceItemMasters';

// Input validation schemas
const createBillingHistoryInput = billingHistorySchema.omit({
  billingHistoryID: true,
  billingUserID: true,
  invoiceItemID: true,
  billedStatus: true,
  invoiceID: true,
  createdAt: true,
});

export type CreateBillingHistoryInput = z.infer<typeof createBillingHistoryInput>;

export interface BillingHistoryFilters {
  startDate?: string;
  endDate?: string;
  billedStatus?: 'unbilled' | 'billed';
  invoiceItemID?: string;
}

/**
 * Create a new billing history entry
 */
export async function createBillingHistory(
  billingUserID: string,
  invoiceItemID: string,
  data: CreateBillingHistoryInput
): Promise<BillingHistory> {
  // Validate input
  const validated = createBillingHistoryInput.parse(data);

  // Verify billing user exists
  const billingUser = await billingUsersDB.getBillingUser(billingUserID);
  if (!billingUser) {
    throw new Error(`Billing user ${billingUserID} not found`);
  }

  // Verify invoice item exists
  const invoiceItem = await invoiceItemMastersDB.getInvoiceItemMaster(invoiceItemID);
  if (!invoiceItem) {
    throw new Error(`Invoice item ${invoiceItemID} not found`);
  }

  // Generate ID and timestamp
  const billingHistoryID = generateID('BH');
  const createdAt = new Date().toISOString().split('T')[0];

  // Create complete billing history object
  const billingHistory: BillingHistory = {
    billingHistoryID,
    billingUserID,
    invoiceItemID,
    billedStatus: 'unbilled',
    invoiceID: null,
    createdAt,
    ...validated,
  };

  // Store in database
  await billingHistoryDB.createBillingHistory(billingHistory);

  return billingHistory;
}

/**
 * Get billing history for a user with optional filters
 */
export async function getBillingHistoryForUser(
  billingUserID: string,
  filters: BillingHistoryFilters
): Promise<BillingHistory[]> {
  return billingHistoryDB.listBillingHistoryForUser(billingUserID, filters);
}

/**
 * Get billing history for a specific invoice item
 */
export async function getBillingHistoryForItem(
  billingUserID: string,
  invoiceItemID: string,
  filters: BillingHistoryFilters
): Promise<BillingHistory[]> {
  return billingHistoryDB.listBillingHistoryForItem(billingUserID, invoiceItemID, filters);
}

/**
 * Get all unbilled history entries for a user
 */
export async function getUnbilledHistory(billingUserID: string): Promise<BillingHistory[]> {
  return billingHistoryDB.listBillingHistoryForUser(billingUserID, { billedStatus: 'unbilled' });
}

/**
 * Mark multiple billing history entries as billed
 */
export async function markAsBilled(
  billingHistoryIDs: string[],
  invoiceID: string
): Promise<void> {
  if (billingHistoryIDs.length === 0) {
    throw new Error('No billing history IDs provided');
  }

  // Verify all entries exist and are unbilled
  for (const id of billingHistoryIDs) {
    const entry = await billingHistoryDB.getBillingHistory(id);
    if (!entry) {
      throw new Error(`Billing history entry ${id} not found`);
    }
    if (entry.invoiceID !== null) {
      throw new Error(`Billing history entry ${id} is already billed`);
    }
  }

  // Mark all as billed
  await billingHistoryDB.markBillingHistoryAsBilled(billingHistoryIDs, invoiceID);
}

// Made with Bob