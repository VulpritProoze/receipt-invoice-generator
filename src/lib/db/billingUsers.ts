import { BillingUser } from '@/models/billingUser';
// SQLite is loaded lazily (dynamic import) so it is never evaluated when USE_REDIS=true

/**
 * Database operations for BillingUser entities.
 * Routes to SQLite (default) or Redis based on USE_REDIS environment variable.
 */

const useRedis = process.env.USE_REDIS === 'true';

export async function createBillingUser(
  billingUser: BillingUser
): Promise<void> {
  if (useRedis) {
    throw new Error('Redis implementation for billing users not yet implemented');
  } else {
    const sqliteBillingUsers = await import('./sqlite/billingUsers');
    return sqliteBillingUsers.createBillingUser(billingUser);
  }
}

export async function getBillingUser(
  billingUserID: string
): Promise<BillingUser | null> {
  if (useRedis) {
    throw new Error('Redis implementation for billing users not yet implemented');
  } else {
    const sqliteBillingUsers = await import('./sqlite/billingUsers');
    return sqliteBillingUsers.getBillingUser(billingUserID);
  }
}

export async function updateBillingUser(
  billingUserID: string,
  updates: Partial<Omit<BillingUser, 'billingUserID' | 'companyID' | 'createdAt'>>
): Promise<void> {
  if (useRedis) {
    throw new Error('Redis implementation for billing users not yet implemented');
  } else {
    const sqliteBillingUsers = await import('./sqlite/billingUsers');
    return sqliteBillingUsers.updateBillingUser(billingUserID, updates);
  }
}

export async function deleteBillingUser(billingUserID: string): Promise<void> {
  if (useRedis) {
    throw new Error('Redis implementation for billing users not yet implemented');
  } else {
    const sqliteBillingUsers = await import('./sqlite/billingUsers');
    return sqliteBillingUsers.deleteBillingUser(billingUserID);
  }
}

export async function listBillingUsers(
  companyID: string
): Promise<BillingUser[]> {
  if (useRedis) {
    throw new Error('Redis implementation for billing users not yet implemented');
  } else {
    const sqliteBillingUsers = await import('./sqlite/billingUsers');
    return sqliteBillingUsers.listBillingUsers(companyID);
  }
}

// Made with Bob
