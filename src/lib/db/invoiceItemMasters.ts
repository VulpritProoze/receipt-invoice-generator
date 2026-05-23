import { InvoiceItemMaster } from '@/models/invoice';
// SQLite is loaded lazily (dynamic import) so it is never evaluated when USE_REDIS=true

/**
 * Database operations for InvoiceItemMaster entities.
 * Routes to SQLite (default) or Redis based on USE_REDIS environment variable.
 */

const useRedis = process.env.USE_REDIS === 'true';

export async function createInvoiceItemMaster(
  invoiceItemMaster: InvoiceItemMaster
): Promise<void> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for invoice item masters not yet implemented'
    );
  } else {
    const sqliteInvoiceItemMasters = await import(
      './sqlite/invoiceItemMasters'
    );
    return sqliteInvoiceItemMasters.createInvoiceItemMaster(invoiceItemMaster);
  }
}

export async function getInvoiceItemMaster(
  invoiceItemID: string
): Promise<InvoiceItemMaster | null> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for invoice item masters not yet implemented'
    );
  } else {
    const sqliteInvoiceItemMasters = await import(
      './sqlite/invoiceItemMasters'
    );
    return sqliteInvoiceItemMasters.getInvoiceItemMaster(invoiceItemID);
  }
}

export async function getInvoiceItemMasterByDescription(
  companyID: string,
  description: string
): Promise<InvoiceItemMaster | null> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for invoice item masters not yet implemented'
    );
  } else {
    const sqliteInvoiceItemMasters = await import(
      './sqlite/invoiceItemMasters'
    );
    return sqliteInvoiceItemMasters.getInvoiceItemMasterByDescription(
      companyID,
      description
    );
  }
}

export async function updateInvoiceItemMaster(
  invoiceItemID: string,
  updates: Partial<
    Omit<InvoiceItemMaster, 'invoiceItemID' | 'companyID' | 'createdAt'>
  >
): Promise<void> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for invoice item masters not yet implemented'
    );
  } else {
    const sqliteInvoiceItemMasters = await import(
      './sqlite/invoiceItemMasters'
    );
    return sqliteInvoiceItemMasters.updateInvoiceItemMaster(
      invoiceItemID,
      updates
    );
  }
}

export async function deleteInvoiceItemMaster(
  invoiceItemID: string
): Promise<void> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for invoice item masters not yet implemented'
    );
  } else {
    const sqliteInvoiceItemMasters = await import(
      './sqlite/invoiceItemMasters'
    );
    return sqliteInvoiceItemMasters.deleteInvoiceItemMaster(invoiceItemID);
  }
}

export async function listInvoiceItemMasters(
  companyID: string
): Promise<InvoiceItemMaster[]> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for invoice item masters not yet implemented'
    );
  } else {
    const sqliteInvoiceItemMasters = await import(
      './sqlite/invoiceItemMasters'
    );
    return sqliteInvoiceItemMasters.listInvoiceItemMasters(companyID);
  }
}

// Made with Bob
