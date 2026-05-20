import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createReceipt,
  getReceipt,
  getReceiptByInvoice,
  listUserReceipts,
  deleteReceipt
} from './receiptService';
import * as dbReceipts from '@/lib/db/receipts';
import * as dbInvoices from '@/lib/db/invoices';
import * as dbUsers from '@/lib/db/users';
import * as idGenerator from '@/lib/idGenerator';
import { Receipt } from '@/models/receipt';
import { Invoice } from '@/models/invoice';
import { User } from '@/models/user';

// Mock database operations
jest.mock('@/lib/db/receipts');
jest.mock('@/lib/db/invoices');
jest.mock('@/lib/db/users');
jest.mock('@/lib/idGenerator');

describe('receiptService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReceipt', () => {
    it('should create receipt with generated ID and user data', async () => {
      const mockInvoice: Invoice = {
        invoiceID: 'INV000000001',
        userID: 'user-123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        billTo: 'Test Client',
        billToAddressLine: '123 Test St',
        billToCityAddress: 'Test City',
        billToPostalAddress: '12345',
        billToCountry: 'Philippines',
        invoiceItems: [
          {
            itemID: 'item-1',
            quantity: 1,
            description: 'Service',
            rate: 100,
            date: '2026-05-20'
          }
        ],
        taxRate: 0.12,
        createdAt: '2026-05-20'
      };

      const mockUser: User = {
        userID: 'user-123',
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '**** **** **** 1234',
        creditCardType: 'Visa'
      };

      (dbInvoices.getInvoice as jest.Mock).mockResolvedValue(mockInvoice);
      (dbReceipts.getReceiptByInvoiceID as jest.Mock).mockResolvedValue(null);
      (dbUsers.getUser as jest.Mock).mockResolvedValue(mockUser);
      (idGenerator.generateReceiptID as jest.Mock).mockReturnValue('CH_A3K9MXQP2T7VWRJN');
      (dbReceipts.createReceipt as jest.Mock).mockResolvedValue(undefined);

      const receiptData = {
        date: '2026-05-20',
        invoiceID: 'INV000000001',
        invoiceItems: mockInvoice.invoiceItems,
        total: 112
      };

      const result = await createReceipt('user-123', receiptData);

      expect(result.receiptID).toBe('CH_A3K9MXQP2T7VWRJN');
      expect(result.accountBilled).toBe('testuser (test@example.com)');
      expect(result.chargedTo).toBe('Visa **** **** **** 1234');
      expect(dbInvoices.getInvoice).toHaveBeenCalledWith('user-123', 'INV000000001');
      expect(dbReceipts.createReceipt).toHaveBeenCalled();
    });

    it('should throw error if invoice not found', async () => {
      (dbInvoices.getInvoice as jest.Mock).mockResolvedValue(null);

      const receiptData = {
        date: '2026-05-20',
        invoiceID: 'INV000000001',
        invoiceItems: [],
        total: 100
      };

      await expect(createReceipt('user-123', receiptData)).rejects.toThrow('Invoice not found');
    });

    it('should throw error if receipt already exists for invoice', async () => {
      const mockInvoice: Invoice = {
        invoiceID: 'INV000000001',
        userID: 'user-123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        billTo: 'Test Client',
        billToAddressLine: '123 Test St',
        billToCityAddress: 'Test City',
        billToPostalAddress: '12345',
        billToCountry: 'Philippines',
        invoiceItems: [],
        taxRate: 0.12,
        createdAt: '2026-05-20'
      };

      const existingReceipt: Receipt = {
        receiptID: 'CH_EXISTING123456',
        date: '2026-05-20',
        accountBilled: 'testuser (test@example.com)',
        invoiceID: 'INV000000001',
        invoiceItems: [],
        total: 100,
        chargedTo: 'Visa **** **** **** 1234',
        userID: 'user-123',
        createdAt: '2026-05-20'
      };

      (dbInvoices.getInvoice as jest.Mock).mockResolvedValue(mockInvoice);
      (dbReceipts.getReceiptByInvoiceID as jest.Mock).mockResolvedValue(existingReceipt);

      const receiptData = {
        date: '2026-05-20',
        invoiceID: 'INV000000001',
        invoiceItems: [],
        total: 100
      };

      await expect(createReceipt('user-123', receiptData)).rejects.toThrow(
        'Receipt already exists for this invoice'
      );
    });

    it('should throw error if user not found', async () => {
      const mockInvoice: Invoice = {
        invoiceID: 'INV000000001',
        userID: 'user-123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        billTo: 'Test Client',
        billToAddressLine: '123 Test St',
        billToCityAddress: 'Test City',
        billToPostalAddress: '12345',
        billToCountry: 'Philippines',
        invoiceItems: [],
        taxRate: 0.12,
        createdAt: '2026-05-20'
      };

      (dbInvoices.getInvoice as jest.Mock).mockResolvedValue(mockInvoice);
      (dbReceipts.getReceiptByInvoiceID as jest.Mock).mockResolvedValue(null);
      (dbUsers.getUser as jest.Mock).mockResolvedValue(null);

      const receiptData = {
        date: '2026-05-20',
        invoiceID: 'INV000000001',
        invoiceItems: [],
        total: 100
      };

      await expect(createReceipt('user-123', receiptData)).rejects.toThrow('User not found');
    });
  });

  describe('getReceipt', () => {
    it('should return receipt', async () => {
      const mockReceipt: Receipt = {
        receiptID: 'CH_A3K9MXQP2T7VWRJN',
        date: '2026-05-20',
        accountBilled: 'testuser (test@example.com)',
        invoiceID: 'INV000000001',
        invoiceItems: [],
        total: 100,
        chargedTo: 'Visa **** **** **** 1234',
        userID: 'user-123',
        createdAt: '2026-05-20'
      };

      (dbReceipts.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);

      const result = await getReceipt('user-123', 'CH_A3K9MXQP2T7VWRJN');

      expect(result).toEqual(mockReceipt);
    });

    it('should return null if not found', async () => {
      (dbReceipts.getReceipt as jest.Mock).mockResolvedValue(null);

      const result = await getReceipt('user-123', 'CH_NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('getReceiptByInvoice', () => {
    it('should return receipt by invoice ID', async () => {
      const mockReceipt: Receipt = {
        receiptID: 'CH_A3K9MXQP2T7VWRJN',
        date: '2026-05-20',
        accountBilled: 'testuser (test@example.com)',
        invoiceID: 'INV000000001',
        invoiceItems: [],
        total: 100,
        chargedTo: 'Visa **** **** **** 1234',
        userID: 'user-123',
        createdAt: '2026-05-20'
      };

      (dbReceipts.getReceiptByInvoiceID as jest.Mock).mockResolvedValue(mockReceipt);

      const result = await getReceiptByInvoice('user-123', 'INV000000001');

      expect(result).toEqual(mockReceipt);
    });
  });

  describe('listUserReceipts', () => {
    it('should return list of receipts', async () => {
      const mockReceipts: Receipt[] = [
        {
          receiptID: 'CH_A3K9MXQP2T7VWRJN',
          date: '2026-05-20',
          accountBilled: 'testuser (test@example.com)',
          invoiceID: 'INV000000001',
          invoiceItems: [],
          total: 100,
          chargedTo: 'Visa **** **** **** 1234',
          userID: 'user-123',
          createdAt: '2026-05-20'
        }
      ];

      (dbReceipts.listReceipts as jest.Mock).mockResolvedValue(mockReceipts);

      const result = await listUserReceipts('user-123');

      expect(result).toEqual(mockReceipts);
    });
  });

  describe('deleteReceipt', () => {
    it('should delete receipt', async () => {
      (dbReceipts.deleteReceipt as jest.Mock).mockResolvedValue(undefined);

      await deleteReceipt('user-123', 'CH_A3K9MXQP2T7VWRJN');

      expect(dbReceipts.deleteReceipt).toHaveBeenCalledWith('user-123', 'CH_A3K9MXQP2T7VWRJN');
    });
  });
});

// Made with Bob