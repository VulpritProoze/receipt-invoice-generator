import { billingUserSchema } from './billingUser';

describe('billingUserSchema', () => {
  const validBillingUser = {
    billingUserID: 'BU-ABC123XYZ456',
    companyID: 'COMP-XYZ789ABC123',
    name: 'Acme Corporation',
    addressLine: '123 Business Street',
    cityAddress: 'Makati City',
    postalAddress: '1200',
    country: 'Philippines',
    createdAt: '2026-05-23'
  };

  it('accepts a valid billing user', () => {
    const result = billingUserSchema.safeParse(validBillingUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validBillingUser);
    }
  });

  describe('billingUserID validation', () => {
    it('rejects empty billing user ID', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        billingUserID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects billing user ID exceeding 50 characters', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        billingUserID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });

    it('accepts billing user ID at maximum length', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        billingUserID: 'a'.repeat(50)
      });
      expect(result.success).toBe(true);
    });
  });

  describe('companyID validation', () => {
    it('rejects empty company ID', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        companyID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects company ID exceeding 50 characters', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        companyID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('name validation', () => {
    it('rejects empty name', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        name: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects name exceeding 200 characters', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        name: 'a'.repeat(201)
      });
      expect(result.success).toBe(false);
    });

    it('accepts name at maximum length', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        name: 'a'.repeat(200)
      });
      expect(result.success).toBe(true);
    });
  });

  describe('addressLine validation', () => {
    it('rejects empty address line', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        addressLine: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects address line exceeding 200 characters', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        addressLine: 'a'.repeat(201)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('cityAddress validation', () => {
    it('rejects empty city address', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        cityAddress: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects city address exceeding 100 characters', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        cityAddress: 'a'.repeat(101)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('postalAddress validation', () => {
    it('rejects empty postal address', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        postalAddress: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects postal address exceeding 50 characters', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        postalAddress: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('country validation', () => {
    it('rejects empty country', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        country: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects country exceeding 100 characters', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        country: 'a'.repeat(101)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createdAt validation', () => {
    it('rejects invalid date format', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        createdAt: '2026/05/23'
      });
      expect(result.success).toBe(false);
    });

    it('rejects date with time component', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        createdAt: '2026-05-23T12:00:00Z'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid ISO date format', () => {
      const result = billingUserSchema.safeParse({
        ...validBillingUser,
        createdAt: '2026-12-31'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('missing fields', () => {
    it('rejects billing user missing billingUserID', () => {
      const { billingUserID: _billingUserID, ...incomplete } = validBillingUser;
      const result = billingUserSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects billing user missing companyID', () => {
      const { companyID: _companyID, ...incomplete } = validBillingUser;
      const result = billingUserSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects billing user missing name', () => {
      const { name: _name, ...incomplete } = validBillingUser;
      const result = billingUserSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });
});

// Made with Bob
