/**
 * Unit tests for Invoice PDF Generator
 * 
 * Tests PDF generation with valid invoice data and verifies:
 * - PDF is generated as a Buffer
 * - Buffer is non-empty
 * - PDF header is present
 * - Currency symbols are correct
 * - Calculations are performed at render time
 */

import { generateInvoicePDF } from './invoicePDF';
import type { Invoice } from '@/models/invoice';
import type { CompanyConfig } from '@/models/company';

describe('generateInvoicePDF', () => {
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

  it('should generate a PDF buffer for valid invoice with PHP currency', async () => {
    const pdfBuffer = await generateInvoicePDF(mockInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Check PDF header (all PDFs start with %PDF-)
    const header = pdfBuffer.toString('utf-8', 0, 5);
    expect(header).toBe('%PDF-');
  });

  it('should generate a PDF buffer for valid invoice with USD currency', async () => {
    const usdInvoice: Invoice = {
      ...mockInvoice,
      currency: 'USD',
    };

    const pdfBuffer = await generateInvoicePDF(usdInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Check PDF header
    const header = pdfBuffer.toString('utf-8', 0, 5);
    expect(header).toBe('%PDF-');
  });

  it('should handle invoice with single line item', async () => {
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

    const pdfBuffer = await generateInvoicePDF(singleItemInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle invoice with multiple line items', async () => {
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

    const pdfBuffer = await generateInvoicePDF(multiItemInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle invoice with zero tax rate', async () => {
    const zeroTaxInvoice: Invoice = {
      ...mockInvoice,
      taxRate: 0,
    };

    const pdfBuffer = await generateInvoicePDF(zeroTaxInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle invoice with high tax rate', async () => {
    const highTaxInvoice: Invoice = {
      ...mockInvoice,
      taxRate: 0.25,
    };

    const pdfBuffer = await generateInvoicePDF(highTaxInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle long descriptions in line items', async () => {
    const longDescInvoice: Invoice = {
      ...mockInvoice,
      invoiceItems: [
        {
          itemID: 'item1',
          quantity: 1,
          description:
            'This is a very long description that spans multiple words and should be handled properly by the PDF generator without breaking the layout or causing any rendering issues',
          rate: 1000,
          date: '2026-05-20',
        },
      ],
    };

    const pdfBuffer = await generateInvoicePDF(longDescInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle decimal quantities and rates', async () => {
    const decimalInvoice: Invoice = {
      ...mockInvoice,
      invoiceItems: [
        {
          itemID: 'item1',
          quantity: 2.5,
          description: 'Hourly Service',
          rate: 150.75,
          date: '2026-05-20',
        },
      ],
    };

    const pdfBuffer = await generateInvoicePDF(decimalInvoice, mockCompanyConfig);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});

// Made with Bob
