import { mockRedis } from '@/lib/__mocks__/redis';
import { setCompanyConfig, getCompanyConfig, updateCompanyConfig } from './company';
import { CompanyConfig } from '@/models/company';

// Mock the redis module
jest.mock('@/lib/redis');

describe('company database operations', () => {
  beforeEach(() => {
    // Clear mock Redis store before each test
    mockRedis.clear();
  });

  const userID = '550e8400-e29b-41d4-a716-446655440000';

  const validCompanyConfig: CompanyConfig = {
    brandName: 'Test Brand',
    companyName: 'Test Company Inc.',
    companyUrl: 'https://example.com',
    addressLine: '123 Test Street',
    postalAddress: 'Test City, 12345',
    country: 'Philippines',
    logoUrl: 'https://example.com/logo.png'
  };

  describe('setCompanyConfig', () => {
    it('should set company config with valid data', async () => {
      await setCompanyConfig(userID, validCompanyConfig);

      const stored = await mockRedis.get(`company:${userID}`);
      expect(stored).toEqual(validCompanyConfig);
    });

    it('should overwrite existing config', async () => {
      await setCompanyConfig(userID, validCompanyConfig);

      const newConfig: CompanyConfig = {
        ...validCompanyConfig,
        brandName: 'Updated Brand'
      };

      await setCompanyConfig(userID, newConfig);

      const stored = await mockRedis.get(`company:${userID}`);
      expect(stored).toEqual(newConfig);
    });

    it('should reject invalid company config', async () => {
      const invalidConfig = {
        ...validCompanyConfig,
        companyUrl: 'not-a-url'
      };

      await expect(
        setCompanyConfig(userID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject config with missing required fields', async () => {
      const invalidConfig = {
        brandName: 'Test Brand'
        // Missing other required fields
      };

      await expect(
        setCompanyConfig(userID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });

    it('should reject config with invalid logo URL', async () => {
      const invalidConfig = {
        ...validCompanyConfig,
        logoUrl: 'not-a-url'
      };

      await expect(
        setCompanyConfig(userID, invalidConfig as CompanyConfig)
      ).rejects.toThrow();
    });
  });

  describe('getCompanyConfig', () => {
    beforeEach(async () => {
      await setCompanyConfig(userID, validCompanyConfig);
    });

    it('should retrieve existing company config', async () => {
      const retrieved = await getCompanyConfig(userID);
      expect(retrieved).toEqual(validCompanyConfig);
    });

    it('should return null for non-existent config', async () => {
      const retrieved = await getCompanyConfig('non-existent-user-id');
      expect(retrieved).toBeNull();
    });

    it('should return null when onboarding not completed', async () => {
      const newUserID = 'new-user-id';
      const retrieved = await getCompanyConfig(newUserID);
      expect(retrieved).toBeNull();
    });

    it('should throw error for corrupted config data', async () => {
      // Store invalid data directly
      await mockRedis.set(`company:${userID}`, {
        ...validCompanyConfig,
        companyUrl: 'not-a-url'
      });

      await expect(getCompanyConfig(userID)).rejects.toThrow(
        'Invalid company config data in database'
      );
    });
  });

  describe('updateCompanyConfig', () => {
    beforeEach(async () => {
      await setCompanyConfig(userID, validCompanyConfig);
    });

    it('should update company config fields', async () => {
      await updateCompanyConfig(userID, {
        brandName: 'Updated Brand'
      });

      const updated = await getCompanyConfig(userID);
      expect(updated?.brandName).toBe('Updated Brand');
      expect(updated?.companyName).toBe(validCompanyConfig.companyName); // Unchanged
    });

    it('should update multiple fields at once', async () => {
      await updateCompanyConfig(userID, {
        brandName: 'Updated Brand',
        addressLine: 'New Address'
      });

      const updated = await getCompanyConfig(userID);
      expect(updated?.brandName).toBe('Updated Brand');
      expect(updated?.addressLine).toBe('New Address');
      expect(updated?.companyName).toBe(validCompanyConfig.companyName); // Unchanged
    });

    it('should throw error for non-existent config', async () => {
      await expect(
        updateCompanyConfig('non-existent-user-id', { brandName: 'Test' })
      ).rejects.toThrow('Company config not found');
    });

    it('should reject invalid updates', async () => {
      await expect(
        updateCompanyConfig(userID, {
          companyUrl: 'not-a-url'
        })
      ).rejects.toThrow();
    });

    it('should validate merged data after update', async () => {
      await expect(
        updateCompanyConfig(userID, {
          logoUrl: 'not-a-url'
        })
      ).rejects.toThrow();
    });

    it('should reject update that makes required field empty', async () => {
      await expect(
        updateCompanyConfig(userID, {
          brandName: ''
        })
      ).rejects.toThrow();
    });
  });

  describe('key format validation', () => {
    it('should use correct key format for company config', async () => {
      await setCompanyConfig(userID, validCompanyConfig);

      const keys = await mockRedis.keys(`company:${userID}`);
      expect(keys).toContain(`company:${userID}`);
    });

    it('should maintain separate configs per user', async () => {
      const user2ID = 'user-2-id';
      const config2: CompanyConfig = {
        ...validCompanyConfig,
        brandName: 'User 2 Brand'
      };

      await setCompanyConfig(userID, validCompanyConfig);
      await setCompanyConfig(user2ID, config2);

      const config1 = await getCompanyConfig(userID);
      const config2Retrieved = await getCompanyConfig(user2ID);

      expect(config1?.brandName).toBe('Test Brand');
      expect(config2Retrieved?.brandName).toBe('User 2 Brand');
    });
  });
});

// Made with Bob
