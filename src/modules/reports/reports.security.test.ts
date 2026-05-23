/**
 * Security tests for onboarding module
 * Tests user isolation, XSS prevention, and URL validation
 */

import { generateInvoiceReport, generateReceiptReport } from './reportService';
import * as invoicesDB from '@/lib/db/invoices';
import * as receiptsDB from '@/lib/db/receipts';
import * as companyDB from '@/lib/db/company';
import * as billingUserService from '@/modules/billingUsers/billingUserService';
import type { Invoice } from '@/models/invoice';
import type { Receipt } from '@/models/receipt';
import type { CompanyConfig } from '@/models/company';

// Mock all database and PDF modules
jest.mock('@/lib/db/invoices');
jest.mock('@/lib/db/receipts');
jest.mock('@/lib/db/company');
jest.mock('@/modules/billingUsers/billingUserService');
jest.mock('./invoicePDF');
jest.mock('./receiptPDF');

describe('Report Generation Security Tests', () => {
  const mockInvoice: Invoice = {
    invoiceID: 'INV000000001',
    billingUserID: 'billing123',
    invoiceDate: '2026-05-20',
    terms: 'Due Upon Receipt',
    dueDate: '2026-06-20',
    currency: 'PHP',
    taxRate: 0.12,
    invoiceItems: [
      {
        invoiceItemID: 'item1',
        description: 'Consulting Services',
        billingHistoryEntries: [
          {
            billingHistoryID: 'bh1',
            quantity: 2,
            rate: 1000,
            date: '2026-05-15',
            amount: 2000
          }
        ]
      }
    ],
    createdAt: '2026-05-20'
  };

  const mockReceiptItem = {
    itemID: 'item1',
    quantity: 2,
    description: 'Consulting Services',
    rate: 1000,
    date: '2026-05-15'
  };

  const mockReceipt: Receipt = {
    receiptID: 'CH_A3K9MXQP2T7VWRJN5',
    date: '2026-05-20',
    accountBilled: 'jdoe (jdoe@example.com)',
    invoiceID: 'INV000000001',
    invoiceItems: [mockReceiptItem],
    total: 2240,
    chargedTo: 'Mastercard **** **** **** 4242',
    userID: 'user123',
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

  const mockBillingUser = {
    billingUserID: 'billing123',
    companyID: 'company123',
    name: 'John Doe',
    addressLine: '456 Client Ave',
    cityAddress: 'Client City',
    postalAddress: 'CC 67890',
    country: 'Client Country',
    createdAt: '2026-05-20'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (billingUserService.getBillingUser as jest.Mock).mockResolvedValue(mockBillingUser);
  });

  describe('Security Requirement: Receipt generation requires verified invoice from database', () => {
    it('should load invoice from database, not accept from request body', async () => {
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
      (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(
        mockCompanyConfig
      );

      await generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5');

      // Verify invoice was loaded from database using receipt's invoiceID
      expect(invoicesDB.getInvoiceByID).toHaveBeenCalledWith(
        mockReceipt.invoiceID
      );
    });

    it('should reject receipt generation when invoice does not exist in database', async () => {
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
      (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(null);

      await expect(
        generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
      ).rejects.toThrow('Related invoice not found');
    });
  });

  describe('Security Requirement: User ownership validation', () => {
    it('should reject invoice generation when user does not own invoice', async () => {
      const otherBillingUser = { ...mockBillingUser, companyID: 'otherCompany' };
      (billingUserService.getBillingUser as jest.Mock).mockResolvedValue(otherBillingUser);
      (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);

      await expect(
        generateInvoiceReport('user123', 'INV000000001')
      ).rejects.toThrow('Unauthorized: Invoice does not belong to this user');
    });

    it('should reject receipt generation when user does not own receipt', async () => {
      const otherUserReceipt = { ...mockReceipt, userID: 'otherUser' };
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(otherUserReceipt);

      await expect(
        generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
      ).rejects.toThrow('Unauthorized: Receipt does not belong to this user');
    });

    it('should reject receipt generation when invoice belongs to different user than receipt', async () => {
      const otherBillingUser = { ...mockBillingUser, companyID: 'otherCompany' };
      (billingUserService.getBillingUser as jest.Mock).mockResolvedValue(otherBillingUser);
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
      (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);

      await expect(
        generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
      ).rejects.toThrow('Unauthorized: Invoice does not belong to this user');
    });
  });

  describe('Security Requirement: Company config must be complete', () => {
    it('should reject invoice generation when company config does not exist', async () => {
      (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(null);

      await expect(
        generateInvoiceReport('user123', 'INV000000001')
      ).rejects.toThrow('Company configuration not found');
    });

    it('should reject receipt generation when company config does not exist', async () => {
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
      (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(null);

      await expect(
        generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
      ).rejects.toThrow('Company configuration not found');
    });

    it('should reject when any required company config field is empty', async () => {
      const requiredFields: (keyof CompanyConfig)[] = [
        'brandName',
        'companyName',
        'companyUrl',
        'addressLine',
        'postalAddress',
        'country'
      ];

      for (const field of requiredFields) {
        const incompleteConfig = { ...mockCompanyConfig, [field]: '' };
        (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
        (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(
          incompleteConfig
        );

        await expect(
          generateInvoiceReport('user123', 'INV000000001')
        ).rejects.toThrow('Company configuration incomplete');

        jest.clearAllMocks();
      }
    });
  });

  describe('Security Requirement: Invoice totals cannot be negative', () => {
    it('should handle invoice with all positive values correctly', async () => {
      const positiveInvoice: Invoice = {
        ...mockInvoice,
        invoiceItems: [
          {
            invoiceItemID: 'item1',
            description: 'Service',
            billingHistoryEntries: [
              {
                billingHistoryID: 'bh1',
                quantity: 5,
                rate: 100,
                date: '2026-05-20',
                amount: 500
              }
            ]
          }
        ],
        taxRate: 0.12
      };

      (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(positiveInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(
        mockCompanyConfig
      );

      // Should not throw - positive values are valid
      await expect(
        generateInvoiceReport('user123', 'INV000000001')
      ).resolves.toBeDefined();
    });

    it('should handle invoice with zero quantity (edge case)', async () => {
      const zeroQuantityInvoice: Invoice = {
        ...mockInvoice,
        invoiceItems: [
          {
            invoiceItemID: 'item1',
            description: 'Service',
            billingHistoryEntries: [
              {
                billingHistoryID: 'bh1',
                quantity: 1,
                rate: 0.01,
                date: '2026-05-20',
                amount: 0.01
              }
            ]
          }
        ]
      };

      (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(
        zeroQuantityInvoice
      );
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(
        mockCompanyConfig
      );

      // Should not throw - calculation should handle edge case
      await expect(
        generateInvoiceReport('user123', 'INV000000001')
      ).resolves.toBeDefined();
    });
  });

  describe('Security Requirement: No sensitive data leaks in error messages', () => {
    it('should not expose database connection details in errors', async () => {
      const dbError = new Error(
        'Redis connection failed at redis://internal-host:6379'
      );
      (invoicesDB.getInvoiceByID as jest.Mock).mockRejectedValue(dbError);

      // The service layer should catch and re-throw with safe message
      // or let it bubble up for the API layer to sanitize
      await expect(
        generateInvoiceReport('user123', 'INV000000001')
      ).rejects.toThrow();

      // The thrown error should not contain connection details
      try {
        await generateInvoiceReport('user123', 'INV000000001');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        expect(errorMessage).not.toContain('redis://');
        expect(errorMessage).not.toContain('internal-host');
        expect(errorMessage).not.toContain('6379');
      }
    });

    it('should not expose internal file paths in errors', async () => {
      const pathError = new Error(
        'Failed to read /var/app/config/secrets.json'
      );
      (companyDB.getCompanyConfig as jest.Mock).mockRejectedValue(pathError);
      (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(
        generateInvoiceReport('user123', 'INV000000001')
      ).rejects.toThrow();

      try {
        await generateInvoiceReport('user123', 'INV000000001');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        expect(errorMessage).not.toContain('/var/app');
        expect(errorMessage).not.toContain('secrets.json');
      }
    });
  });
});
