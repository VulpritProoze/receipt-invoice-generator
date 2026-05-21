import { db } from '@/lib/db.sqlite';
import { Receipt, receiptSchema } from '@/models/receipt';

/**
 * SQLite database operations for Receipt entities.
 */

export async function createReceipt(
  userID: string,
  receipt: Receipt
): Promise<void> {
  // Validate receipt data before storing
  const validated = receiptSchema.parse(receipt);

  // Verify userID matches
  if (validated.userID !== userID) {
    throw new Error('Receipt userID does not match provided userID');
  }

  const stmt = db.prepare(`
    INSERT INTO receipts (
      receipt_id, user_id, date, account_billed, invoice_id, invoice_items, total, charged_to, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    validated.receiptID,
    userID,
    validated.date,
    validated.accountBilled,
    validated.invoiceID,
    JSON.stringify(validated.invoiceItems),
    validated.total,
    validated.chargedTo,
    validated.createdAt
  );
}

export async function getReceipt(
  userID: string,
  receiptID: string
): Promise<Receipt | null> {
  const stmt = db.prepare(`
    SELECT 
      receipt_id as receiptID, user_id as userID, date, account_billed as accountBilled,
      invoice_id as invoiceID, invoice_items as invoiceItems, total, charged_to as chargedTo,
      created_at as createdAt
    FROM receipts
    WHERE user_id = ? AND receipt_id = ?
  `);
  const row = stmt.get(userID, receiptID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    const invoiceItems = JSON.parse(row.invoiceItems);
    const receiptObj = {
      ...row,
      invoiceItems
    };
    return receiptSchema.parse(receiptObj);
  } catch (error) {
    throw new Error(
      `Invalid receipt data in database for receiptID: ${receiptID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function getReceiptByInvoiceID(
  userID: string,
  invoiceID: string
): Promise<Receipt | null> {
  const stmt = db.prepare(`
    SELECT 
      receipt_id as receiptID, user_id as userID, date, account_billed as accountBilled,
      invoice_id as invoiceID, invoice_items as invoiceItems, total, charged_to as chargedTo,
      created_at as createdAt
    FROM receipts
    WHERE user_id = ? AND invoice_id = ?
  `);
  const row = stmt.get(userID, invoiceID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    const invoiceItems = JSON.parse(row.invoiceItems);
    const receiptObj = {
      ...row,
      invoiceItems
    };
    return receiptSchema.parse(receiptObj);
  } catch (error) {
    throw new Error(
      `Invalid receipt data in database for invoiceID: ${invoiceID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function listReceipts(userID: string): Promise<Receipt[]> {
  const stmt = db.prepare(`
    SELECT 
      receipt_id as receiptID, user_id as userID, date, account_billed as accountBilled,
      invoice_id as invoiceID, invoice_items as invoiceItems, total, charged_to as chargedTo,
      created_at as createdAt
    FROM receipts
    WHERE user_id = ?
  `);
  const rows = stmt.all(userID) as Record<string, unknown>[];

  const receipts: Receipt[] = [];
  for (const row of rows) {
    try {
      const invoiceItems = JSON.parse(row.invoiceItems);
      const receiptObj = {
        ...row,
        invoiceItems
      };
      const parsed = receiptSchema.parse(receiptObj);
      receipts.push(parsed);
    } catch (error) {
      console.error(`Invalid receipt data for receiptID ${row.receiptID}:`, error);
    }
  }

  // Sort by createdAt descending
  return receipts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteReceipt(
  userID: string,
  receiptID: string
): Promise<void> {
  const stmt = db.prepare('DELETE FROM receipts WHERE user_id = ? AND receipt_id = ?');
  stmt.run(userID, receiptID);
}
