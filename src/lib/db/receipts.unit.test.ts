import { mockRedis } from '@/lib/__mocks__/redis';
import {
  createReceipt,
  getReceipt,
  getReceiptByInvoiceID,
  listReceipts,
  deleteReceipt
} from './receipts';
import { Receipt, InvoiceItem } from '@/models/receipt';

// Mock the redis module
jest.mock('@/lib/redis');

describe('receipts database operations', () => {
  beforeEach(() => {
    // Clear mock Redis store before each test
    mockRedis.clear();
  });

  const userID = '550e8400-e29b-41d4-a716-446655440000';

  const validInvoiceItem: InvoiceItem = {
    itemID: 'item-001',
    quantity: 2,
    description: 'Test Item',
    rate: 100.0,
    date: '2026-05-20'
  };

  const validReceipt: Receipt = {
    receiptID: 'CH_A3K9MXQP2T7VWRJNZ',
    date: '2026-05-20',
    accountBilled: 'testuser (test@example.com)',
    invoiceID: 'INV000000001',
    invoiceItems: [validInvoiceItem],
    total: 224.0,
    chargedTo: 'Visa **** **** **** 1234',
    userID,
    createdAt: '2026-05-20'
  };

  describe('createReceipt', () => {
    it('should create a receipt with valid data', async () => {
      await createReceipt(userID, validReceipt);

      const stored = await mockRedis.get(
        `receipt:${userID}:${validReceipt.receiptID}`
      );
      expect(stored).toEqual(validReceipt);
    });

    it('should create invoice index on receipt creation', async () => {
      await createReceipt(userID, validReceipt);

      const invoiceIndex = await mockRedis.get(
        `receipt:invoice:${userID}:${validReceipt.invoiceID}`
      );
      expect(invoiceIndex).toBe(validReceipt.receiptID);
    });

    it('should reject receipt with mismatched userID', async () => {
      const mismatchedReceipt = {
        ...validReceipt,
        userID: 'different-user-id'
      };

      await expect(createReceipt(userID, mismatchedReceipt)).rejects.toThrow(
        'Receipt userID does not match provided userID'
      );
    });

    it('should reject invalid receipt data', async () => {
      const invalidReceipt = {
        ...validReceipt,
        receiptID: 'INVALID'
      };

      await expect(
        createReceipt(userID, invalidReceipt as Receipt)
      ).rejects.toThrow();
    });

    it('should reject receipt with negative total', async () => {
      const invalidReceipt = {
        ...validReceipt,
        total: -100
      };

      await expect(
        createReceipt(userID, invalidReceipt as Receipt)
      ).rejects.toThrow();
    });

    it('should reject receipt with empty items array', async () => {
      const invalidReceipt = {
        ...validReceipt,
        invoiceItems: []
      };

      await expect(
        createReceipt(userID, invalidReceipt as Receipt)
      ).rejects.toThrow();
    });
  });

  describe('getReceipt', () => {
    beforeEach(async () => {
      await createReceipt(userID, validReceipt);
    });

    it('should retrieve an existing receipt', async () => {
      const retrieved = await getReceipt(userID, validReceipt.receiptID);
      expect(retrieved).toEqual(validReceipt);
    });

    it('should return null for non-existent receipt', async () => {
      const retrieved = await getReceipt(userID, 'CH_NONEXISTENT000000');
      expect(retrieved).toBeNull();
    });

    it('should return null for wrong userID', async () => {
      const retrieved = await getReceipt(
        'wrong-user-id',
        validReceipt.receiptID
      );
      expect(retrieved).toBeNull();
    });

    it('should throw error for corrupted receipt data', async () => {
      // Store invalid data directly
      await mockRedis.set(`receipt:${userID}:${validReceipt.receiptID}`, {
        ...validReceipt,
        total: 'invalid'
      });

      await expect(getReceipt(userID, validReceipt.receiptID)).rejects.toThrow(
        'Invalid receipt data in database'
      );
    });
  });

  describe('getReceiptByInvoiceID', () => {
    beforeEach(async () => {
      await createReceipt(userID, validReceipt);
    });

    it('should find receipt by invoiceID', async () => {
      const found = await getReceiptByInvoiceID(userID, validReceipt.invoiceID);
      expect(found).toEqual(validReceipt);
    });

    it('should return null for non-existent invoice', async () => {
      const found = await getReceiptByInvoiceID(userID, 'INV999999999');
      expect(found).toBeNull();
    });

    it('should return null for wrong userID', async () => {
      const found = await getReceiptByInvoiceID(
        'wrong-user-id',
        validReceipt.invoiceID
      );
      expect(found).toBeNull();
    });

    it('should return null if invoice index exists but receipt deleted', async () => {
      // Delete receipt but leave invoice index (simulates inconsistent state)
      await mockRedis.del(`receipt:${userID}:${validReceipt.receiptID}`);

      const found = await getReceiptByInvoiceID(userID, validReceipt.invoiceID);
      expect(found).toBeNull();
    });
  });

  describe('listReceipts', () => {
    it('should return empty array when no receipts exist', async () => {
      const receipts = await listReceipts(userID);
      expect(receipts).toEqual([]);
    });

    it('should list all receipts for a user', async () => {
      const receipt2: Receipt = {
        ...validReceipt,
        receiptID: 'CH_B4L0NXRQ3U8WXSKPQ',
        invoiceID: 'INV000000002',
        createdAt: '2026-05-21'
      };

      await createReceipt(userID, validReceipt);
      await createReceipt(userID, receipt2);

      const receipts = await listReceipts(userID);
      expect(receipts).toHaveLength(2);
      expect(receipts.map((r) => r.receiptID)).toContain(
        validReceipt.receiptID
      );
      expect(receipts.map((r) => r.receiptID)).toContain(receipt2.receiptID);
    });

    it('should sort receipts by createdAt descending', async () => {
      const receipt2: Receipt = {
        ...validReceipt,
        receiptID: 'CH_B4L0NXRQ3U8WXSKP',
        invoiceID: 'INV000000002',
        createdAt: '2026-05-21'
      };
      const receipt3: Receipt = {
        ...validReceipt,
        receiptID: 'CH_C5M1OYSR4V9YXTLQR',
        invoiceID: 'INV000000003',
        createdAt: '2026-05-19'
      };

      await createReceipt(userID, validReceipt);
      await createReceipt(userID, receipt2);
      await createReceipt(userID, receipt3);

      const receipts = await listReceipts(userID);
      expect(receipts[0].receiptID).toBe('CH_B4L0NXRQ3U8WXSKP'); // Newest
      expect(receipts[1].receiptID).toBe('CH_A3K9MXQP2T7VWRJN');
      expect(receipts[2].receiptID).toBe('CH_C5M1OYSR4V9YXTLQ'); // Oldest
    });

    it('should not return receipts from other users', async () => {
      const otherUserID = 'other-user-id';
      const otherReceipt: Receipt = {
        ...validReceipt,
        userID: otherUserID
      };

      await createReceipt(userID, validReceipt);
      await createReceipt(otherUserID, otherReceipt);

      const receipts = await listReceipts(userID);
      expect(receipts).toHaveLength(1);
      expect(receipts[0].receiptID).toBe(validReceipt.receiptID);
    });

    it('should skip corrupted receipt data without failing', async () => {
      await createReceipt(userID, validReceipt);

      // Add corrupted data
      await mockRedis.set(`receipt:${userID}:CH_CORRUPTED000000`, {
        ...validReceipt,
        receiptID: 'CH_CORRUPTED000000',
        total: 'invalid'
      });

      const receipts = await listReceipts(userID);
      expect(receipts).toHaveLength(1); // Only valid receipt returned
      expect(receipts[0].receiptID).toBe(validReceipt.receiptID);
    });
  });

  describe('deleteReceipt', () => {
    beforeEach(async () => {
      await createReceipt(userID, validReceipt);
    });

    it('should delete receipt and invoice index', async () => {
      await deleteReceipt(userID, validReceipt.receiptID);

      const receipt = await mockRedis.get(
        `receipt:${userID}:${validReceipt.receiptID}`
      );
      expect(receipt).toBeNull();

      const invoiceIndex = await mockRedis.get(
        `receipt:invoice:${userID}:${validReceipt.invoiceID}`
      );
      expect(invoiceIndex).toBeNull();
    });

    it('should be idempotent for non-existent receipt', async () => {
      await deleteReceipt(userID, 'CH_NONEXISTENT000000');
      // Should not throw
    });

    it('should handle multiple deletes gracefully', async () => {
      await deleteReceipt(userID, validReceipt.receiptID);
      await deleteReceipt(userID, validReceipt.receiptID);
      // Should not throw
    });
  });

  describe('key format validation', () => {
    it('should use correct key format for receipt data', async () => {
      await createReceipt(userID, validReceipt);

      const keys = await mockRedis.keys(`receipt:${userID}:*`);
      expect(keys).toContain(`receipt:${userID}:${validReceipt.receiptID}`);
    });

    it('should use correct key format for invoice index', async () => {
      await createReceipt(userID, validReceipt);

      const keys = await mockRedis.keys(`receipt:invoice:${userID}:*`);
      expect(keys).toContain(
        `receipt:invoice:${userID}:${validReceipt.invoiceID}`
      );
    });
  });
});

// Made with Bob
