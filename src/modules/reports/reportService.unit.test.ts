/**
 * Unit tests for Report Service Layer
 *
 * Tests the orchestration logic that:
 * - Loads data from database
 * - Validates ownership
 * - Validates company config completeness
 * - Calls PDF generators
 */

import { generateInvoiceReport, generateReceiptReport } from './reportService';
import * as invoicesDB from '@/lib/db/invoices';
import * as receiptsDB from '@/lib/db/receipts';
import * as companyDB from '@/lib/db/company';
import * as billingUserService from '@/modules/billingUsers/billingUserService';
import * as invoicePDF from './invoicePDF';
import * as receiptPDF from './receiptPDF';
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

describe('generateInvoiceReport', () => {
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

  const mockPDFBuffer = Buffer.from('mock-pdf-content');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate invoice PDF when all data is valid', async () => {
    (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
    (billingUserService.getBillingUser as jest.Mock).mockResolvedValue(mockBillingUser);
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(
      mockCompanyConfig
    );
    (invoicePDF.generateInvoicePDF as jest.Mock).mockResolvedValue(
      mockPDFBuffer
    );

    const result = await generateInvoiceReport('user123', 'INV000000001');

    expect(result).toBe(mockPDFBuffer);
    expect(invoicesDB.getInvoiceByID).toHaveBeenCalledWith(
      'INV000000001'
    );
    expect(billingUserService.getBillingUser).toHaveBeenCalledWith('billing123');
    expect(companyDB.getCompanyConfig).toHaveBeenCalledWith('user123');
    expect(invoicePDF.generateInvoicePDF).toHaveBeenCalledWith(
      mockInvoice,
      mockCompanyConfig
    );
  });

  it('should throw error when invoice not found', async () => {
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);
    (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(null);

    await expect(
      generateInvoiceReport('user123', 'INV000000001')
    ).rejects.toThrow('Invoice not found');

    expect(invoicePDF.generateInvoicePDF).not.toHaveBeenCalled();
  });

  it('should throw error when user does not own invoice', async () => {
    const otherBillingUser = { ...mockBillingUser, companyID: 'otherCompany' };
    (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
    (billingUserService.getBillingUser as jest.Mock).mockResolvedValue(otherBillingUser);
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);

    await expect(
      generateInvoiceReport('user123', 'INV000000001')
    ).rejects.toThrow('Unauthorized: Invoice does not belong to this user');

    expect(invoicePDF.generateInvoicePDF).not.toHaveBeenCalled();
  });

  it('should throw error when company config not found', async () => {
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(null);

    await expect(
      generateInvoiceReport('user123', 'INV000000001')
    ).rejects.toThrow('Company configuration not found');

    expect(invoicePDF.generateInvoicePDF).not.toHaveBeenCalled();
  });

  it('should throw error when company config is incomplete - missing brandName', async () => {
    const incompleteConfig = { ...mockCompanyConfig, brandName: '' };
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(
      incompleteConfig
    );

    await expect(
      generateInvoiceReport('user123', 'INV000000001')
    ).rejects.toThrow('Company configuration incomplete');

    expect(invoicePDF.generateInvoicePDF).not.toHaveBeenCalled();
  });

  it('should throw error when company config is incomplete - missing companyName', async () => {
    const incompleteConfig = { ...mockCompanyConfig, companyName: '' };
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(
      incompleteConfig
    );

    await expect(
      generateInvoiceReport('user123', 'INV000000001')
    ).rejects.toThrow('Company configuration incomplete');
  });
});

describe('generateReceiptReport', () => {
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

  const mockPDFBuffer = Buffer.from('mock-pdf-content');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate receipt PDF when all data is valid', async () => {
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(
      mockCompanyConfig
    );
    (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
    (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
    (billingUserService.getBillingUser as jest.Mock).mockResolvedValue(mockBillingUser);
    (receiptPDF.generateReceiptPDF as jest.Mock).mockResolvedValue(
      mockPDFBuffer
    );

    const result = await generateReceiptReport(
      'user123',
      'CH_A3K9MXQP2T7VWRJN5'
    );

    expect(result).toBe(mockPDFBuffer);
    expect(receiptsDB.getReceipt).toHaveBeenCalledWith(
      'user123',
      'CH_A3K9MXQP2T7VWRJN5'
    );
    expect(invoicesDB.getInvoiceByID).toHaveBeenCalledWith(
      'INV000000001'
    );
    expect(billingUserService.getBillingUser).toHaveBeenCalledWith('billing123');
    expect(companyDB.getCompanyConfig).toHaveBeenCalledWith('user123');
    expect(receiptPDF.generateReceiptPDF).toHaveBeenCalledWith(
      mockReceipt,
      mockInvoice,
      mockCompanyConfig
    );
  });

  it('should throw error when receipt not found', async () => {
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);
    (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(null);

    await expect(
      generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
    ).rejects.toThrow('Receipt not found');

    expect(invoicesDB.getInvoiceByID).not.toHaveBeenCalled();
    expect(receiptPDF.generateReceiptPDF).not.toHaveBeenCalled();
  });

  it('should throw error when user does not own receipt', async () => {
    const otherUserReceipt = { ...mockReceipt, userID: 'otherUser' };
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);
    (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(otherUserReceipt);

    await expect(
      generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
    ).rejects.toThrow('Unauthorized: Receipt does not belong to this user');

    expect(invoicesDB.getInvoiceByID).not.toHaveBeenCalled();
  });

  it('should throw error when related invoice not found', async () => {
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);
    (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
    (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(null);

    await expect(
      generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
    ).rejects.toThrow('Related invoice not found');

    expect(receiptPDF.generateReceiptPDF).not.toHaveBeenCalled();
  });

  it('should throw error when invoice belongs to different user', async () => {
    const otherBillingUser = { ...mockBillingUser, companyID: 'otherCompany' };
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(mockCompanyConfig);
    (receiptsDB.getReceipt as jest.Mock).mockResolvedValue(mockReceipt);
    (invoicesDB.getInvoiceByID as jest.Mock).mockResolvedValue(mockInvoice);
    (billingUserService.getBillingUser as jest.Mock).mockResolvedValue(otherBillingUser);

    await expect(
      generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
    ).rejects.toThrow('Unauthorized: Invoice does not belong to this user');

    expect(receiptPDF.generateReceiptPDF).not.toHaveBeenCalled();
  });

  it('should throw error when company config not found', async () => {
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(null);

    await expect(
      generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
    ).rejects.toThrow('Company configuration not found');

    expect(receiptPDF.generateReceiptPDF).not.toHaveBeenCalled();
  });

  it('should throw error when company config is incomplete', async () => {
    const incompleteConfig = { ...mockCompanyConfig, addressLine: '' };
    (companyDB.getCompanyConfig as jest.Mock).mockResolvedValue(
      incompleteConfig
    );

    await expect(
      generateReceiptReport('user123', 'CH_A3K9MXQP2T7VWRJN5')
    ).rejects.toThrow('Company configuration incomplete');

    expect(receiptPDF.generateReceiptPDF).not.toHaveBeenCalled();
  });
});
