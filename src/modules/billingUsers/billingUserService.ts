/**
 * Billing User Service
 * Handles CRUD operations for billing users
 */

import { z } from 'zod';
import { billingUserSchema, type BillingUser } from '@/models/billingUser';
import { generateID } from '@/lib/idGenerator';
import * as billingUsersDB from '@/lib/db/billingUsers';
import * as billingHistoryDB from '@/lib/db/billingHistory';

// Input validation schemas
const createBillingUserInput = billingUserSchema.omit({ billingUserID: true, createdAt: true });
const updateBillingUserInput = billingUserSchema
  .omit({ billingUserID: true, companyID: true, createdAt: true })
  .partial();

export type CreateBillingUserInput = z.infer<typeof createBillingUserInput>;
export type UpdateBillingUserInput = z.infer<typeof updateBillingUserInput>;

/**
 * Create a new billing user
 */
export async function createBillingUser(
  companyID: string,
  data: CreateBillingUserInput
): Promise<BillingUser> {
  // Validate input
  const validated = createBillingUserInput.parse(data);

  // Generate ID and timestamp
  const billingUserID = generateID('BU');
  const createdAt = new Date().toISOString().split('T')[0];

  // Create complete billing user object
  const billingUser: BillingUser = {
    billingUserID,
    createdAt,
    ...validated,
    companyID,
  };

  // Store in database
  await billingUsersDB.createBillingUser(billingUser);

  return billingUser;
}

/**
 * Get a single billing user by ID
 */
export async function getBillingUser(billingUserID: string): Promise<BillingUser | null> {
  return billingUsersDB.getBillingUser(billingUserID);
}

/**
 * Update a billing user
 */
export async function updateBillingUser(
  billingUserID: string,
  updates: UpdateBillingUserInput
): Promise<BillingUser> {
  // Validate input
  const validated = updateBillingUserInput.parse(updates);

  // Check if billing user exists
  const existing = await billingUsersDB.getBillingUser(billingUserID);
  if (!existing) {
    throw new Error(`Billing user ${billingUserID} not found`);
  }

  // Update billing user
  await billingUsersDB.updateBillingUser(billingUserID, validated);

  // Fetch and return updated billing user
  const updated = await billingUsersDB.getBillingUser(billingUserID);
  if (!updated) {
    throw new Error(`Failed to retrieve updated billing user ${billingUserID}`);
  }

  return updated;
}

/**
 * Delete a billing user
 * Checks for cascade constraints (billing history entries)
 */
export async function deleteBillingUser(billingUserID: string): Promise<void> {
  // Check if billing user exists
  const existing = await billingUsersDB.getBillingUser(billingUserID);
  if (!existing) {
    throw new Error(`Billing user ${billingUserID} not found`);
  }

  // Check for billing history entries
  const historyEntries = await billingHistoryDB.listBillingHistoryForUser(billingUserID, {});
  if (historyEntries.length > 0) {
    throw new Error(
      `Cannot delete billing user ${billingUserID}: ${historyEntries.length} billing history entries exist`
    );
  }

  // Delete billing user
  await billingUsersDB.deleteBillingUser(billingUserID);
}

/**
 * List all billing users for a company
 */
export async function listBillingUsers(companyID: string): Promise<BillingUser[]> {
  return billingUsersDB.listBillingUsers(companyID);
}

// Made with Bob