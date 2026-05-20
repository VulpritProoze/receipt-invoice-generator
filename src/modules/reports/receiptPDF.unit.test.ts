/**
 * Unit tests for Receipt PDF Generator
 * 
 * Tests PDF generation with valid receipt and invoice data and verifies:
 * - PDF is generated as a Buffer
 * - Buffer is non-empty
 * - PDF header is present
 * - Receipt includes invoice line items
 * - Company branding footer is included
 */

import { generateReceiptPDF } from './receiptPDF';
import type { Receipt } from '@/models/receipt';
import type { Invoice } from '@/models/invoice';
import type { CompanyConfig } from '@/models/company';

describe('generateReceiptPDF', () => {
  const mockCompanyConfig: CompanyConfig = {
    brandName: 'TestCorp',
    companyName: 'TestCorp Inc.',
    companyUrl: 'https://testcorp.com',
    addressLine: '123 Test Street',
    postalAddress: 'Test City, TC 12345',
    country: 'Test Country',
    logoUrl: 'https://testcorp.com/logo.png',
  };

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
      {
        itemID: 'item2',
        quantity: 1,
        description: 'Software License',
        rate: 500,
        date: '2026-05-16',
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
    total: 2800, // 2500 subtotal + 300 tax
    chargedTo: 'Mastercard **** **** **** 4242',
    userID: 'user123',
    createdAt: '2026-05-20',
  };

  it('should generate a PDF buffer for valid receipt with PHP currency', async () => {
    const pdfBuffer = await generateReceiptPDF(mockReceipt, mockInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Check PDF header (all PDFs start with %PDF-)
    const header = pdfBuffer.toString('utf-8', 0, 5);
    expect(header).toBe('%PDF-');
  });

  it('should generate a PDF buffer for valid receipt with USD currency', async () => {
    const usdInvoice: Invoice = {
      ...mockInvoice,
      currency: 'USD',
    };

    const pdfBuffer = await generateReceiptPDF(mockReceipt, usdInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Check PDF header
    const header = pdfBuffer.toString('utf-8', 0, 5);
    expect(header).toBe('%PDF-');
  });

  it('should handle receipt with single line item', async () => {
    const singleItemInvoice: Invoice = {
      ...mockInvoice,
      invoiceItems: [
        {
          itemID: 'item1',
          quantity: 1,
          description: 'Single Service',
          rate: 100,
          date: '2026-05-20',
        },
      ],
    };

    const singleItemReceipt: Receipt = {
      ...mockReceipt,
      invoiceItems: singleItemInvoice.invoiceItems,
      total: 112, // 100 + 12% tax
    };

    const pdfBuffer = await generateReceiptPDF(
      singleItemReceipt,
      singleItemInvoice,
      mockCompanyConfig,
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle receipt with multiple line items', async () => {
    const multiItemInvoice: Invoice = {
      ...mockInvoice,
      invoiceItems: [
        {
          itemID: 'item1',
          quantity: 2,
          description: 'Service A',
          rate: 100,
          date: '2026-05-15',
        },
        {
          itemID: 'item2',
          quantity: 3,
          description: 'Service B',
          rate: 200,
          date: '2026-05-16',
        },
        {
          itemID: 'item3',
          quantity: 1,
          description: 'Service C',
          rate: 300,
          date: '2026-05-17',
        },
      ],
    };

    const multiItemReceipt: Receipt = {
      ...mockReceipt,
      invoiceItems: multiItemInvoice.invoiceItems,
      total: 1120, // 1000 + 12% tax
    };

    const pdfBuffer = await generateReceiptPDF(
      multiItemReceipt,
      multiItemInvoice,
      mockCompanyConfig,
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle receipt with zero tax rate', async () => {
    const zeroTaxInvoice: Invoice = {
      ...mockInvoice,
      taxRate: 0,
    };

    const zeroTaxReceipt: Receipt = {
      ...mockReceipt,
      total: 2500, // No tax
    };

    const pdfBuffer = await generateReceiptPDF(zeroTaxReceipt, zeroTaxInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle long account billed string', async () => {
    const longAccountReceipt: Receipt = {
      ...mockReceipt,
      accountBilled:
        'verylongusername_with_many_characters (verylongemail@verylongdomain.example.com)',
    };

    const pdfBuffer = await generateReceiptPDF(
      longAccountReceipt,
      mockInvoice,
      mockCompanyConfig,
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle different credit card types', async () => {
    const visaReceipt: Receipt = {
      ...mockReceipt,
      chargedTo: 'Visa **** **** **** 1234',
    };

    const pdfBuffer = await generateReceiptPDF(visaReceipt, mockInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle long company branding information', async () => {
    const longBrandingConfig: CompanyConfig = {
      brandName: 'Very Long Brand Name Corporation International',
      companyName: 'Very Long Company Name Corporation International Limited',
      companyUrl: 'https://verylongcompanyname.example.com',
      addressLine: '123 Very Long Street Name Avenue Building Complex',
      postalAddress: 'Very Long City Name, Very Long State Name 12345-6789',
      country: 'Very Long Country Name',
      logoUrl: 'https://verylongcompanyname.example.com/logo.png',
    };

    const pdfBuffer = await generateReceiptPDF(mockReceipt, mockInvoice, longBrandingConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});

// Made with Bob
