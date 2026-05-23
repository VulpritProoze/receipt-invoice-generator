import {
  setCompanyConfig,
  getCompanyConfig,
  updateCompanyConfig
} from './company';
import { CompanyConfig } from '@/models/company';
import { db } from '@/lib/db.sqlite';

describe('SQLite company database operations', () => {
  const userID = '550e8400-e29b-41d4-a716-446655440000';

  const validCompanyConfig: CompanyConfig = {
    companyID: 'company-123',
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

      const row = db.prepare('SELECT * FROM company_configs WHERE user_id = ?').get(userID) as { brand_name: string; company_name: string } | undefined;
      expect(row).toBeDefined();
      expect(row?.brand_name).toBe(validCompanyConfig.brandName);
      expect(row?.company_name).toBe(validCompanyConfig.companyName);
    });

    it('should overwrite existing config', async () => {
      await setCompanyConfig(userID, validCompanyConfig);

      const newConfig: CompanyConfig = {
        ...validCompanyConfig,
        brandName: 'Updated Brand'
      };

      await setCompanyConfig(userID, newConfig);

      const row = db.prepare('SELECT * FROM company_configs WHERE user_id = ?').get(userID) as { brand_name: string } | undefined;
      expect(row?.brand_name).toBe('Updated Brand');
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

    it('should throw error for corrupted config data', async () => {
      // Store invalid data directly
      db.prepare(`
        INSERT OR REPLACE INTO company_configs (user_id, brand_name, company_name, company_url, address_line, postal_address, country, logo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userID,
        validCompanyConfig.brandName,
        validCompanyConfig.companyName,
        'not-a-url', // Corrupted companyUrl
        validCompanyConfig.addressLine,
        validCompanyConfig.postalAddress,
        validCompanyConfig.country,
        validCompanyConfig.logoUrl
      );

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
  });
});
