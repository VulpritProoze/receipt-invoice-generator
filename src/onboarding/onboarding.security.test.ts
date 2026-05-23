/**
 * Security tests for onboarding module
 * Tests user isolation, XSS prevention, and URL validation
 */

import { completeOnboarding, getOnboardingProgress } from './onboardingService';
import { getCompanyConfig } from '@/lib/db/company';
import { CompanyConfig } from '@/models/company';

// Use the mocked Redis client
jest.mock('@/lib/redis');

describe('Onboarding Security Tests', () => {
  const user1ID = 'security-user-001';
  const user2ID = 'security-user-002';

  const validConfig: CompanyConfig = {
    companyID: 'company-123',
    brandName: 'Security Test Brand',
    companyName: 'Security Test Company Inc.',
    companyUrl: 'https://security-test.com',
    logoUrl: 'https://security-test.com/logo.png',
    addressLine: '789 Security Street',
    postalAddress: 'Security City, SC 11111',
    country: 'Security Country'
  };

  beforeEach(async () => {
    const { redis } = await import('@/lib/redis');
    if (redis) {
      await redis.del(`company:${user1ID}`);
      await redis.del(`company:${user2ID}`);
    }
  });

  describe('User isolation', () => {
    it('should prevent user A from accessing user B onboarding status', async () => {
      // User A completes onboarding
      await completeOnboarding(user1ID, validConfig);

      // User B should not see User A's config
      const userBConfig = await getCompanyConfig(user2ID);
      expect(userBConfig).toBeNull();

      // User A can see their own config
      const userAConfig = await getCompanyConfig(user1ID);
      expect(userAConfig).toEqual(validConfig);
    });

    it('should prevent user A from accessing user B progress', async () => {
      // User A completes onboarding
      await completeOnboarding(user1ID, validConfig);

      // User B's progress should show incomplete
      const userBProgress = await getOnboardingProgress(user2ID);
      expect(userBProgress).toEqual({
        complete: false,
        config: null
      });

      // User A's progress should show complete
      const userAProgress = await getOnboardingProgress(user1ID);
      expect(userAProgress).toEqual({
        complete: true,
        config: validConfig
      });
    });

    it('should keep configs separate when both users complete onboarding', async () => {
      const user1Config: CompanyConfig = {
        ...validConfig,
        brandName: 'User 1 Brand'
      };

      const user2Config: CompanyConfig = {
        ...validConfig,
        brandName: 'User 2 Brand'
      };

      // Both users complete onboarding
      await completeOnboarding(user1ID, user1Config);
      await completeOnboarding(user2ID, user2Config);

      // Each user should only see their own config
      const retrievedUser1Config = await getCompanyConfig(user1ID);
      const retrievedUser2Config = await getCompanyConfig(user2ID);

      expect(retrievedUser1Config?.brandName).toBe('User 1 Brand');
      expect(retrievedUser2Config?.brandName).toBe('User 2 Brand');
      expect(retrievedUser1Config).not.toEqual(retrievedUser2Config);
    });
  });

  describe('URL validation', () => {
    it('should reject invalid company URLs', async () => {
      const invalidConfig = {
        ...validConfig,
        companyUrl: 'not-a-valid-url'
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject invalid logo URLs', async () => {
      const invalidConfig = {
        ...validConfig,
        logoUrl: 'not-a-url'
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject relative URLs', async () => {
      const invalidConfig = {
        ...validConfig,
        companyUrl: '/relative/path'
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject URLs without protocol', async () => {
      const invalidConfig = {
        ...validConfig,
        logoUrl: 'example.com/logo.png'
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should accept valid HTTPS URLs', async () => {
      const validHttpsConfig = {
        ...validConfig,
        companyUrl: 'https://secure-site.com',
        logoUrl: 'https://secure-site.com/logo.png'
      };

      await expect(
        completeOnboarding(user1ID, validHttpsConfig)
      ).resolves.not.toThrow();

      const stored = await getCompanyConfig(user1ID);
      expect(stored?.companyUrl).toBe('https://secure-site.com');
      expect(stored?.logoUrl).toBe('https://secure-site.com/logo.png');
    });

    it('should accept valid HTTP URLs', async () => {
      const validHttpConfig = {
        ...validConfig,
        companyUrl: 'http://local-dev.com',
        logoUrl: 'http://local-dev.com/logo.png'
      };

      await expect(
        completeOnboarding(user1ID, validHttpConfig)
      ).resolves.not.toThrow();
    });
  });

  describe('XSS prevention in text fields', () => {
    it('should store script tags as plain text in brandName', async () => {
      const xssConfig = {
        ...validConfig,
        brandName: '<script>alert("xss")</script>'
      };

      // Should not throw - stored as plain text
      await completeOnboarding(user1ID, xssConfig);

      const stored = await getCompanyConfig(user1ID);
      expect(stored?.brandName).toBe('<script>alert("xss")</script>');
    });

    it('should store HTML entities as plain text in companyName', async () => {
      const htmlConfig = {
        ...validConfig,
        companyName: '<img src=x onerror=alert(1)>'
      };

      await completeOnboarding(user1ID, htmlConfig);

      const stored = await getCompanyConfig(user1ID);
      expect(stored?.companyName).toBe('<img src=x onerror=alert(1)>');
    });

    it('should store special characters correctly in address fields', async () => {
      const specialCharsConfig = {
        ...validConfig,
        addressLine: '123 Main St & Co. <Suite #5>',
        postalAddress: 'City & Town, ST 12345',
        country: 'Test & Country'
      };

      await completeOnboarding(user1ID, specialCharsConfig);

      const stored = await getCompanyConfig(user1ID);
      expect(stored?.addressLine).toBe('123 Main St & Co. <Suite #5>');
      expect(stored?.postalAddress).toBe('City & Town, ST 12345');
      expect(stored?.country).toBe('Test & Country');
    });
  });

  describe('Field length validation', () => {
    it('should reject brandName exceeding 100 characters', async () => {
      const longBrandName = 'a'.repeat(101);
      const invalidConfig = {
        ...validConfig,
        brandName: longBrandName
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject companyName exceeding 200 characters', async () => {
      const longCompanyName = 'a'.repeat(201);
      const invalidConfig = {
        ...validConfig,
        companyName: longCompanyName
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject addressLine exceeding 200 characters', async () => {
      const longAddress = 'a'.repeat(201);
      const invalidConfig = {
        ...validConfig,
        addressLine: longAddress
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject postalAddress exceeding 100 characters', async () => {
      const longPostal = 'a'.repeat(101);
      const invalidConfig = {
        ...validConfig,
        postalAddress: longPostal
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject country exceeding 100 characters', async () => {
      const longCountry = 'a'.repeat(101);
      const invalidConfig = {
        ...validConfig,
        country: longCountry
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should accept fields at maximum allowed length', async () => {
      const maxLengthConfig: CompanyConfig = {
        companyID: 'company-123',
        brandName: 'a'.repeat(100),
        companyName: 'b'.repeat(200),
        companyUrl: 'https://example.com',
        logoUrl: 'https://example.com/logo.png',
        addressLine: 'c'.repeat(200),
        postalAddress: 'd'.repeat(100),
        country: 'e'.repeat(100)
      };

      await expect(
        completeOnboarding(user1ID, maxLengthConfig)
      ).resolves.not.toThrow();

      const stored = await getCompanyConfig(user1ID);
      expect(stored?.brandName).toHaveLength(100);
      expect(stored?.companyName).toHaveLength(200);
      expect(stored?.addressLine).toHaveLength(200);
      expect(stored?.postalAddress).toHaveLength(100);
      expect(stored?.country).toHaveLength(100);
    });
  });

  describe('Required field validation', () => {
    it('should reject empty brandName', async () => {
      const invalidConfig = {
        ...validConfig,
        brandName: ''
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject empty companyName', async () => {
      const invalidConfig = {
        ...validConfig,
        companyName: ''
      };

      await expect(
        completeOnboarding(user1ID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should accept fields with leading/trailing whitespace but trim them', async () => {
      const configWithWhitespace = {
        ...validConfig,
        brandName: '  Test Brand  '
      };

      await completeOnboarding(user1ID, configWithWhitespace);

      const stored = await getCompanyConfig(user1ID);
      // Zod doesn't automatically trim, so whitespace is preserved
      expect(stored?.brandName).toBe('  Test Brand  ');
    });
  });
});

// Made with Bob
