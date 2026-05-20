import { receiptSchema } from './receipt';

describe('receiptSchema', () => {
  const validReceipt = {
    receiptID: 'CH_ABCDEF12345678901',
    date: '2026-05-20',
    accountBilled: 'Acme Corp',
    invoiceID: 'INV000000001',
    invoiceItems: [
      {
        itemID: 'item-001',
        quantity: 2,
        description: 'Consulting services',
        rate: 1500,
        date: '2026-05-20'
      }
    ],
    total: 3000,
    chargedTo: 'Acme Corp',
    userID: 'user-001',
    createdAt: '2026-05-20'
  };

  it('accepts a valid receipt', () => {
    const result = receiptSchema.safeParse(validReceipt);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validReceipt);
    }
  });

  describe('receiptID validation', () => {
    it('rejects invalid receipt ID format', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptID: 'INVALID'
      });
      expect(result.success).toBe(false);
    });

    it('rejects receipt ID with wrong prefix', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptID: 'REC_ABCDEF12345678901'
      });
      expect(result.success).toBe(false);
    });

    it('rejects receipt ID with insufficient characters', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptID: 'CH_ABCDEF123'
      });
      expect(result.success).toBe(false);
    });

    it('rejects receipt ID with lowercase characters', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptID: 'CH_abcdef12345678901'
      });
      expect(result.success).toBe(false);
    });

    it('rejects receipt ID with special characters', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptID: 'CH_ABCDEF123456789-1'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid receipt ID with all uppercase alphanumeric', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptID: 'CH_A3K9MXQP2T7VWRJN5'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('date validation', () => {
    it('rejects invalid date format', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        date: '20-05-2026'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid ISO date', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        date: '2026-12-31'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('accountBilled validation', () => {
    it('rejects empty account billed', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        accountBilled: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects account billed exceeding 200 characters', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        accountBilled: 'a'.repeat(201)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('invoiceID validation', () => {
    it('rejects invalid invoice ID format', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        invoiceID: 'INV-1'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid invoice ID', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        invoiceID: 'INV999999999'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invoiceItems validation', () => {
    it('rejects empty invoice items array', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        invoiceItems: []
      });
      expect(result.success).toBe(false);
    });

    it('accepts multiple invoice items', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        invoiceItems: [
          validReceipt.invoiceItems[0],
          { ...validReceipt.invoiceItems[0], itemID: 'item-002' }
        ]
      });
      expect(result.success).toBe(true);
    });
  });

  describe('total validation', () => {
    it('rejects negative total', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        total: -100
      });
      expect(result.success).toBe(false);
    });

    it('accepts zero total', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        total: 0
      });
      expect(result.success).toBe(true);
    });

    it('rejects infinite total', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        total: Infinity
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid positive total', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        total: 5000.50
      });
      expect(result.success).toBe(true);
    });
  });

  describe('chargedTo validation', () => {
    it('rejects empty charged to', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        chargedTo: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects charged to exceeding 200 characters', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        chargedTo: 'a'.repeat(201)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('userID validation', () => {
    it('rejects empty user ID', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        userID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects user ID exceeding 100 characters', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        userID: 'a'.repeat(101)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createdAt validation', () => {
    it('rejects invalid date format', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        createdAt: '20-05-2026'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid ISO date', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        createdAt: '2026-01-01'
      });
      expect(result.success).toBe(true);
    });
  });
});
