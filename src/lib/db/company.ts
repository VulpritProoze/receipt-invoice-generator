import { redis } from '@/lib/redis';
import { CompanyConfig, companyConfigSchema } from '@/models/company';

/**
 * Database operations for CompanyConfig entities.
 * Key format: company:[userID]
 */

/**
 * Set company configuration for a user.
 * Overwrites any existing configuration.
 */
export async function setCompanyConfig(
  userID: string,
  config: CompanyConfig
): Promise<void> {
  if (!redis) {
    throw new Error('Redis client not initialized');
  }

  // Validate config data before storing
  const validated = companyConfigSchema.parse(config);

  // Store company config
  await redis.set(`company:${userID}`, validated);
}

/**
 * Get company configuration for a user.
 * Returns null if no configuration exists (onboarding not completed).
 */
export async function getCompanyConfig(userID: string): Promise<CompanyConfig | null> {
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
      `Invalid company config data in database for userID: ${userID}. Data integrity check failed.`
    );
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
}

// Made with Bob
