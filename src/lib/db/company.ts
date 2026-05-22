import { redis } from '@/lib/redis';
import { CompanyConfig, companyConfigSchema } from '@/models/company';
// SQLite is loaded lazily (dynamic import) so it is never evaluated when USE_REDIS=true

/**
 * Database operations for CompanyConfig entities.
 * Routes to SQLite (default) or Redis based on USE_REDIS environment variable.
 */

const useRedis = process.env.USE_REDIS === 'true';

/**
 * Set company configuration for a user.
 * Overwrites any existing configuration.
 */
export async function setCompanyConfig(
  userID: string,
  config: CompanyConfig
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Validate config data before storing
    const validated = companyConfigSchema.parse(config);

    // Store company config
    await redis.set(`company:${userID}`, validated);
  } else {
    const sqliteCompany = await import('./sqlite/company');
    return sqliteCompany.setCompanyConfig(userID, config);
  }
}

/**
 * Get company configuration for a user.
 * Returns null if no configuration exists (onboarding not completed).
 */
export async function getCompanyConfig(
  userID: string
): Promise<CompanyConfig | null> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    const data = await redis.get<unknown>(`company:${userID}`);

    if (!data) {
      return null;
    }

    // Validate retrieved data through schema
    try {
      return companyConfigSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid company config data in database for userID: ${userID}. Data integrity check failed.`,
        { cause: error }
      );
    }
  } else {
    const sqliteCompany = await import('./sqlite/company');
    return sqliteCompany.getCompanyConfig(userID);
  }
}

/**
 * Update company configuration fields.
 * Only updates provided fields, leaves others unchanged.
 */
export async function updateCompanyConfig(
  userID: string,
  updates: Partial<CompanyConfig>
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Get existing config
    const existing = await getCompanyConfig(userID);

    if (!existing) {
      throw new Error(`Company config not found for userID: ${userID}`);
    }

    // Merge updates with existing data
    const updated = { ...existing, ...updates };

    // Validate merged data
    const validated = companyConfigSchema.parse(updated);

    // Store updated config
    await redis.set(`company:${userID}`, validated);
  } else {
    const sqliteCompany = await import('./sqlite/company');
    return sqliteCompany.updateCompanyConfig(userID, updates);
  }
}

// Made with Bob
