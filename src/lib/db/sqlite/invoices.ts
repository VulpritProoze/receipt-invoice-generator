import { db } from '@/lib/db.sqlite';
import {
  Invoice,
  invoiceSchema
} from '@/models/invoice';

/**
 * SQLite database operations for Invoice entities.
 */

export async function createInvoice(
  billingUserID: string,
  invoice: Invoice
): Promise<void> {
  // Validate invoice data before storing
  const validated = invoiceSchema.parse(invoice);

  // Verify billingUserID matches
  if (validated.billingUserID !== billingUserID) {
    throw new Error('Invoice billingUserID does not match provided billingUserID');
  }

  const stmt = db.prepare(`
    INSERT INTO invoices (
      invoice_id, billing_user_id, invoice_date, terms, due_date, currency,
      invoice_items, tax_rate, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    validated.invoiceID,
    billingUserID,
    validated.invoiceDate,
    validated.terms,
    validated.dueDate,
    validated.currency,
    JSON.stringify(validated.invoiceItems),
    validated.taxRate,
    validated.createdAt
  );
}

export async function getInvoice(
  billingUserID: string,
  invoiceID: string
): Promise<Invoice | null> {
  const stmt = db.prepare(`
    SELECT 
      invoice_id as invoiceID, billing_user_id as billingUserID, invoice_date as invoiceDate, terms, due_date as dueDate, currency,
      invoice_items as invoiceItems, tax_rate as taxRate, created_at as createdAt
    FROM invoices
    WHERE billing_user_id = ? AND invoice_id = ?
  `);
  const row = stmt.get(billingUserID, invoiceID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    const invoiceItems = JSON.parse(row.invoiceItems as string);
    const invoiceObj = {
      ...row,
      invoiceItems
    };
    return invoiceSchema.parse(invoiceObj);
  } catch (error) {
    throw new Error(
      `Invalid invoice data in database for invoiceID: ${invoiceID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function getInvoiceByID(
  invoiceID: string
): Promise<Invoice | null> {
  const stmt = db.prepare(`
    SELECT 
      invoice_id as invoiceID, billing_user_id as billingUserID, invoice_date as invoiceDate, terms, due_date as dueDate, currency,
      invoice_items as invoiceItems, tax_rate as taxRate, created_at as createdAt
    FROM invoices
    WHERE invoice_id = ?
  `);
  const row = stmt.get(invoiceID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    const invoiceItems = JSON.parse(row.invoiceItems as string);
    const invoiceObj = {
      ...row,
      invoiceItems
    };
    return invoiceSchema.parse(invoiceObj);
  } catch (error) {
    throw new Error(
      `Invalid invoice data in database for invoiceID: ${invoiceID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function updateInvoice(
  billingUserID: string,
  invoiceID: string,
  updates: Partial<Invoice>
): Promise<void> {
  const existing = await getInvoice(billingUserID, invoiceID);

  if (!existing) {
    throw new Error(`Invoice not found: ${invoiceID}`);
  }

  const updated = { ...existing, ...updates };
  const validated = invoiceSchema.parse(updated);

  if (validated.billingUserID !== billingUserID) {
    throw new Error('Cannot change invoice billingUserID');
  }

  if (validated.invoiceID !== invoiceID) {
    throw new Error('Cannot change invoiceID');
  }

  const stmt = db.prepare(`
    UPDATE invoices
    SET 
      invoice_date = ?, terms = ?, due_date = ?, currency = ?,
      invoice_items = ?, tax_rate = ?, created_at = ?
    WHERE billing_user_id = ? AND invoice_id = ?
  `);
  stmt.run(
    validated.invoiceDate,
    validated.terms,
    validated.dueDate,
    validated.currency,
    JSON.stringify(validated.invoiceItems),
    validated.taxRate,
    validated.createdAt,
    billingUserID,
    invoiceID
  );
}

export async function deleteInvoice(
  billingUserID: string,
  invoiceID: string
): Promise<void> {
  const stmt = db.prepare('DELETE FROM invoices WHERE billing_user_id = ? AND invoice_id = ?');
  stmt.run(billingUserID, invoiceID);
}

export async function listInvoices(billingUserID: string): Promise<Invoice[]> {
  const stmt = db.prepare(`
    SELECT 
      invoice_id as invoiceID, billing_user_id as billingUserID, invoice_date as invoiceDate, terms, due_date as dueDate, currency,
      invoice_items as invoiceItems, tax_rate as taxRate, created_at as createdAt
    FROM invoices
    WHERE billing_user_id = ?
  `);
  const rows = stmt.all(billingUserID) as Record<string, unknown>[];

  const invoices: Invoice[] = [];
  for (const row of rows) {
    try {
      const invoiceItems = JSON.parse(row.invoiceItems as string);
      const invoiceObj = {
        ...row,
        invoiceItems
      };
      const parsed = invoiceSchema.parse(invoiceObj);
      invoices.push(parsed);
    } catch (error) {
      console.error(`Invalid invoice data for invoiceID ${row.invoiceID}:`, error);
    }
  }

  // Sort by createdAt descending
  return invoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getNextInvoiceSequence(billingUserID: string): Promise<number> {
  // Ensure the row exists
  db.prepare(`
    INSERT INTO invoice_sequences (billing_user_id, next_value)
    VALUES (?, 0)
    ON CONFLICT(billing_user_id) DO NOTHING
  `).run(billingUserID);

  // Increment the sequence
  db.prepare(`
    UPDATE invoice_sequences
    SET next_value = next_value + 1
    WHERE billing_user_id = ?
  `).run(billingUserID);

  // Get and return the sequence value
  const row = db.prepare(`
    SELECT next_value
    FROM invoice_sequences
    WHERE billing_user_id = ?
  `).get(billingUserID) as { next_value: number };

  return row.next_value;
}
