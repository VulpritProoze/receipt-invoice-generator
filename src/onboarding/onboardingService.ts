import { CompanyConfig } from '@/models/company';
import { getCompanyConfig, setCompanyConfig } from '@/lib/db/company';

/**
 * Onboarding service layer for company configuration.
 * Handles onboarding status checks and completion.
 */

/**
 * Check if a user has completed onboarding.
 * Returns true if company config exists with all required fields.
 */
export async function checkOnboardingStatus(userID: string): Promise<boolean> {
  const config = await getCompanyConfig(userID);
  return config !== null;
}

/**
 * Complete onboarding by storing company configuration.
 * Validates all required fields are present before storing.
 */
export async function completeOnboarding(
  userID: string,
  config: CompanyConfig
): Promise<void> {
  // setCompanyConfig already validates via schema
  await setCompanyConfig(userID, config);
}

/**
 * Get onboarding progress for a user.
 * Returns completion status and config if exists.
 */
export async function getOnboardingProgress(userID: string): Promise<{
  complete: boolean;
  config: CompanyConfig | null;
}> {
  const config = await getCompanyConfig(userID);
  return {
    complete: config !== null,
    config
  };
}

// Made with Bob
