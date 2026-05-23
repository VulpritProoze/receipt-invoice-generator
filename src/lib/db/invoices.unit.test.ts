process.env.USE_REDIS = 'true';
import { mockRedis } from '@/lib/__mocks__/redis';
import { Invoice, InvoiceItemWithHistory } from '@/models/invoice';

// Mock the redis module - commented out to prevent Jest from auto-mocking the mock itself
// jest.mock('@/lib/redis');

// Require invoices sequentially after USE_REDIS is set to true
/* eslint-disable @typescript-eslint/no-require-imports */
const {
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  listInvoices,
  getNextInvoiceSequence
} = require('./invoices') as typeof import('./invoices');
/* eslint-enable @typescript-eslint/no-require-imports */

describe('invoices database operations', () => {
  beforeEach(() => {
    // Clear mock Redis store before each test
    mockRedis.clear();
  });

  const userID = '550e8400-e29b-41d4-a716-446655440000';

  const validInvoiceItem: InvoiceItemWithHistory = {
    invoiceItemID: 'item-001',
    description: 'Test Item',
    billingHistoryEntries: [
      {
        billingHistoryID: 'bh-001',
        quantity: 2,
        rate: 100.0,
        date: '2026-05-20',
        amount: 200.0
      }
    ]
  };

  const validInvoice: Invoice = {
    invoiceID: 'INV000000001',
    invoiceDate: '2026-05-20',
    terms: 'Due Upon Receipt',
    dueDate: '2026-06-20',
    currency: 'PHP',
    invoiceItems: [validInvoiceItem],
    taxRate: 0.12,
    billingUserID: userID,
    createdAt: '2026-05-20'
  };

  describe('createInvoice', () => {
    it('should create an invoice with valid data', async () => {
      await createInvoice(userID, validInvoice);

      const stored = await mockRedis.get(
        `invoice:${userID}:${validInvoice.invoiceID}`
      );
      expect(stored).toEqual(validInvoice);
    });

    it('should reject invoice with mismatched userID', async () => {
      const mismatchedInvoice = {
        ...validInvoice,
        billingUserID: 'different-user-id'
      };

      await expect(createInvoice(userID, mismatchedInvoice)).rejects.toThrow(
        'Invoice billingUserID does not match provided billingUserID'
      );
    });

    it('should reject invalid invoice data', async () => {
      const invalidInvoice = {
        ...validInvoice,
        invoiceID: 'INVALID'
      };

      await expect(
        createInvoice(userID, invalidInvoice as Invoice)
      ).rejects.toThrow();
    });

    it('should reject invoice with negative tax rate', async () => {
      const invalidInvoice = {
        ...validInvoice,
        taxRate: -0.1
      };

      await expect(
        createInvoice(userID, invalidInvoice as Invoice)
      ).rejects.toThrow();
    });

    it('should reject invoice with empty items array', async () => {
      const invalidInvoice = {
        ...validInvoice,
        invoiceItems: []
      };

      await expect(
        createInvoice(userID, invalidInvoice as Invoice)
      ).rejects.toThrow();
    });
  });

  describe('getInvoice', () => {
    beforeEach(async () => {
      await createInvoice(userID, validInvoice);
    });

    it('should retrieve an existing invoice', async () => {
      const retrieved = await getInvoice(userID, validInvoice.invoiceID);
      expect(retrieved).toEqual(validInvoice);
    });

    it('should return null for non-existent invoice', async () => {
      const retrieved = await getInvoice(userID, 'INV999999999');
      expect(retrieved).toBeNull();
    });

    it('should return null for wrong userID', async () => {
      const retrieved = await getInvoice(
        'wrong-user-id',
        validInvoice.invoiceID
      );
      expect(retrieved).toBeNull();
    });

    it('should throw error for corrupted invoice data', async () => {
      // Store invalid data directly
      await mockRedis.set(`invoice:${userID}:${validInvoice.invoiceID}`, {
        ...validInvoice,
        taxRate: 'invalid'
      });

      await expect(getInvoice(userID, validInvoice.invoiceID)).rejects.toThrow(
        'Invalid invoice data in database'
      );
    });
  });

  describe('updateInvoice', () => {
    beforeEach(async () => {
      await createInvoice(userID, validInvoice);
    });

    it('should update invoice fields', async () => {
      await updateInvoice(userID, validInvoice.invoiceID, {
        terms: 'Net 30'
      });

      const updated = await getInvoice(userID, validInvoice.invoiceID);
      expect(updated?.terms).toBe('Net 30');
    });

    it('should throw error for non-existent invoice', async () => {
      await expect(
        updateInvoice(userID, 'INV999999999', { terms: 'Net 30' })
      ).rejects.toThrow('Invoice not found');
    });

    it('should reject attempt to change userID', async () => {
      await expect(
        updateInvoice(userID, validInvoice.invoiceID, {
          billingUserID: 'different-user-id'
        } as unknown as Partial<Invoice>)
      ).rejects.toThrow('Cannot change invoice billingUserID');
    });

    it('should reject attempt to change invoiceID', async () => {
      await expect(
        updateInvoice(userID, validInvoice.invoiceID, {
          invoiceID: 'INV000000002'
        } as unknown as Partial<Invoice>)
      ).rejects.toThrow('Cannot change invoiceID');
    });

    it('should reject invalid updates', async () => {
      await expect(
        updateInvoice(userID, validInvoice.invoiceID, {
          taxRate: -0.5
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteInvoice', () => {
    beforeEach(async () => {
      await createInvoice(userID, validInvoice);
    });

    it('should delete an invoice', async () => {
      await deleteInvoice(userID, validInvoice.invoiceID);

      const invoice = await mockRedis.get(
        `invoice:${userID}:${validInvoice.invoiceID}`
      );
      expect(invoice).toBeNull();
    });

    it('should be idempotent for non-existent invoice', async () => {
      await deleteInvoice(userID, 'INV999999999');
      // Should not throw
    });
  });

  describe('listInvoices', () => {
    it('should return empty array when no invoices exist', async () => {
      const invoices = await listInvoices(userID);
      expect(invoices).toEqual([]);
    });

    it('should list all invoices for a user', async () => {
      const invoice2: Invoice = {
        ...validInvoice,
        invoiceID: 'INV000000002',
        createdAt: '2026-05-21'
      };

      await createInvoice(userID, validInvoice);
      await createInvoice(userID, invoice2);

      const invoices = await listInvoices(userID);
      expect(invoices).toHaveLength(2);
      expect(invoices.map((i) => i.invoiceID)).toContain(
        validInvoice.invoiceID
      );
      expect(invoices.map((i) => i.invoiceID)).toContain(invoice2.invoiceID);
    });

    it('should sort invoices by createdAt descending', async () => {
      const invoice2: Invoice = {
        ...validInvoice,
        invoiceID: 'INV000000002',
        createdAt: '2026-05-21'
      };
      const invoice3: Invoice = {
        ...validInvoice,
        invoiceID: 'INV000000003',
        createdAt: '2026-05-19'
      };

      await createInvoice(userID, validInvoice);
      await createInvoice(userID, invoice2);
      await createInvoice(userID, invoice3);

      const invoices = await listInvoices(userID);
      expect(invoices[0].invoiceID).toBe('INV000000002'); // Newest
      expect(invoices[1].invoiceID).toBe('INV000000001');
      expect(invoices[2].invoiceID).toBe('INV000000003'); // Oldest
    });

    it('should not return invoices from other users', async () => {
      const otherUserID = 'other-user-id';
      const otherInvoice: Invoice = {
        ...validInvoice,
        billingUserID: otherUserID
      };

      await createInvoice(userID, validInvoice);
      await createInvoice(otherUserID, otherInvoice);

      const invoices = await listInvoices(userID);
      expect(invoices).toHaveLength(1);
      expect(invoices[0].invoiceID).toBe(validInvoice.invoiceID);
    });

    it('should skip corrupted invoice data without failing', async () => {
      await createInvoice(userID, validInvoice);

      // Add corrupted data
      await mockRedis.set(`invoice:${userID}:INV000000002`, {
        ...validInvoice,
        invoiceID: 'INV000000002',
        taxRate: 'invalid'
      });

      const invoices = await listInvoices(userID);
      expect(invoices).toHaveLength(1); // Only valid invoice returned
      expect(invoices[0].invoiceID).toBe(validInvoice.invoiceID);
    });
  });

  describe('getNextInvoiceSequence', () => {
    it('should return 1 for first invoice', async () => {
      const sequence = await getNextInvoiceSequence(userID);
      expect(sequence).toBe(1);
    });

    it('should increment sequence on each call', async () => {
      const seq1 = await getNextInvoiceSequence(userID);
      const seq2 = await getNextInvoiceSequence(userID);
      const seq3 = await getNextInvoiceSequence(userID);

      expect(seq1).toBe(1);
      expect(seq2).toBe(2);
      expect(seq3).toBe(3);
    });

    it('should maintain separate sequences per user', async () => {
      const user2ID = 'user-2-id';

      const seq1User1 = await getNextInvoiceSequence(userID);
      const seq1User2 = await getNextInvoiceSequence(user2ID);
      const seq2User1 = await getNextInvoiceSequence(userID);

      expect(seq1User1).toBe(1);
      expect(seq1User2).toBe(1);
      expect(seq2User1).toBe(2);
    });
  });

  describe('key format validation', () => {
    it('should use correct key format for invoice data', async () => {
      await createInvoice(userID, validInvoice);

      const keys = await mockRedis.keys(`invoice:${userID}:*`);
      expect(keys).toContain(`invoice:${userID}:${validInvoice.invoiceID}`);
    });

    it('should use correct key format for sequence counter', async () => {
      await getNextInvoiceSequence(userID);

      const keys = await mockRedis.keys(`invoice:sequence:${userID}`);
      expect(keys).toContain(`invoice:sequence:${userID}`);
    });
  });
});

// Made with Bob
