import { receiptSchema } from './receipt';

describe('receiptSchema', () => {
  const validReceipt = {
    receiptID: 'CH_ABCDEF12345678901',
    date: '2026-05-20',
    accountBilled: 'Acme Corp',
    invoiceID: 'INV000000001',
    invoiceItems: [
      {
        itemID: 'item-001',
        quantity: 2,
        description: 'Consulting services',
        rate: 1500,
        date: '2026-05-20'
      }
    ],
    total: 3000,
    chargedTo: 'Acme Corp',
    userID: 'user-001',
    createdAt: '2026-05-20'
  };

  it('accepts a valid receipt', () => {
    expect(receiptSchema.parse(validReceipt)).toEqual(validReceipt);
  });

  it('rejects invalid receipt ids', () => {
    expect(
      receiptSchema.safeParse({
        ...validReceipt,
        receiptID: 'INVALID'
      }).success
    ).toBe(false);
  });
});
