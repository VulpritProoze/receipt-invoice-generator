import {
  invoiceItemMasterSchema,
  invoiceSchema,
  type BillingHistoryEntry,
  type InvoiceItemWithHistory
} from './invoice';

describe('invoiceItemMasterSchema', () => {
  const validInvoiceItemMaster = {
    invoiceItemID: 'IIM-ABC123XYZ456',
    companyID: 'COMP-XYZ789ABC123',
    description: 'Consulting services',
    defaultRate: 1500.0,
    createdAt: '2026-05-20'
  };

  it('accepts a valid invoice item master', () => {
    const result = invoiceItemMasterSchema.safeParse(validInvoiceItemMaster);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInvoiceItemMaster);
    }
  });

  describe('invoiceItemID validation', () => {
    it('rejects empty invoice item ID', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        invoiceItemID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects invoice item ID exceeding 50 characters', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        invoiceItemID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('companyID validation', () => {
    it('rejects empty company ID', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        companyID: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('description validation', () => {
    it('rejects empty description', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        description: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects description exceeding 500 characters', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        description: 'a'.repeat(501)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('defaultRate validation', () => {
    it('accepts null default rate', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        defaultRate: null
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative default rate', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        defaultRate: -10
      });
      expect(result.success).toBe(false);
    });

    it('rejects zero default rate', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        defaultRate: 0
      });
      expect(result.success).toBe(false);
    });

    it('accepts minimum valid default rate', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        defaultRate: 0.01
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createdAt validation', () => {
    it('rejects invalid date format', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        createdAt: '2026/05/20'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid ISO date', () => {
      const result = invoiceItemMasterSchema.safeParse({
        ...validInvoiceItemMaster,
        createdAt: '2026-12-31'
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('invoiceSchema', () => {
  const validBillingHistoryEntry: BillingHistoryEntry = {
    billingHistoryID: 'BH-ABC123',
    quantity: 2,
    rate: 1500,
    date: '2026-05-20',
    amount: 3000
  };

  const validInvoiceItemWithHistory: InvoiceItemWithHistory = {
    invoiceItemID: 'IIM-ABC123',
    description: 'Consulting services',
    billingHistoryEntries: [validBillingHistoryEntry]
  };

  const validInvoice = {
    invoiceID: 'INV000000001',
    billingUserID: 'BU-XYZ789ABC123',
    invoiceDate: '2026-05-20',
    terms: 'Net 30',
    dueDate: '2026-06-19',
    currency: 'PHP' as const,
    invoiceItems: [validInvoiceItemWithHistory],
    taxRate: 0.12,
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

  describe('billingUserID validation', () => {
    it('rejects empty billing user ID', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        billingUserID: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects billing user ID exceeding 50 characters', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        billingUserID: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
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
          validInvoiceItemWithHistory,
          {
            ...validInvoiceItemWithHistory,
            invoiceItemID: 'IIM-DEF456'
          }
        ]
      });
      expect(result.success).toBe(true);
    });

    it('rejects invoice item with empty billing history entries', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        invoiceItems: [
          {
            ...validInvoiceItemWithHistory,
            billingHistoryEntries: []
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('accepts invoice item with multiple billing history entries', () => {
      const result = invoiceSchema.safeParse({
        ...validInvoice,
        invoiceItems: [
          {
            ...validInvoiceItemWithHistory,
            billingHistoryEntries: [
              validBillingHistoryEntry,
              { ...validBillingHistoryEntry, billingHistoryID: 'BH-DEF456' }
            ]
          }
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

  describe('missing fields', () => {
    it('rejects invoice missing billingUserID', () => {
      const { billingUserID: _billingUserID, ...incomplete } = validInvoice;
      const result = invoiceSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects invoice missing invoiceItems', () => {
      const { invoiceItems: _invoiceItems, ...incomplete } = validInvoice;
      const result = invoiceSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });
});

// Made with Bob
