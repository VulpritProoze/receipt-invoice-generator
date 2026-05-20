import { invoiceItemSchema, invoiceSchema } from './invoice';

describe('invoice schemas', () => {
  const validInvoiceItem = {
    itemID: 'item-001',
    quantity: 2,
    description: 'Consulting services',
    rate: 1500,
    date: '2026-05-20'
  };

  const validInvoice = {
    invoiceID: 'INV000000001',
    invoiceDate: '2026-05-20',
    terms: 'Net 30',
    dueDate: '2026-06-19',
    currency: 'PHP' as const,
    billTo: 'Acme Corp',
    billToAddressLine: '456 Client Avenue',
    billToCityAddress: 'Taguig City',
    billToPostalAddress: '1634',
    billToCountry: 'Philippines',
    invoiceItems: [validInvoiceItem],
    taxRate: 0.12,
    userID: 'user-001',
    createdAt: '2026-05-20'
  };

  it('accepts a valid invoice item', () => {
    expect(invoiceItemSchema.parse(validInvoiceItem)).toEqual(validInvoiceItem);
  });

  it('rejects invalid invoice item dates', () => {
    expect(
      invoiceItemSchema.safeParse({
        ...validInvoiceItem,
        date: '20-05-2026'
      }).success
    ).toBe(false);
  });

  it('accepts a valid invoice', () => {
    expect(invoiceSchema.parse(validInvoice)).toEqual(validInvoice);
  });

  it('rejects invalid invoice ids', () => {
    expect(
      invoiceSchema.safeParse({
        ...validInvoice,
        invoiceID: 'INV-1'
      }).success
    ).toBe(false);
  });
});
