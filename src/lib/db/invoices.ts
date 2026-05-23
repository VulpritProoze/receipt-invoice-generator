import { redis } from '@/lib/redis';
import {
  Invoice,
  invoiceSchema
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
  billingUserID: string,
  invoice: Invoice
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Validate invoice data before storing
    const validated = invoiceSchema.parse(invoice);

    // Verify billingUserID matches
    if (validated.billingUserID !== billingUserID) {
      throw new Error('Invoice billingUserID does not match provided billingUserID');
    }

    // Store invoice data
    await redis.set(`invoice:${billingUserID}:${validated.invoiceID}`, validated);
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.createInvoice(billingUserID, invoice);
  }
}

/**
 * Get an invoice by billingUserID and invoiceID.
 * Returns null if invoice does not exist.
 */
export async function getInvoice(
  billingUserID: string,
  invoiceID: string
): Promise<Invoice | null> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    const data = await redis.get<unknown>(`invoice:${billingUserID}:${invoiceID}`);

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
    return sqliteInvoices.getInvoice(billingUserID, invoiceID);
  }
}

/**
 * Get an invoice by invoiceID alone.
 * Returns null if invoice does not exist.
 */
export async function getInvoiceByID(invoiceID: string): Promise<Invoice | null> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    const keys = await redis.keys(`invoice:*:${invoiceID}`);
    if (keys.length === 0) {
      return null;
    }

    const data = await redis.get<unknown>(keys[0]);
    if (!data) {
      return null;
    }

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
    return sqliteInvoices.getInvoiceByID(invoiceID);
  }
}

/**
 * Update an invoice's fields.
 * Only updates provided fields, leaves others unchanged.
 */
export async function updateInvoice(
  billingUserID: string,
  invoiceID: string,
  updates: Partial<Invoice>
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Get existing invoice
    const existing = await getInvoice(billingUserID, invoiceID);

    if (!existing) {
      throw new Error(`Invoice not found: ${invoiceID}`);
    }

    // Merge updates with existing data
    const updated = { ...existing, ...updates };

    // Validate merged data
    const validated = invoiceSchema.parse(updated);

    // Verify billingUserID hasn't changed
    if (validated.billingUserID !== billingUserID) {
      throw new Error('Cannot change invoice billingUserID');
    }

    // Verify invoiceID hasn't changed
    if (validated.invoiceID !== invoiceID) {
      throw new Error('Cannot change invoiceID');
    }

    // Store updated invoice
    await redis.set(`invoice:${billingUserID}:${invoiceID}`, validated);
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.updateInvoice(billingUserID, invoiceID, updates);
  }
}

/**
 * Delete an invoice.
 */
export async function deleteInvoice(
  billingUserID: string,
  invoiceID: string
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Delete invoice data - idempotent operation
    await redis.del(`invoice:${billingUserID}:${invoiceID}`);
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.deleteInvoice(billingUserID, invoiceID);
  }
}

/**
 * List all invoices for a billing user.
 * Returns an empty array if billing user has no invoices.
 */
export async function listInvoices(billingUserID: string): Promise<Invoice[]> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Find all invoice keys for this billing user
    const keys = await redis.keys(`invoice:${billingUserID}:*`);

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
    return sqliteInvoices.listInvoices(billingUserID);
  }
}

/**
 * Get the next invoice sequence number for a billing user.
 * Used to generate invoice IDs in format INV000000001, INV000000002, etc.
 */
export async function getNextInvoiceSequence(billingUserID: string): Promise<number> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Increment and return the sequence counter
    const sequence = await redis.incr(`invoice:sequence:${billingUserID}`);

    return sequence;
  } else {
    const sqliteInvoices = await import('./sqlite/invoices');
    return sqliteInvoices.getNextInvoiceSequence(billingUserID);
  }
}
