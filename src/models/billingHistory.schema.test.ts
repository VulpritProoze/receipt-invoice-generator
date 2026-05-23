import { billingHistorySchema } from './billingHistory';

describe('billingHistorySchema', () => {
  const validBillingHistory = {
    billingHistoryID: 'BH-ABC123XYZ456',
    billingUserID: 'BU-XYZ789ABC123',
    invoiceItemID: 'IIM-DEF456GHI789',
    quantity: 5,
    rate: 100.5,
    date: '2026-05-23',
    billedStatus: 'unbilled' as const,
    invoiceID: null,
    createdAt: '2026-05-23'
  };

  it('accepts a valid billing history entry', () => {
    const result = billingHistorySchema.safeParse(validBillingHistory);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validBillingHistory);
    }
  });

  describe('billingHistoryID validation', () => {
    it('rejects empty billing history ID', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        billingHistoryID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects billing history ID exceeding 50 characters', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        billingHistoryID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('billingUserID validation', () => {
    it('rejects empty billing user ID', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        billingUserID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects billing user ID exceeding 50 characters', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        billingUserID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('invoiceItemID validation', () => {
    it('rejects empty invoice item ID', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        invoiceItemID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects invoice item ID exceeding 50 characters', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        invoiceItemID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('quantity validation', () => {
    it('rejects zero quantity', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        quantity: 0
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative quantity', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        quantity: -1
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer quantity', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        quantity: 5.5
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid positive integer quantity', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        quantity: 100
      });
      expect(result.success).toBe(true);
    });
  });

  describe('rate validation', () => {
    it('rejects zero rate', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        rate: 0
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative rate', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        rate: -10.5
      });
      expect(result.success).toBe(false);
    });

    it('accepts minimum valid rate', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        rate: 0.01
      });
      expect(result.success).toBe(true);
    });

    it('accepts decimal rate', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        rate: 99.99
      });
      expect(result.success).toBe(true);
    });
  });

  describe('date validation', () => {
    it('rejects invalid date format', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        date: '2026/05/23'
      });
      expect(result.success).toBe(false);
    });

    it('rejects date with time component', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        date: '2026-05-23T12:00:00Z'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid ISO date format', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        date: '2026-12-31'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('billedStatus validation', () => {
    it('rejects invalid billed status', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        billedStatus: 'pending'
      });
      expect(result.success).toBe(false);
    });

    it('accepts unbilled status', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        billedStatus: 'unbilled'
      });
      expect(result.success).toBe(true);
    });

    it('accepts billed status', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        billedStatus: 'billed'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invoiceID validation', () => {
    it('accepts null invoice ID', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        invoiceID: null
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid invoice ID', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        invoiceID: 'INV000000001'
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty string invoice ID', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        invoiceID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects invoice ID exceeding 50 characters', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        invoiceID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createdAt validation', () => {
    it('rejects invalid date format', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        createdAt: '2026/05/23'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid ISO date format', () => {
      const result = billingHistorySchema.safeParse({
        ...validBillingHistory,
        createdAt: '2026-12-31'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('missing fields', () => {
    it('rejects billing history missing billingHistoryID', () => {
      const { billingHistoryID: _billingHistoryID, ...incomplete } =
        validBillingHistory;
      const result = billingHistorySchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects billing history missing quantity', () => {
      const { quantity: _quantity, ...incomplete } = validBillingHistory;
      const result = billingHistorySchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects billing history missing rate', () => {
      const { rate: _rate, ...incomplete } = validBillingHistory;
      const result = billingHistorySchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });
});

// Made with Bob
