import { BillingHistory } from '@/models/billingHistory';
// SQLite is loaded lazily (dynamic import) so it is never evaluated when USE_REDIS=true

/**
 * Database operations for BillingHistory entities.
 * Routes to SQLite (default) or Redis based on USE_REDIS environment variable.
 */

const useRedis = process.env.USE_REDIS === 'true';

interface BillingHistoryFilters {
  startDate?: string;
  endDate?: string;
  billedStatus?: 'unbilled' | 'billed';
  invoiceItemID?: string;
}

export async function createBillingHistory(
  billingHistory: BillingHistory
): Promise<void> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for billing history not yet implemented'
    );
  } else {
    const sqliteBillingHistory = await import('./sqlite/billingHistory');
    return sqliteBillingHistory.createBillingHistory(billingHistory);
  }
}

export async function getBillingHistory(
  billingHistoryID: string
): Promise<BillingHistory | null> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for billing history not yet implemented'
    );
  } else {
    const sqliteBillingHistory = await import('./sqlite/billingHistory');
    return sqliteBillingHistory.getBillingHistory(billingHistoryID);
  }
}

export async function listBillingHistoryForUser(
  billingUserID: string,
  filters?: BillingHistoryFilters
): Promise<BillingHistory[]> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for billing history not yet implemented'
    );
  } else {
    const sqliteBillingHistory = await import('./sqlite/billingHistory');
    return sqliteBillingHistory.listBillingHistoryForUser(
      billingUserID,
      filters
    );
  }
}

export async function listBillingHistoryForItem(
  billingUserID: string,
  invoiceItemID: string,
  filters?: Omit<BillingHistoryFilters, 'invoiceItemID'>
): Promise<BillingHistory[]> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for billing history not yet implemented'
    );
  } else {
    const sqliteBillingHistory = await import('./sqlite/billingHistory');
    return sqliteBillingHistory.listBillingHistoryForItem(
      billingUserID,
      invoiceItemID,
      filters
    );
  }
}

export async function markBillingHistoryAsBilled(
  billingHistoryIDs: string[],
  invoiceID: string
): Promise<void> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for billing history not yet implemented'
    );
  } else {
    const sqliteBillingHistory = await import('./sqlite/billingHistory');
    return sqliteBillingHistory.markBillingHistoryAsBilled(
      billingHistoryIDs,
      invoiceID
    );
  }
}

export async function unmarkBillingHistoryAsBilled(
  billingHistoryIDs: string[]
): Promise<void> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for billing history not yet implemented'
    );
  } else {
    const sqliteBillingHistory = await import('./sqlite/billingHistory');
    return sqliteBillingHistory.unmarkBillingHistoryAsBilled(billingHistoryIDs);
  }
}

export async function deleteBillingHistory(
  billingHistoryID: string
): Promise<void> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for billing history not yet implemented'
    );
  } else {
    const sqliteBillingHistory = await import('./sqlite/billingHistory');
    return sqliteBillingHistory.deleteBillingHistory(billingHistoryID);
  }
}

export async function getBillingHistoriesByIDs(
  billingHistoryIDs: string[]
): Promise<BillingHistory[]> {
  if (useRedis) {
    throw new Error(
      'Redis implementation for billing history not yet implemented'
    );
  } else {
    const sqliteBillingHistory = await import('./sqlite/billingHistory');
    return sqliteBillingHistory.getBillingHistoriesByIDs(billingHistoryIDs);
  }
}

// Made with Bob
