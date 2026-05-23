import { companyConfigSchema } from './company';

describe('companyConfigSchema', () => {
  const validCompanyConfig = {
    companyID: 'COMP-ABC123XYZ456',
    brandName: 'BillGen',
    companyName: 'BillGen Inc.',
    companyUrl: 'https://billgen.example.com',
    addressLine: '123 Test Street',
    postalAddress: 'Makati City, 1200',
    country: 'Philippines',
    logoUrl: 'https://billgen.example.com/logo.png'
  };

  it('accepts a valid company config', () => {
    const result = companyConfigSchema.safeParse(validCompanyConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validCompanyConfig);
    }
  });

  describe('companyID validation', () => {
    it('rejects empty company ID', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        companyID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects company ID exceeding 50 characters', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        companyID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });

    it('accepts company ID at maximum length', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        companyID: 'a'.repeat(50)
      });
      expect(result.success).toBe(true);
    });
  });

  describe('brandName validation', () => {
    it('rejects empty brand name', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        brandName: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects brand name exceeding 100 characters', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        brandName: 'a'.repeat(101)
      });
      expect(result.success).toBe(false);
    });

    it('accepts brand name at maximum length', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        brandName: 'a'.repeat(100)
      });
      expect(result.success).toBe(true);
    });
  });

  describe('companyName validation', () => {
    it('rejects empty company name', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        companyName: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects company name exceeding 200 characters', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        companyName: 'a'.repeat(201)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('companyUrl validation', () => {
    it('rejects invalid URL format', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        companyUrl: 'not-a-url'
      });
      expect(result.success).toBe(false);
    });

    it('rejects URL without protocol', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        companyUrl: 'billgen.example.com'
      });
      expect(result.success).toBe(false);
    });

    it('accepts http URLs', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        companyUrl: 'http://billgen.example.com'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('addressLine validation', () => {
    it('rejects empty address line', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        addressLine: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects address line exceeding 200 characters', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        addressLine: 'a'.repeat(201)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('postalAddress validation', () => {
    it('rejects empty postal address', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        postalAddress: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects postal address exceeding 100 characters', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        postalAddress: 'a'.repeat(101)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('country validation', () => {
    it('rejects empty country', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        country: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects country exceeding 100 characters', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        country: 'a'.repeat(101)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('logoUrl validation', () => {
    it('rejects invalid logo URL', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        logoUrl: 'not-a-url'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid logo URL', () => {
      const result = companyConfigSchema.safeParse({
        ...validCompanyConfig,
        logoUrl: 'https://cdn.example.com/logo.png'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('missing fields', () => {
    it('rejects config missing brandName', () => {
      const { brandName: _brandName, ...incomplete } = validCompanyConfig;
      const result = companyConfigSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects config missing companyUrl', () => {
      const { companyUrl: _companyUrl, ...incomplete } = validCompanyConfig;
      const result = companyConfigSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });
});
