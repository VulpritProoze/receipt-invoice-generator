import { invoiceItemSchema, invoiceSchema } from './invoice';

describe('invoiceItemSchema', () => {
  const validInvoiceItem = {
    itemID: 'item-001',
    quantity: 2,
    description: 'Consulting services',
    rate: 1500,
    date: '2026-05-20'
  };

  it('accepts a valid invoice item', () => {
    const result = invoiceItemSchema.safeParse(validInvoiceItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInvoiceItem);
    }
  });

  describe('itemID validation', () => {
    it('rejects empty item ID', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        itemID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects item ID exceeding 50 characters', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        itemID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('quantity validation', () => {
    it('rejects negative quantity', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        quantity: -1
      });
      expect(result.success).toBe(false);
    });

    it('rejects zero quantity', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        quantity: 0
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer quantity', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        quantity: 1.5
      });
      expect(result.success).toBe(false);
    });

    it('rejects infinite quantity', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        quantity: Infinity
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid positive integer quantity', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        quantity: 100
      });
      expect(result.success).toBe(true);
    });
  });

  describe('description validation', () => {
    it('rejects empty description', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        description: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects description exceeding 500 characters', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        description: 'a'.repeat(501)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('rate validation', () => {
    it('rejects negative rate', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        rate: -10
      });
      expect(result.success).toBe(false);
    });

    it('rejects zero rate', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        rate: 0
      });
      expect(result.success).toBe(false);
    });

    it('accepts minimum valid rate', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        rate: 0.01
      });
      expect(result.success).toBe(true);
    });

    it('rejects infinite rate', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        rate: Infinity
      });
      expect(result.success).toBe(false);
    });
  });

  describe('date validation', () => {
    it('rejects invalid date format', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        date: '20-05-2026'
      });
      expect(result.success).toBe(false);
    });

    it('rejects date with time component', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        date: '2026-05-20T10:30:00Z'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid ISO date', () => {
      const result = invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        date: '2026-12-31'
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('invoiceSchema', () => {
  const validInvoiceItem = {
    itemID: 'item-001',
    quantity: 2,
    description: 'Consulting services',
    rate: 1500,
    date: '2026-05-20'
  };

  const validInvoice = {
    invoiceID: 'INV000000001',
    invoiceDate: '2026-05-20',
    terms: 'Net 30',
    dueDate: '2026-06-19',
    currency: 'PHP' as const,
    billTo: 'Acme Corp',
    billToAddressLine: '456 Client Avenue',
    billToCityAddress: 'Taguig City',
    billToPostalAddress: '1634',
    billToCountry: 'Philippines',
    invoiceItems: [validInvoiceItem],
    taxRate: 0.12,
    userID: 'user-001',
    createdAt: '2026-05-20'
  };

  it('accepts a valid invoice', () => {
    const result = invoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInvoice);
    }
  });

  describe('invoiceID validation', () => {
    it('rejects invalid invoice ID format', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        invoiceID: 'INV-1'
      });
      expect(result.success).toBe(false);
    });

    it('rejects invoice ID with wrong prefix', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        invoiceID: 'ABC000000001'
      });
      expect(result.success).toBe(false);
    });

    it('rejects invoice ID with insufficient digits', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        invoiceID: 'INV00001'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid invoice ID', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        invoiceID: 'INV999999999'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('currency validation', () => {
    it('accepts PHP currency', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        currency: 'PHP'
      });
      expect(result.success).toBe(true);
    });

    it('accepts USD currency', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        currency: 'USD'
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid currency', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        currency: 'EUR'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('invoiceItems validation', () => {
    it('rejects empty invoice items array', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        invoiceItems: []
      });
      expect(result.success).toBe(false);
    });

    it('accepts multiple invoice items', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        invoiceItems: [
          validInvoiceItem,
          { ...validInvoiceItem, itemID: 'item-002' }
        ]
      });
      expect(result.success).toBe(true);
    });
  });

  describe('taxRate validation', () => {
    it('rejects negative tax rate', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        taxRate: -0.1
      });
      expect(result.success).toBe(false);
    });

    it('rejects tax rate greater than 1', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        taxRate: 1.5
      });
      expect(result.success).toBe(false);
    });

    it('accepts zero tax rate', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        taxRate: 0
      });
      expect(result.success).toBe(true);
    });

    it('accepts tax rate of 1', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        taxRate: 1
      });
      expect(result.success).toBe(true);
    });

    it('rejects infinite tax rate', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        taxRate: Infinity
      });
      expect(result.success).toBe(false);
    });
  });

  describe('terms validation', () => {
    it('rejects empty terms', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        terms: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects terms exceeding 200 characters', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        terms: 'a'.repeat(201)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('billTo fields validation', () => {
    it('rejects empty billTo', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        billTo: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty billToAddressLine', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        billToAddressLine: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty billToCityAddress', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        billToCityAddress: ''
      });
      expect(result.success).toBe(false);
    });
  });
});
