import { Receipt, receiptSchema } from '@/models/receipt';
import { generateReceiptID } from '@/lib/idGenerator';
import {
  createReceipt as dbCreateReceipt,
  getReceipt as dbGetReceipt,
  getReceiptByInvoiceID as dbGetReceiptByInvoiceID,
  listReceipts as dbListReceipts,
  deleteReceipt as dbDeleteReceipt
} from '@/lib/db/receipts';
import { getInvoice } from '@/lib/db/invoices';
import { getUser } from '@/lib/db/users';

/**
 * Receipt service layer - handles business logic for receipt operations.
 * Coordinates between API routes and database operations.
 */

/**
 * Create a new receipt from an invoice.
 * SECURITY: Must validate that invoice exists and belongs to the user.
 * @param userID - User's unique identifier
 * @param receiptData - Receipt data without receiptID (will be generated)
 * @returns Created receipt with generated receiptID
 * @throws Error if invoice not found, validation fails, or receipt already exists for invoice
 */
export async function createReceipt(
  userID: string,
  receiptData: Omit<Receipt, 'receiptID' | 'userID' | 'createdAt' | 'accountBilled' | 'chargedTo'>
): Promise<Receipt> {
  // SECURITY REQUIREMENT: Verify invoice exists and belongs to this user
  const invoice = await getInvoice(userID, receiptData.invoiceID);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Check if receipt already exists for this invoice
  const existingReceipt = await dbGetReceiptByInvoiceID(userID, receiptData.invoiceID);
  if (existingReceipt) {
    throw new Error('Receipt already exists for this invoice');
  }

  // Get user to build accountBilled field
  const user = await getUser(userID);
  if (!user) {
    throw new Error('User not found');
  }

  // Generate receipt ID
  const receiptID = generateReceiptID();

  // Get current date in ISO format (YYYY-MM-DD)
  const createdAt = new Date().toISOString().split('T')[0];

  // Build accountBilled from user data: "username (email)"
  const accountBilled = `${user.username} (${user.userEmail})`;

  // Build chargedTo from user's credit card: "CardType **** **** **** 1234"
  const chargedTo = `${user.creditCardType} ${user.creditCardNumber}`;

  // Create complete receipt object
  // Use invoice items and total from the provided data (snapshot from invoice)
  const receipt: Receipt = {
    receiptID,
    userID,
    createdAt,
    accountBilled,
    chargedTo,
    date: receiptData.date,
    invoiceID: receiptData.invoiceID,
    invoiceItems: receiptData.invoiceItems,
    total: receiptData.total
  };

  // Validate complete receipt object
  const validated = receiptSchema.parse(receipt);

  // Store in database
  await dbCreateReceipt(userID, validated);

  return validated;
}

/**
 * Get receipt by ID.
 * @param userID - User's unique identifier
 * @param receiptID - Receipt ID
 * @returns Receipt object or null if not found
 */
export async function getReceipt(
  userID: string,
  receiptID: string
): Promise<Receipt | null> {
  return dbGetReceipt(userID, receiptID);
}

/**
 * Get receipt by invoice ID.
 * @param userID - User's unique identifier
 * @param invoiceID - Invoice ID
 * @returns Receipt object or null if not found
 */
export async function getReceiptByInvoice(
  userID: string,
  invoiceID: string
): Promise<Receipt | null> {
  return dbGetReceiptByInvoiceID(userID, invoiceID);
}

/**
 * List all receipts for a user.
 * @param userID - User's unique identifier
 * @returns Array of receipts (empty if none exist)
 */
export async function listUserReceipts(userID: string): Promise<Receipt[]> {
  return dbListReceipts(userID);
}

/**
 * Delete a receipt.
 * @param userID - User's unique identifier
 * @param receiptID - Receipt ID
 */
export async function deleteReceipt(userID: string, receiptID: string): Promise<void> {
  await dbDeleteReceipt(userID, receiptID);
}

// Made with Bob