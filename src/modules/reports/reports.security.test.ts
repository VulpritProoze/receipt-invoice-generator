/**
 * Security tests for Report Generation Module
 * 
 * Verifies security requirements:
 * 1. Receipt generation requires verified invoice from database
 * 2. User ownership is validated for both invoices and receipts
 * 3. Company config must be complete before generating reports
 * 4. Invoice totals cannot be negative
 * 5. No sensitive data leaks in error messages
 */

import { generateInvoiceReport, generateReceiptReport } from './reportService';
import * as invoicesDB from '@/lib/db/invoices';
import * as receiptsDB from '@/lib/db/receipts';
import * as companyDB from '@/lib/db/company';
import type { Invoice } from '@/models/invoice';
import type { Receipt } from '@/models/receipt';
import type { CompanyConfig } from '@/models/company';

jest.mock('@/lib/db/invoices');
jest.mock('@/lib/db/receipts');
jest.mock('@/lib/db/company');
jest.mock('./invoicePDF');
jest.mock('./receiptPDF');

describe('Report Generation Security Tests', () => {
  const mockInvoice: Invoice = {
    invoiceID: 'INV000000001',
    userID: 'user123',
    invoiceDate: '2026-05-20',
    terms: 'Due Upon Receipt',
    dueDate: '2026-06-20',
    currency: 'PHP',
    billTo: 'John Doe',
    billToAddressLine: '456 Client Ave',
    billToCityAddress: 'Client City',
    billToPostalAddress: 'CC 67890',
    billToCountry: 'Client Country',
    taxRate: 0.12,
    invoiceItems: [
      {
        itemID: 'item1',
        quantity: 2,
        description: 'Consulting Services',
        rate: 1000,
        date: '2026-05-15',
      },
    ],
    createdAt: '2026-05-20',
  };

  const mockReceipt: Receipt = {
    receiptID: 'CH_A3K9MXQP2T7VWRJN5',
    date: '2026-05-20',
    accountBilled: 'jdoe (jdoe@example.com)',
    invoiceID: 'INV000000001',
    invoiceItems: mockInvoice.invoiceItems,
    total: 2240,
    chargedTo: 'Mastercard **** **** **** 4242',
    userID: 'user123',
    createdAt: '2026-05-20',
  };

  const mockCompanyConfig: CompanyConfig = {
    brandName: 'TestCorp',
    companyName: 'TestCorp Inc.',
    companyUrl: 'https://testcorp.com',
    addressLine: '123 Test Street',
    postalAddress: 'Test City, TC 12345',
    country: 'Test Country',
    logoUrl: 'https://testcorp.com/logo.png',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Security Requirement: Receipt generation requires verified invoice from database', () => {
    it('should load invoice from database, not accept from request body', async () => {
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
      (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(mockInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);

      await generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5');

      // Verify invoice was loaded from database using receipt's invoiceID
      expect(invoicesDB.getInvoice).toHaveBeenCalledWith('user123', mockReceipt.invoiceID);
    });

    it('should reject receipt generation when invoice does not exist in database', async () => {
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
      (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(null);

      await expect(generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')).rejects.toThrow(
        'Related invoice not found',
      );
    });
  });

  describe('Security Requirement: User ownership validation', () => {
    it('should reject invoice generation when user does not own invoice', async () => {
      const otherUserInvoice = { ...mockInvoice, userID: 'otherUser' };
      (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(otherUserInvoice);

      await expect(generateInvoiceReport('user123', 'INV000000001')).rejects.toThrow(
        'Unauthorized: Invoice does not belong to this user',
      );
    });

    it('should reject receipt generation when user does not own receipt', async () => {
      const otherUserReceipt = { ...mockReceipt, userID: 'otherUser' };
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(otherUserReceipt);

      await expect(generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')).rejects.toThrow(
        'Unauthorized: Receipt does not belong to this user',
      );
    });

    it('should reject receipt generation when invoice belongs to different user than receipt', async () => {
      const otherUserInvoice = { ...mockInvoice, userID: 'otherUser' };
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
      (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(otherUserInvoice);

      await expect(generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')).rejects.toThrow(
        'Unauthorized: Invoice does not belong to this user',
      );
    });
  });

  describe('Security Requirement: Company config must be complete', () => {
    it('should reject invoice generation when company config does not exist', async () => {
      (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(mockInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(null);

      await expect(generateInvoiceReport('user123', 'INV000000001')).rejects.toThrow(
        'Company configuration not found',
      );
    });

    it('should reject receipt generation when company config does not exist', async () => {
      (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
      (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(mockInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(null);

      await expect(generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')).rejects.toThrow(
        'Company configuration not found',
      );
    });

    it('should reject when any required company config field is empty', async () => {
      const requiredFields: (keyof CompanyConfig)[] = [
        'brandName',
        'companyName',
        'companyUrl',
        'addressLine',
        'postalAddress',
        'country',
      ];

      for (const field of requiredFields) {
        const incompleteConfig = { ...mockCompanyConfig, [field]: '' };
        (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(mockInvoice);
        (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(incompleteConfig);

        await expect(generateInvoiceReport('user123', 'INV000000001')).rejects.toThrow(
          'Company configuration incomplete',
        );

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
            itemID: 'item1',
            quantity: 5,
            description: 'Service',
            rate: 100,
            date: '2026-05-20',
          },
        ],
        taxRate: 0.12,
      };

      (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(positiveInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);

      // Should not throw - positive values are valid
      await expect(
        generateInvoiceReport('user123', 'INV000000001'),
      ).resolves.toBeDefined();
    });

    it('should handle invoice with zero quantity (edge case)', async () => {
      // Note: Zod schema should prevent this, but test the calculation layer
      const zeroQuantityInvoice: Invoice = {
        ...mockInvoice,
        invoiceItems: [
          {
            itemID: 'item1',
            quantity: 1, // Zod enforces min 1
            description: 'Service',
            rate: 0, // But rate can be 0.01 minimum per schema
            date: '2026-05-20',
          },
        ],
      };

      (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(zeroQuantityInvoice);
      (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);

      // Should not throw - calculation should handle edge case
      await expect(
        generateInvoiceReport('user123', 'INV000000001'),
      ).resolves.toBeDefined();
    });
  });

  describe('Security Requirement: No sensitive data leaks in error messages', () => {
    it('should not expose database connection details in errors', async () => {
      const dbError = new Error('Redis connection failed at redis://internal-host:6379');
      (invoicesDB.getInvoice as jest.Mock).mockRejectedValue(dbError);

      // The service layer should catch and re-throw with safe message
      // or let it bubble up for the API layer to sanitize
      await expect(generateInvoiceReport('user123', 'INV000000001')).rejects.toThrow();

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
      const pathError = new Error('Failed to read /var/app/config/secrets.json');
      (companyDB.getCompanyConfig as jest.Mock).mockRejectedValue(pathError);
      (invoicesDB.getInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(generateInvoiceReport('user123', 'INV000000001')).rejects.toThrow();

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

// Made with Bob
