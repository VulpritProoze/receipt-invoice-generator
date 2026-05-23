import { db } from '@/lib/db.sqlite';
import { BillingHistory, billingHistorySchema } from '@/models/billingHistory';

/**
 * SQLite database operations for BillingHistory entities.
 */

export async function createBillingHistory(
  billingHistory: BillingHistory
): Promise<void> {
  const validated = billingHistorySchema.parse(billingHistory);

  const stmt = db.prepare(`
    INSERT INTO billing_history (billing_history_id, billing_user_id, invoice_item_id, quantity, rate, date, billed_status, invoice_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    validated.billingHistoryID,
    validated.billingUserID,
    validated.invoiceItemID,
    validated.quantity,
    validated.rate,
    validated.date,
    validated.billedStatus,
    validated.invoiceID,
    validated.createdAt
  );
}

export async function getBillingHistory(
  billingHistoryID: string
): Promise<BillingHistory | null> {
  const stmt = db.prepare(`
    SELECT 
      billing_history_id as billingHistoryID,
      billing_user_id as billingUserID,
      invoice_item_id as invoiceItemID,
      quantity,
      rate,
      date,
      billed_status as billedStatus,
      invoice_id as invoiceID,
      created_at as createdAt
    FROM billing_history
    WHERE billing_history_id = ?
  `);
  const row = stmt.get(billingHistoryID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    return billingHistorySchema.parse(row);
  } catch (error) {
    throw new Error(
      `Invalid billing history data in database for billingHistoryID: ${billingHistoryID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

interface BillingHistoryFilters {
  startDate?: string;
  endDate?: string;
  billedStatus?: 'unbilled' | 'billed';
  invoiceItemID?: string;
}

export async function listBillingHistoryForUser(
  billingUserID: string,
  filters?: BillingHistoryFilters
): Promise<BillingHistory[]> {
  let query = `
    SELECT 
      billing_history_id as billingHistoryID,
      billing_user_id as billingUserID,
      invoice_item_id as invoiceItemID,
      quantity,
      rate,
      date,
      billed_status as billedStatus,
      invoice_id as invoiceID,
      created_at as createdAt
    FROM billing_history
    WHERE billing_user_id = ?
  `;

  const params: unknown[] = [billingUserID];

  if (filters?.startDate) {
    query += ` AND date >= ?`;
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    query += ` AND date <= ?`;
    params.push(filters.endDate);
  }

  if (filters?.billedStatus) {
    query += ` AND billed_status = ?`;
    params.push(filters.billedStatus);
  }

  if (filters?.invoiceItemID) {
    query += ` AND invoice_item_id = ?`;
    params.push(filters.invoiceItemID);
  }

  query += ` ORDER BY date DESC, created_at DESC`;

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];

  return rows.map((row) => {
    try {
      return billingHistorySchema.parse(row);
    } catch (error) {
      throw new Error(
        `Invalid billing history data in database. Data integrity check failed.`,
        { cause: error }
      );
    }
  });
}

export async function listBillingHistoryForItem(
  billingUserID: string,
  invoiceItemID: string,
  filters?: Omit<BillingHistoryFilters, 'invoiceItemID'>
): Promise<BillingHistory[]> {
  return listBillingHistoryForUser(billingUserID, {
    ...filters,
    invoiceItemID
  });
}

export async function markBillingHistoryAsBilled(
  billingHistoryIDs: string[],
  invoiceID: string
): Promise<void> {
  if (billingHistoryIDs.length === 0) {
    return;
  }

  const placeholders = billingHistoryIDs.map(() => '?').join(',');
  const stmt = db.prepare(`
    UPDATE billing_history
    SET billed_status = 'billed', invoice_id = ?
    WHERE billing_history_id IN (${placeholders})
  `);
  stmt.run(invoiceID, ...billingHistoryIDs);
}

export async function unmarkBillingHistoryAsBilled(
  billingHistoryIDs: string[]
): Promise<void> {
  if (billingHistoryIDs.length === 0) {
    return;
  }

  const placeholders = billingHistoryIDs.map(() => '?').join(',');
  const stmt = db.prepare(`
    UPDATE billing_history
    SET billed_status = 'unbilled', invoice_id = NULL
    WHERE billing_history_id IN (${placeholders})
  `);
  stmt.run(...billingHistoryIDs);
}

export async function deleteBillingHistory(
  billingHistoryID: string
): Promise<void> {
  const stmt = db.prepare(`
    DELETE FROM billing_history
    WHERE billing_history_id = ?
  `);
  stmt.run(billingHistoryID);
}

export async function getBillingHistoriesByIDs(
  billingHistoryIDs: string[]
): Promise<BillingHistory[]> {
  if (billingHistoryIDs.length === 0) {
    return [];
  }

  const placeholders = billingHistoryIDs.map(() => '?').join(',');
  const stmt = db.prepare(`
    SELECT 
      billing_history_id as billingHistoryID,
      billing_user_id as billingUserID,
      invoice_item_id as invoiceItemID,
      quantity,
      rate,
      date,
      billed_status as billedStatus,
      invoice_id as invoiceID,
      created_at as createdAt
    FROM billing_history
    WHERE billing_history_id IN (${placeholders})
    ORDER BY date ASC
  `);
  const rows = stmt.all(...billingHistoryIDs) as Record<string, unknown>[];

  return rows.map((row) => {
    try {
      return billingHistorySchema.parse(row);
    } catch (error) {
      throw new Error(
        `Invalid billing history data in database. Data integrity check failed.`,
        { cause: error }
      );
    }
  });
}

// Made with Bob
