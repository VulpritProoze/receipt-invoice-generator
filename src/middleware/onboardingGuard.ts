import { checkOnboardingStatus } from '@/onboarding/onboardingService';

/**
 * Onboarding guard middleware utility.
 * Checks if a user has completed onboarding and returns redirect path if not.
 * Used by protected routes that require company configuration.
 */

export async function requireOnboarding(userID: string): Promise<{ redirect?: string }> {
  const isComplete = await checkOnboardingStatus(userID);

  if (!isComplete) {
    return { redirect: '/onboarding' };
  }

  return {};
}

// Made with Bob
