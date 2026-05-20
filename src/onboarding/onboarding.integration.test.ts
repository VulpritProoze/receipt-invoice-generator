/**
 * Integration tests for complete onboarding flow
 * Tests the full user journey from checking status to completing onboarding
 */

import {
  checkOnboardingStatus,
  completeOnboarding,
  getOnboardingProgress
} from './onboardingService';
import { getCompanyConfig } from '@/lib/db/company';
import { CompanyConfig } from '@/models/company';

// Use the mocked Redis client
jest.mock('@/lib/redis');

describe('Onboarding Integration Tests', () => {
  const testUserID = 'integration-user-001';
  const validConfig: CompanyConfig = {
    brandName: 'Integration Test Brand',
    companyName: 'Integration Test Company Inc.',
    companyUrl: 'https://integration-test.com',
    logoUrl: 'https://integration-test.com/logo.png',
    addressLine: '456 Integration Street',
    postalAddress: 'Test City, IT 67890',
    country: 'Integration Country'
  };

  beforeEach(async () => {
    // Clear any existing data for test user
    const { redis } = await import('@/lib/redis');
    if (redis) {
      await redis.del(`company:${testUserID}`);
    }
  });

  describe('Complete onboarding flow', () => {
    it('should complete full onboarding journey from start to finish', async () => {
      // Step 1: Check initial status - should be incomplete
      const initialStatus = await checkOnboardingStatus(testUserID);
      expect(initialStatus).toBe(false);

      // Step 2: Get initial progress - should show incomplete with null config
      const initialProgress = await getOnboardingProgress(testUserID);
      expect(initialProgress).toEqual({
        complete: false,
        config: null
      });

      // Step 3: Complete onboarding
      await completeOnboarding(testUserID, validConfig);

      // Step 4: Check status after completion - should be complete
      const completedStatus = await checkOnboardingStatus(testUserID);
      expect(completedStatus).toBe(true);

      // Step 5: Get progress after completion - should show complete with config
      const completedProgress = await getOnboardingProgress(testUserID);
      expect(completedProgress).toEqual({
        complete: true,
        config: validConfig
      });

      // Step 6: Verify config is retrievable directly from database
      const storedConfig = await getCompanyConfig(testUserID);
      expect(storedConfig).toEqual(validConfig);
    });

    it('should allow updating config after initial onboarding', async () => {
      // Complete initial onboarding
      await completeOnboarding(testUserID, validConfig);

      // Update with new config
      const updatedConfig: CompanyConfig = {
        ...validConfig,
        brandName: 'Updated Brand Name',
        companyUrl: 'https://updated-url.com'
      };

      await completeOnboarding(testUserID, updatedConfig);

      // Verify updated config is stored
      const storedConfig = await getCompanyConfig(testUserID);
      expect(storedConfig).toEqual(updatedConfig);
      expect(storedConfig?.brandName).toBe('Updated Brand Name');
      expect(storedConfig?.companyUrl).toBe('https://updated-url.com');
    });

    it('should maintain onboarding status across multiple checks', async () => {
      // Complete onboarding
      await completeOnboarding(testUserID, validConfig);

      // Check status multiple times
      const check1 = await checkOnboardingStatus(testUserID);
      const check2 = await checkOnboardingStatus(testUserID);
      const check3 = await checkOnboardingStatus(testUserID);

      expect(check1).toBe(true);
      expect(check2).toBe(true);
      expect(check3).toBe(true);
    });
  });

  describe('Multiple users isolation', () => {
    const user1ID = 'integration-user-001';
    const user2ID = 'integration-user-002';

    beforeEach(async () => {
      const { redis } = await import('@/lib/redis');
      if (redis) {
        await redis.del(`company:${user1ID}`);
        await redis.del(`company:${user2ID}`);
      }
    });

    it('should keep onboarding status separate for different users', async () => {
      // User 1 completes onboarding
      await completeOnboarding(user1ID, validConfig);

      // User 2 has not completed onboarding
      const user1Status = await checkOnboardingStatus(user1ID);
      const user2Status = await checkOnboardingStatus(user2ID);

      expect(user1Status).toBe(true);
      expect(user2Status).toBe(false);
    });

    it('should not allow one user to access another user config', async () => {
      // User 1 completes onboarding
      await completeOnboarding(user1ID, validConfig);

      // User 2 tries to get config - should get null
      const user2Config = await getCompanyConfig(user2ID);
      expect(user2Config).toBeNull();

      // User 1 can still get their config
      const user1Config = await getCompanyConfig(user1ID);
      expect(user1Config).toEqual(validConfig);
    });
  });

  describe('Error handling', () => {
    it('should reject invalid config data', async () => {
      const invalidConfig = {
        brandName: '', // Empty - should fail validation
        companyName: 'Test Company',
        companyUrl: 'not-a-url', // Invalid URL
        logoUrl: 'https://example.com/logo.png',
        addressLine: '123 Test St',
        postalAddress: 'Test City',
        country: 'Test Country'
      };

      await expect(
        completeOnboarding(testUserID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();

      // Verify onboarding status remains incomplete
      const status = await checkOnboardingStatus(testUserID);
      expect(status).toBe(false);
    });

    it('should reject config with missing required fields', async () => {
      const incompleteConfig = {
        brandName: 'Test Brand',
        companyName: 'Test Company'
        // Missing other required fields
      };

      await expect(
        completeOnboarding(testUserID, incompleteConfig as CompanyConfig)
      ).rejects.toThrow();
    });
  });
});

// Made with Bob
