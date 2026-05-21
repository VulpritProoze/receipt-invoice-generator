import {
  createReceipt,
  getReceipt,
  getReceiptByInvoiceID,
  listReceipts,
  deleteReceipt
} from './receipts';
import { Receipt, InvoiceItem } from '@/models/receipt';
import { db } from '@/lib/db.sqlite';

describe('SQLite receipts database operations', () => {
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

      const row = db.prepare('SELECT * FROM receipts WHERE user_id = ? AND receipt_id = ?').get(userID, validReceipt.receiptID) as { receipt_id: string; total: number } | undefined;
      expect(row).toBeDefined();
      expect(row?.receipt_id).toBe(validReceipt.receiptID);
      expect(row?.total).toBe(validReceipt.total);
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
  });

  describe('listReceipts', () => {
    it('should list all receipts sorted by createdAt descending', async () => {
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
      expect(receipts[0].receiptID).toBe('CH_B4L0NXRQ3U8WXSKPQ');
      expect(receipts[1].receiptID).toBe('CH_A3K9MXQP2T7VWRJNZ');
    });
  });

  describe('deleteReceipt', () => {
    beforeEach(async () => {
      await createReceipt(userID, validReceipt);
    });

    it('should delete receipt', async () => {
      await deleteReceipt(userID, validReceipt.receiptID);

      const retrieved = await getReceipt(userID, validReceipt.receiptID);
      expect(retrieved).toBeNull();
    });
  });
});
