import { redis } from '@/lib/redis';
import { Receipt, receiptSchema } from '@/models/receipt';
// SQLite is loaded lazily (dynamic import) so it is never evaluated when USE_REDIS=true

/**
 * Database operations for Receipt entities.
 * Routes to SQLite (default) or Redis based on USE_REDIS environment variable.
 */

const useRedis = process.env.USE_REDIS === 'true';

/**
 * Create a new receipt.
 * Creates a secondary index by invoiceID for lookups.
 */
export async function createReceipt(
  userID: string,
  receipt: Receipt
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Validate receipt data before storing
    const validated = receiptSchema.parse(receipt);

    // Verify userID matches
    if (validated.userID !== userID) {
      throw new Error('Receipt userID does not match provided userID');
    }

    // Store receipt data
    await redis.set(`receipt:${userID}:${validated.receiptID}`, validated);

    // Create invoice index for getReceiptByInvoiceID
    await redis.set(
      `receipt:invoice:${userID}:${validated.invoiceID}`,
      validated.receiptID
    );
  } else {
    const sqliteReceipts = await import('./sqlite/receipts');
    return sqliteReceipts.createReceipt(userID, receipt);
  }
}

/**
 * Get a receipt by userID and receiptID.
 * Returns null if receipt does not exist.
 */
export async function getReceipt(
  userID: string,
  receiptID: string
): Promise<Receipt | null> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    const data = await redis.get<unknown>(`receipt:${userID}:${receiptID}`);

    if (!data) {
      return null;
    }

    // Validate retrieved data through schema
    try {
      return receiptSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid receipt data in database for receiptID: ${receiptID}. Data integrity check failed.`,
        { cause: error }
      );
    }
  } else {
    const sqliteReceipts = await import('./sqlite/receipts');
    return sqliteReceipts.getReceipt(userID, receiptID);
  }
}

/**
 * Get a receipt by its associated invoiceID.
 * Returns null if no receipt exists for that invoice.
 */
export async function getReceiptByInvoiceID(
  userID: string,
  invoiceID: string
): Promise<Receipt | null> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Look up receiptID from invoice index
    const receiptID = await redis.get<string>(
      `receipt:invoice:${userID}:${invoiceID}`
    );

    if (!receiptID) {
      return null;
    }

    // Retrieve receipt by ID
    return getReceipt(userID, receiptID);
  } else {
    const sqliteReceipts = await import('./sqlite/receipts');
    return sqliteReceipts.getReceiptByInvoiceID(userID, invoiceID);
  }
}

/**
 * List all receipts for a user.
 * Returns an empty array if user has no receipts.
 */
export async function listReceipts(userID: string): Promise<Receipt[]> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Find all receipt keys for this user
    const keys = await redis.keys(`receipt:${userID}:*`);

    if (keys.length === 0) {
      return [];
    }

    // Fetch all receipts
    const receipts: Receipt[] = [];

    for (const key of keys) {
      const data = await redis.get<unknown>(key);

      if (data) {
        try {
          const receipt = receiptSchema.parse(data);
          receipts.push(receipt);
        } catch (error) {
          // Log but don't fail the entire list operation for one bad record
          console.error(`Invalid receipt data at key ${key}:`, error);
        }
      }
    }

    // Sort by createdAt descending (newest first)
    return receipts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    const sqliteReceipts = await import('./sqlite/receipts');
    return sqliteReceipts.listReceipts(userID);
  }
}

/**
 * Delete a receipt and its invoice index.
 */
export async function deleteReceipt(
  userID: string,
  receiptID: string
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Get receipt to find its invoiceID for index cleanup
    const receipt = await getReceipt(userID, receiptID);

    if (!receipt) {
      // Receipt doesn't exist - this is not an error, operation is idempotent
      return;
    }

    // Delete invoice index
    await redis.del(`receipt:invoice:${userID}:${receipt.invoiceID}`);

    // Delete receipt data
    await redis.del(`receipt:${userID}:${receiptID}`);
  } else {
    const sqliteReceipts = await import('./sqlite/receipts');
    return sqliteReceipts.deleteReceipt(userID, receiptID);
  }
}

// Made with Bob
