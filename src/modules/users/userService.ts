import { v4 as uuidv4 } from 'uuid';
import { User, userSchema } from '@/models/user';
import { maskCreditCard } from '@/lib/maskCreditCard';
import {
  createUser as dbCreateUser,
  getUser as dbGetUser,
  updateUser as dbUpdateUser,
  deleteUser as dbDeleteUser,
  getUserByEmail as dbGetUserByEmail
} from '@/lib/db/users';
import { listInvoices, deleteInvoice } from '@/lib/db/invoices';
import { listReceipts, deleteReceipt } from '@/lib/db/receipts';

/**
 * User service layer - handles business logic for user operations.
 * Coordinates between API routes and database operations.
 */

/**
 * Register a new user with generated UUID and masked credit card.
 * @param userData - User data without userID (will be generated)
 * @returns Created user with generated userID
 * @throws Error if email already exists or validation fails
 */
export async function registerUser(
  userData: Omit<User, 'userID'> & { creditCardNumber: string }
): Promise<User> {
  // Check if email already exists
  const existingUser = await dbGetUserByEmail(userData.userEmail);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Generate UUID for new user
  const userID = uuidv4();

  // Mask credit card number before storing
  const maskedCardNumber = maskCreditCard(userData.creditCardNumber);

  // Create user object with generated ID and masked card
  const user: User = {
    userID,
    username: userData.username,
    userEmail: userData.userEmail,
    fullName: userData.fullName,
    creditCardNumber: maskedCardNumber,
    creditCardType: userData.creditCardType
  };

  // Validate complete user object
  const validated = userSchema.parse(user);

  // Store in database
  await dbCreateUser(validated);

  return validated;
}

/**
 * Get user profile by userID.
 * @param userID - User's unique identifier
 * @returns User object or null if not found
 */
export async function getUserProfile(userID: string): Promise<User | null> {
  return dbGetUser(userID);
}

/**
 * Update user profile fields.
 * If credit card number is being updated, it will be masked.
 * @param userID - User's unique identifier
 * @param updates - Partial user data to update
 * @returns Updated user object
 * @throws Error if user not found or validation fails
 */
export async function updateUserProfile(
  userID: string,
  updates: Partial<Omit<User, 'userID'>> & { creditCardNumber?: string }
): Promise<User> {
  // Get existing user to verify it exists
  const existing = await dbGetUser(userID);
  if (!existing) {
    throw new Error('User not found');
  }

  // If updating credit card, mask it
  const processedUpdates: Partial<User> = { ...updates };
  if (updates.creditCardNumber) {
    processedUpdates.creditCardNumber = maskCreditCard(updates.creditCardNumber);
  }

  // If updating email, check it's not taken by another user
  if (updates.userEmail && updates.userEmail !== existing.userEmail) {
    const emailTaken = await dbGetUserByEmail(updates.userEmail);
    if (emailTaken && emailTaken.userID !== userID) {
      throw new Error('Email already in use by another account');
    }
  }

  // Update in database
  await dbUpdateUser(userID, processedUpdates);

  // Return updated user
  const updated = await dbGetUser(userID);
  if (!updated) {
    throw new Error('Failed to retrieve updated user');
  }

  return updated;
}

/**
 * Delete user account and all associated data (cascade delete).
 * Deletes: user profile, all invoices, all receipts, company config.
 * @param userID - User's unique identifier
 */
export async function deleteUserAccount(userID: string): Promise<void> {
  // Get user to verify it exists
  const user = await dbGetUser(userID);
  if (!user) {
    // User doesn't exist - operation is idempotent
    return;
  }

  // Delete all user's receipts
  const receipts = await listReceipts(userID);
  for (const receipt of receipts) {
    await deleteReceipt(userID, receipt.receiptID);
  }

  // Delete all user's invoices
  const invoices = await listInvoices(userID);
  for (const invoice of invoices) {
    await deleteInvoice(userID, invoice.invoiceID);
  }

  // Note: Company config deletion would go here when implemented
  // For now, the database layer doesn't expose deleteCompanyConfig
  // This is acceptable as the company config is scoped to userID

  // Finally, delete the user
  await dbDeleteUser(userID);
}

/**
 * Find user by email address.
 * @param email - Email address to search for
 * @returns User object or null if not found
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return dbGetUserByEmail(email);
}

// Made with Bob