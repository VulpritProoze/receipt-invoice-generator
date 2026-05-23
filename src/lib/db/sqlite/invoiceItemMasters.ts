import { db } from '@/lib/db.sqlite';
import { InvoiceItemMaster, invoiceItemMasterSchema } from '@/models/invoice';

/**
 * SQLite database operations for InvoiceItemMaster entities.
 */

export async function createInvoiceItemMaster(
  invoiceItemMaster: InvoiceItemMaster
): Promise<void> {
  const validated = invoiceItemMasterSchema.parse(invoiceItemMaster);

  const stmt = db.prepare(`
    INSERT INTO invoice_item_masters (invoice_item_id, company_id, description, default_rate, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    validated.invoiceItemID,
    validated.companyID,
    validated.description,
    validated.defaultRate,
    validated.createdAt
  );
}

export async function getInvoiceItemMaster(
  invoiceItemID: string
): Promise<InvoiceItemMaster | null> {
  const stmt = db.prepare(`
    SELECT 
      invoice_item_id as invoiceItemID,
      company_id as companyID,
      description,
      default_rate as defaultRate,
      created_at as createdAt
    FROM invoice_item_masters
    WHERE invoice_item_id = ?
  `);
  const row = stmt.get(invoiceItemID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    return invoiceItemMasterSchema.parse(row);
  } catch (error) {
    throw new Error(
      `Invalid invoice item master data in database for invoiceItemID: ${invoiceItemID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function getInvoiceItemMasterByDescription(
  companyID: string,
  description: string
): Promise<InvoiceItemMaster | null> {
  const stmt = db.prepare(`
    SELECT 
      invoice_item_id as invoiceItemID,
      company_id as companyID,
      description,
      default_rate as defaultRate,
      created_at as createdAt
    FROM invoice_item_masters
    WHERE company_id = ? AND LOWER(description) = LOWER(?)
  `);
  const row = stmt.get(companyID, description) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    return null;
  }

  try {
    return invoiceItemMasterSchema.parse(row);
  } catch (error) {
    throw new Error(
      `Invalid invoice item master data in database. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function updateInvoiceItemMaster(
  invoiceItemID: string,
  updates: Partial<
    Omit<InvoiceItemMaster, 'invoiceItemID' | 'companyID' | 'createdAt'>
  >
): Promise<void> {
  const existing = await getInvoiceItemMaster(invoiceItemID);

  if (!existing) {
    throw new Error(
      `Invoice item master not found for invoiceItemID: ${invoiceItemID}`
    );
  }

  const updated = { ...existing, ...updates };
  const validated = invoiceItemMasterSchema.parse(updated);

  const stmt = db.prepare(`
    UPDATE invoice_item_masters
    SET description = ?, default_rate = ?
    WHERE invoice_item_id = ?
  `);
  stmt.run(validated.description, validated.defaultRate, invoiceItemID);
}

export async function deleteInvoiceItemMaster(
  invoiceItemID: string
): Promise<void> {
  const stmt = db.prepare(`
    DELETE FROM invoice_item_masters
    WHERE invoice_item_id = ?
  `);
  stmt.run(invoiceItemID);
}

export async function listInvoiceItemMasters(
  companyID: string
): Promise<InvoiceItemMaster[]> {
  const stmt = db.prepare(`
    SELECT 
      invoice_item_id as invoiceItemID,
      company_id as companyID,
      description,
      default_rate as defaultRate,
      created_at as createdAt
    FROM invoice_item_masters
    WHERE company_id = ?
    ORDER BY description ASC
  `);
  const rows = stmt.all(companyID) as Record<string, unknown>[];

  return rows.map((row) => {
    try {
      return invoiceItemMasterSchema.parse(row);
    } catch (error) {
      throw new Error(
        `Invalid invoice item master data in database. Data integrity check failed.`,
        { cause: error }
      );
    }
  });
}

// Made with Bob
