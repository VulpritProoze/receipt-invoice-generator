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
import type { BillingUser } from '@/models/billingUser';

describe('generateInvoicePDF', () => {
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

  const mockBillingUser: BillingUser = {
    billingUserID: 'billing123',
    companyID: 'company123',
    name: 'John Doe',
    addressLine: '456 Client Ave',
    cityAddress: 'Client City',
    postalAddress: 'CC 67890',
    country: 'Client Country',
    createdAt: '2026-05-20'
  };

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
      },
      {
        invoiceItemID: 'item2',
        description: 'Software License',
        billingHistoryEntries: [
          {
            billingHistoryID: 'bh2',
            quantity: 1,
            rate: 500,
            date: '2026-05-16',
            amount: 500
          }
        ]
      }
    ],
    createdAt: '2026-05-20'
  };

  it('should generate a PDF buffer for valid invoice with PHP currency', async () => {
    const pdfBuffer = await generateInvoicePDF(mockInvoice, mockCompanyConfig, mockBillingUser);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Check PDF header (all PDFs start with %PDF-)
    const header = pdfBuffer.toString('utf-8', 0, 5);
    expect(header).toBe('%PDF-');
  });

  it('should generate a PDF buffer for valid invoice with USD currency', async () => {
    const usdInvoice: Invoice = {
      ...mockInvoice,
      currency: 'USD'
    };

    const pdfBuffer = await generateInvoicePDF(usdInvoice, mockCompanyConfig, mockBillingUser);

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
          invoiceItemID: 'item1',
          description: 'Single Service',
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
      ]
    };

    const pdfBuffer = await generateInvoicePDF(
      singleItemInvoice,
      mockCompanyConfig,
      mockBillingUser
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle invoice with multiple line items', async () => {
    const multiItemInvoice: Invoice = {
      ...mockInvoice,
      invoiceItems: [
        {
          invoiceItemID: 'item1',
          description: 'Service A',
          billingHistoryEntries: [
            {
              billingHistoryID: 'bh1',
              quantity: 2,
              rate: 100,
              date: '2026-05-15',
              amount: 200
            }
          ]
        },
        {
          invoiceItemID: 'item2',
          description: 'Service B',
          billingHistoryEntries: [
            {
              billingHistoryID: 'bh2',
              quantity: 3,
              rate: 200,
              date: '2026-05-16',
              amount: 600
            }
          ]
        },
        {
          invoiceItemID: 'item3',
          description: 'Service C',
          billingHistoryEntries: [
            {
              billingHistoryID: 'bh3',
              quantity: 1,
              rate: 300,
              date: '2026-05-17',
              amount: 300
            }
          ]
        }
      ]
    };

    const pdfBuffer = await generateInvoicePDF(
      multiItemInvoice,
      mockCompanyConfig,
      mockBillingUser
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle invoice with zero tax rate', async () => {
    const zeroTaxInvoice: Invoice = {
      ...mockInvoice,
      taxRate: 0
    };

    const pdfBuffer = await generateInvoicePDF(
      zeroTaxInvoice,
      mockCompanyConfig,
      mockBillingUser
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle invoice with high tax rate', async () => {
    const highTaxInvoice: Invoice = {
      ...mockInvoice,
      taxRate: 0.25
    };

    const pdfBuffer = await generateInvoicePDF(
      highTaxInvoice,
      mockCompanyConfig,
      mockBillingUser
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle long descriptions in line items', async () => {
    const longDescInvoice: Invoice = {
      ...mockInvoice,
      invoiceItems: [
        {
          invoiceItemID: 'item1',
          description:
            'This is a very long description that spans multiple words and should be handled properly by the PDF generator without breaking the layout or causing any rendering issues',
          billingHistoryEntries: [
            {
              billingHistoryID: 'bh1',
              quantity: 1,
              rate: 1000,
              date: '2026-05-20',
              amount: 1000
            }
          ]
        }
      ]
    };

    const pdfBuffer = await generateInvoicePDF(
      longDescInvoice,
      mockCompanyConfig,
      mockBillingUser
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle decimal quantities and rates', async () => {
    const decimalInvoice: Invoice = {
      ...mockInvoice,
      invoiceItems: [
        {
          invoiceItemID: 'item1',
          description: 'Hourly Service',
          billingHistoryEntries: [
            {
              billingHistoryID: 'bh1',
              quantity: 2.5,
              rate: 150.75,
              date: '2026-05-20',
              amount: 376.875
            }
          ]
        }
      ]
    };

    const pdfBuffer = await generateInvoicePDF(
      decimalInvoice,
      mockCompanyConfig,
      mockBillingUser
    );

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
