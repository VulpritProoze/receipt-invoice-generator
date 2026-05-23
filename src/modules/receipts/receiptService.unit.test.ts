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
import * as billingUserService from '@/modules/billingUsers/billingUserService';
import * as companyDB from '@/lib/db/company';
import * as idGenerator from '@/lib/idGenerator';
import { Receipt } from '@/models/receipt';
import { Invoice } from '@/models/invoice';
import { User } from '@/models/user';
import { CompanyConfig } from '@/models/company';

// Mock database operations
jest.mock('@/lib/db/receipts');
jest.mock('@/lib/db/invoices');
jest.mock('@/lib/db/users');
jest.mock('@/modules/billingUsers/billingUserService');
jest.mock('@/lib/db/company');
jest.mock('@/lib/idGenerator');

describe('receiptService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReceipt', () => {
    it('should create receipt with generated ID and user data', async () => {
      const mockInvoice: Invoice = {
        invoiceID: 'INV000000001',
        billingUserID: 'billing123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        taxRate: 0.12,
        invoiceItems: [
          {
            invoiceItemID: 'item-1',
            description: 'Service',
            billingHistoryEntries: [
              {
                billingHistoryID: 'bh1',
                quantity: 1,
                rate: 100,
                date: '2026-05-20',
                amount: 100
              }
            ]
          }
        ],
        createdAt: '2026-05-20'
      };

      const mockBillingUser = {
        billingUserID: 'billing123',
        companyID: 'company123',
        name: 'Test Client',
        addressLine: '123 Client St',
        cityAddress: 'Client City',
        postalAddress: '12345',
        country: 'Philippines',
        createdAt: '2026-05-20'
      };

      const mockCompanyConfig: CompanyConfig = {
        companyID: 'company123',
        brandName: 'TestCorp',
        companyName: 'TestCorp Inc.',
        companyUrl: 'https://testcorp.com',
        addressLine: '123 Test Street',
        postalAddress: 'Test City, TC 12345',
        country: 'Test Country',
        logoUrl: 'https://testcorp.com/logo.png'
      };

      const mockUser: User = {
        userID: 'user-123',
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '**** **** **** 1234',
        creditCardType: 'Visa'
      };

      (dbInvoices.getInvoiceByID as any).mockResolvedValue(mockInvoice);
      (billingUserService.getBillingUser as any).mockResolvedValue(mockBillingUser);
      (companyDB.getCompanyConfig as any).mockResolvedValue(mockCompanyConfig);
      (dbReceipts.getReceiptByInvoiceID as any).mockResolvedValue(null);
      (dbUsers.getUser as any).mockResolvedValue(mockUser);
      (idGenerator.generateReceiptID as any).mockReturnValue(
        'CH_A3K9MXQP2T7VWRJN'
      );
      (dbReceipts.createReceipt as any).mockResolvedValue(undefined);

      const receiptData = {
        date: '2026-05-20',
        invoiceID: 'INV000000001',
        invoiceItems: [
          {
            itemID: 'item-1',
            quantity: 1,
            description: 'Service',
            rate: 100,
            date: '2026-05-20'
          }
        ],
        total: 112
      };

      const result = await createReceipt('user-123', receiptData);

      expect(result.receiptID).toBe('CH_A3K9MXQP2T7VWRJN');
      expect(result.accountBilled).toBe('testuser (test@example.com)');
      expect(result.chargedTo).toBe('Visa **** **** **** 1234');
      expect(dbInvoices.getInvoiceByID).toHaveBeenCalledWith(
        'INV000000001'
      );
      expect(dbReceipts.createReceipt).toHaveBeenCalled();
    });

    it('should throw error if invoice not found', async () => {
      (dbInvoices.getInvoiceByID as any).mockResolvedValue(null);

      const receiptData = {
        date: '2026-05-20',
        invoiceID: 'INV000000001',
        invoiceItems: [],
        total: 100
      };

      await expect(createReceipt('user-123', receiptData)).rejects.toThrow(
        'Invoice not found'
      );
    });

    it('should throw error if receipt already exists for invoice', async () => {
      const mockInvoice: Invoice = {
        invoiceID: 'INV000000001',
        billingUserID: 'billing123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        taxRate: 0.12,
        invoiceItems: [],
        createdAt: '2026-05-20'
      };

      const mockBillingUser = {
        billingUserID: 'billing123',
        companyID: 'company123',
        name: 'Test Client',
        addressLine: '123 Client St',
        cityAddress: 'Client City',
        postalAddress: '12345',
        country: 'Philippines',
        createdAt: '2026-05-20'
      };

      const mockCompanyConfig: CompanyConfig = {
        companyID: 'company123',
        brandName: 'TestCorp',
        companyName: 'TestCorp Inc.',
        companyUrl: 'https://testcorp.com',
        addressLine: '123 Test Street',
        postalAddress: 'Test City, TC 12345',
        country: 'Test Country',
        logoUrl: 'https://testcorp.com/logo.png'
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

      (dbInvoices.getInvoiceByID as any).mockResolvedValue(mockInvoice);
      (billingUserService.getBillingUser as any).mockResolvedValue(mockBillingUser);
      (companyDB.getCompanyConfig as any).mockResolvedValue(mockCompanyConfig);
      (dbReceipts.getReceiptByInvoiceID as any).mockResolvedValue(
        existingReceipt
      );

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
        billingUserID: 'billing123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        taxRate: 0.12,
        invoiceItems: [],
        createdAt: '2026-05-20'
      };

      const mockBillingUser = {
        billingUserID: 'billing123',
        companyID: 'company123',
        name: 'Test Client',
        addressLine: '123 Client St',
        cityAddress: 'Client City',
        postalAddress: '12345',
        country: 'Philippines',
        createdAt: '2026-05-20'
      };

      const mockCompanyConfig: CompanyConfig = {
        companyID: 'company123',
        brandName: 'TestCorp',
        companyName: 'TestCorp Inc.',
        companyUrl: 'https://testcorp.com',
        addressLine: '123 Test Street',
        postalAddress: 'Test City, TC 12345',
        country: 'Test Country',
        logoUrl: 'https://testcorp.com/logo.png'
      };

      (dbInvoices.getInvoiceByID as any).mockResolvedValue(mockInvoice);
      (billingUserService.getBillingUser as any).mockResolvedValue(mockBillingUser);
      (companyDB.getCompanyConfig as any).mockResolvedValue(mockCompanyConfig);
      (dbReceipts.getReceiptByInvoiceID as any).mockResolvedValue(null);
      (dbUsers.getUser as any).mockResolvedValue(null);

      const receiptData = {
        date: '2026-05-20',
        invoiceID: 'INV000000001',
        invoiceItems: [],
        total: 100
      };

      await expect(createReceipt('user-123', receiptData)).rejects.toThrow(
        'User not found'
      );
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

      (dbReceipts.getReceipt as any).mockResolvedValue(mockReceipt);

      const result = await getReceipt('user-123', 'CH_A3K9MXQP2T7VWRJN');

      expect(result).toEqual(mockReceipt);
    });

    it('should return null if not found', async () => {
      (dbReceipts.getReceipt as any).mockResolvedValue(null);

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

      (dbReceipts.getReceiptByInvoiceID as any).mockResolvedValue(
        mockReceipt
      );

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

      (dbReceipts.listReceipts as any).mockResolvedValue(mockReceipts);

      const result = await listUserReceipts('user-123');

      expect(result).toEqual(mockReceipts);
    });
  });

  describe('deleteReceipt', () => {
    it('should delete receipt', async () => {
      (dbReceipts.deleteReceipt as any).mockResolvedValue(undefined);

      await deleteReceipt('user-123', 'CH_A3K9MXQP2T7VWRJN');

      expect(dbReceipts.deleteReceipt).toHaveBeenCalledWith(
        'user-123',
        'CH_A3K9MXQP2T7VWRJN'
      );
    });
  });
});
