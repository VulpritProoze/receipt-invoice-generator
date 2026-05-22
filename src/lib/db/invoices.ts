import { redis } from '@/lib/redis';
import {
  Invoice,
  invoiceSchema,
  InvoiceItem,
  invoiceItemSchema
} from '@/models/invoice';
// SQLite is loaded lazily (dynamic import) so it is never evaluated when USE_REDIS=true

/**
 * Database operations for Invoice entities.
 * Routes to SQLite (default) or Redis based on USE_REDIS environment variable.
 *
 * SQLite: Used for local development and testing
 * Redis: Used for production deployment with Upstash
 */

const useRedis = process.env.USE_REDIS === 'true';

/**
 * Create a new invoice.
 */
export async function createInvoice(
  userID: string,
  invoice: Invoice
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Validate invoice data before storing
    const validated = invoiceSchema.parse(invoice);

    // Verify userID matches
    if (validated.userID !== userID) {
      throw new Error('Invoice userID does not match provided userID');
    }

    // Store invoice data
    await redis.set(`invoice:${userID}:${validated.invoiceID}`, validated);
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.createInvoice(userID, invoice);
  }
}

/**
 * Get an invoice by userID and invoiceID.
 * Returns null if invoice does not exist.
 */
export async function getInvoice(
  userID: string,
  invoiceID: string
): Promise<Invoice | null> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    const data = await redis.get<unknown>(`invoice:${userID}:${invoiceID}`);

    if (!data) {
      return null;
    }

    // Validate retrieved data through schema
    try {
      return invoiceSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid invoice data in database for invoiceID: ${invoiceID}. Data integrity check failed.`,
        { cause: error }
      );
    }
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.getInvoice(userID, invoiceID);
  }
}

/**
 * Update an invoice's fields.
 * Only updates provided fields, leaves others unchanged.
 */
export async function updateInvoice(
  userID: string,
  invoiceID: string,
  updates: Partial<Invoice>
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Get existing invoice
    const existing = await getInvoice(userID, invoiceID);

    if (!existing) {
      throw new Error(`Invoice not found: ${invoiceID}`);
    }

    // Merge updates with existing data
    const updated = { ...existing, ...updates };

    // Validate merged data
    const validated = invoiceSchema.parse(updated);

    // Verify userID hasn't changed
    if (validated.userID !== userID) {
      throw new Error('Cannot change invoice userID');
    }

    // Verify invoiceID hasn't changed
    if (validated.invoiceID !== invoiceID) {
      throw new Error('Cannot change invoiceID');
    }

    // Store updated invoice
    await redis.set(`invoice:${userID}:${invoiceID}`, validated);
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.updateInvoice(userID, invoiceID, updates);
  }
}

/**
 * Delete an invoice.
 */
export async function deleteInvoice(
  userID: string,
  invoiceID: string
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Delete invoice data - idempotent operation
    await redis.del(`invoice:${userID}:${invoiceID}`);
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.deleteInvoice(userID, invoiceID);
  }
}

/**
 * List all invoices for a user.
 * Returns an empty array if user has no invoices.
 */
export async function listInvoices(userID: string): Promise<Invoice[]> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Find all invoice keys for this user
    const keys = await redis.keys(`invoice:${userID}:*`);

    if (keys.length === 0) {
      return [];
    }

    // Fetch all invoices
    const invoices: Invoice[] = [];

    for (const key of keys) {
      const data = await redis.get<unknown>(key);

      if (data) {
        try {
          const invoice = invoiceSchema.parse(data);
          invoices.push(invoice);
        } catch (error) {
          // Log but don't fail the entire list operation for one bad record
          console.error(`Invalid invoice data at key ${key}:`, error);
        }
      }
    }

    // Sort by createdAt descending (newest first)
    return invoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.listInvoices(userID);
  }
}

/**
 * Get the next invoice sequence number for a user.
 * Used to generate invoice IDs in format INV000000001, INV000000002, etc.
 */
export async function getNextInvoiceSequence(userID: string): Promise<number> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Increment and return the sequence counter
    const sequence = await redis.incr(`invoice:sequence:${userID}`);

    return sequence;
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.getNextInvoiceSequence(userID);
  }
}

/**
 * Create a standalone invoice item.
 * Used for importing billing history before invoices are generated.
 */
export async function createInvoiceItem(
  userID: string,
  item: InvoiceItem
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Validate item data before storing
    const validated = invoiceItemSchema.parse(item);

    // Store invoice item data
    await redis.set(`invoiceItem:${userID}:${validated.itemID}`, validated);
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.createInvoiceItem(userID, item);
  }
}

/**
 * Get an invoice item by userID and itemID.
 * Returns null if item does not exist.
 */
export async function getInvoiceItem(
  userID: string,
  itemID: string
): Promise<InvoiceItem | null> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    const data = await redis.get<unknown>(`invoiceItem:${userID}:${itemID}`);

    if (!data) {
      return null;
    }

    // Validate retrieved data through schema
    try {
      return invoiceItemSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid invoice item data in database for itemID: ${itemID}. Data integrity check failed.`,
        { cause: error }
      );
    }
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.getInvoiceItem(userID, itemID);
  }
}

/**
 * List all invoice items for a user.
 * Returns an empty array if user has no items.
 * Used for invoice generation UI to select items.
 */
export async function listInvoiceItems(userID: string): Promise<InvoiceItem[]> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Find all invoice item keys for this user
    const keys = await redis.keys(`invoiceItem:${userID}:*`);

    if (keys.length === 0) {
      return [];
    }

    // Fetch all items
    const items: InvoiceItem[] = [];

    for (const key of keys) {
      const data = await redis.get<unknown>(key);

      if (data) {
        try {
          const item = invoiceItemSchema.parse(data);
          items.push(item);
        } catch (error) {
          // Log but don't fail the entire list operation for one bad record
          console.error(`Invalid invoice item data at key ${key}:`, error);
        }
      }
    }

    // Sort by date descending (newest first)
    return items.sort((a, b) => b.date.localeCompare(a.date));
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.listInvoiceItems(userID);
  }
}

/**
 * Delete an invoice item.
 */
export async function deleteInvoiceItem(
  userID: string,
  itemID: string
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Delete item data - idempotent operation
    await redis.del(`invoiceItem:${userID}:${itemID}`);
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.deleteInvoiceItem(userID, itemID);
  }
}
