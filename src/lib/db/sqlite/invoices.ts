import { db } from '@/lib/db.sqlite';
import {
  Invoice,
  invoiceSchema,
  InvoiceItem,
  invoiceItemSchema
} from '@/models/invoice';

/**
 * SQLite database operations for Invoice entities.
 */

export async function createInvoice(
  userID: string,
  invoice: Invoice
): Promise<void> {
  // Validate invoice data before storing
  const validated = invoiceSchema.parse(invoice);

  // Verify userID matches
  if (validated.userID !== userID) {
    throw new Error('Invoice userID does not match provided userID');
  }

  const stmt = db.prepare(`
    INSERT INTO invoices (
      invoice_id, user_id, invoice_date, terms, due_date, currency,
      bill_to, bill_to_address_line, bill_to_city_address, bill_to_postal_address, bill_to_country,
      invoice_items, tax_rate, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    validated.invoiceID,
    userID,
    validated.invoiceDate,
    validated.terms,
    validated.dueDate,
    validated.currency,
    validated.billTo,
    validated.billToAddressLine,
    validated.billToCityAddress,
    validated.billToPostalAddress,
    validated.billToCountry,
    JSON.stringify(validated.invoiceItems),
    validated.taxRate,
    validated.createdAt
  );
}

export async function getInvoice(
  userID: string,
  invoiceID: string
): Promise<Invoice | null> {
  const stmt = db.prepare(`
    SELECT 
      invoice_id as invoiceID, user_id as userID, invoice_date as invoiceDate, terms, due_date as dueDate, currency,
      bill_to as billTo, bill_to_address_line as billToAddressLine, bill_to_city_address as billToCityAddress,
      bill_to_postal_address as billToPostalAddress, bill_to_country as billToCountry,
      invoice_items as invoiceItems, tax_rate as taxRate, created_at as createdAt
    FROM invoices
    WHERE user_id = ? AND invoice_id = ?
  `);
  const row = stmt.get(userID, invoiceID) as Record<string, unknown> | undefined;

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
  userID: string,
  invoiceID: string,
  updates: Partial<Invoice>
): Promise<void> {
  const existing = await getInvoice(userID, invoiceID);

  if (!existing) {
    throw new Error(`Invoice not found: ${invoiceID}`);
  }

  const updated = { ...existing, ...updates };
  const validated = invoiceSchema.parse(updated);

  if (validated.userID !== userID) {
    throw new Error('Cannot change invoice userID');
  }

  if (validated.invoiceID !== invoiceID) {
    throw new Error('Cannot change invoiceID');
  }

  const stmt = db.prepare(`
    UPDATE invoices
    SET 
      invoice_date = ?, terms = ?, due_date = ?, currency = ?,
      bill_to = ?, bill_to_address_line = ?, bill_to_city_address = ?, bill_to_postal_address = ?, bill_to_country = ?,
      invoice_items = ?, tax_rate = ?, created_at = ?
    WHERE user_id = ? AND invoice_id = ?
  `);
  stmt.run(
    validated.invoiceDate,
    validated.terms,
    validated.dueDate,
    validated.currency,
    validated.billTo,
    validated.billToAddressLine,
    validated.billToCityAddress,
    validated.billToPostalAddress,
    validated.billToCountry,
    JSON.stringify(validated.invoiceItems),
    validated.taxRate,
    validated.createdAt,
    userID,
    invoiceID
  );
}

export async function deleteInvoice(
  userID: string,
  invoiceID: string
): Promise<void> {
  const stmt = db.prepare('DELETE FROM invoices WHERE user_id = ? AND invoice_id = ?');
  stmt.run(userID, invoiceID);
}

export async function listInvoices(userID: string): Promise<Invoice[]> {
  const stmt = db.prepare(`
    SELECT 
      invoice_id as invoiceID, user_id as userID, invoice_date as invoiceDate, terms, due_date as dueDate, currency,
      bill_to as billTo, bill_to_address_line as billToAddressLine, bill_to_city_address as billToCityAddress,
      bill_to_postal_address as billToPostalAddress, bill_to_country as billToCountry,
      invoice_items as invoiceItems, tax_rate as taxRate, created_at as createdAt
    FROM invoices
    WHERE user_id = ?
  `);
  const rows = stmt.all(userID) as Record<string, unknown>[];

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

export async function getNextInvoiceSequence(userID: string): Promise<number> {
  // Ensure the row exists
  db.prepare(`
    INSERT INTO invoice_sequences (user_id, next_value)
    VALUES (?, 0)
    ON CONFLICT(user_id) DO NOTHING
  `).run(userID);

  // Increment the sequence
  db.prepare(`
    UPDATE invoice_sequences
    SET next_value = next_value + 1
    WHERE user_id = ?
  `).run(userID);

  // Get and return the sequence value
  const row = db.prepare(`
    SELECT next_value
    FROM invoice_sequences
    WHERE user_id = ?
  `).get(userID) as { next_value: number };

  return row.next_value;
}

export async function createInvoiceItem(
  userID: string,
  item: InvoiceItem
): Promise<void> {
  const validated = invoiceItemSchema.parse(item);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO invoice_items (item_id, user_id, quantity, description, rate, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    validated.itemID,
    userID,
    validated.quantity,
    validated.description,
    validated.rate,
    validated.date
  );
}

export async function getInvoiceItem(
  userID: string,
  itemID: string
): Promise<InvoiceItem | null> {
  const stmt = db.prepare(`
    SELECT item_id as itemID, quantity, description, rate, date
    FROM invoice_items
    WHERE user_id = ? AND item_id = ?
  `);
  const row = stmt.get(userID, itemID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    return invoiceItemSchema.parse(row);
  } catch (error) {
    throw new Error(
      `Invalid invoice item data in database for itemID: ${itemID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function listInvoiceItems(userID: string): Promise<InvoiceItem[]> {
  const stmt = db.prepare(`
    SELECT item_id as itemID, quantity, description, rate, date
    FROM invoice_items
    WHERE user_id = ?
  `);
  const rows = stmt.all(userID) as Record<string, unknown>[];

  const items: InvoiceItem[] = [];
  for (const row of rows) {
    try {
      const parsed = invoiceItemSchema.parse(row);
      items.push(parsed);
    } catch (error) {
      console.error(`Invalid invoice item data for itemID ${row.itemID}:`, error);
    }
  }

  // Sort by date descending
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteInvoiceItem(
  userID: string,
  itemID: string
): Promise<void> {
  const stmt = db.prepare('DELETE FROM invoice_items WHERE user_id = ? AND item_id = ?');
  stmt.run(userID, itemID);
}
