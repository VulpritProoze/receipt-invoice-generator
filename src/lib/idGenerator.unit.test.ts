import { generateInvoiceID, generateReceiptID } from './idGenerator';

describe('generateInvoiceID', () => {
  it('generates correct format for single digit', () => {
    expect(generateInvoiceID(1)).toBe('INV000000001');
  });

  it('generates correct format for multi-digit numbers', () => {
    expect(generateInvoiceID(42)).toBe('INV000000042');
    expect(generateInvoiceID(123)).toBe('INV000000123');
    expect(generateInvoiceID(999999999)).toBe('INV999999999');
  });

  it('pads with zeros correctly', () => {
    expect(generateInvoiceID(1)).toHaveLength(12); // INV + 9 digits
    expect(generateInvoiceID(1000)).toBe('INV000001000');
  });

  it('throws error for non-integer sequence numbers', () => {
    expect(() => generateInvoiceID(1.5)).toThrow(
      'Sequence number must be an integer'
    );
    expect(() => generateInvoiceID(NaN)).toThrow(
      'Sequence number must be an integer'
    );
  });

  it('throws error for sequence number less than 1', () => {
    expect(() => generateInvoiceID(0)).toThrow(
      'Sequence number must be between 1 and 999999999'
    );
    expect(() => generateInvoiceID(-1)).toThrow(
      'Sequence number must be between 1 and 999999999'
    );
  });

  it('throws error for sequence number greater than 999999999', () => {
    expect(() => generateInvoiceID(1000000000)).toThrow(
      'Sequence number must be between 1 and 999999999'
    );
  });

  it('generates IDs that match the invoice ID regex', () => {
    const invoiceIDRegex = /^INV\d{9}$/;
    expect(generateInvoiceID(1)).toMatch(invoiceIDRegex);
    expect(generateInvoiceID(500000)).toMatch(invoiceIDRegex);
    expect(generateInvoiceID(999999999)).toMatch(invoiceIDRegex);
  });
});

describe('generateReceiptID', () => {
  it('generates ID with correct format', () => {
    const receiptID = generateReceiptID();
    expect(receiptID).toMatch(/^CH_[A-Z0-9]{17}$/);
  });

  it('generates ID with correct length', () => {
    const receiptID = generateReceiptID();
    expect(receiptID).toHaveLength(20); // CH_ + 17 characters
  });

  it('generates unique IDs on multiple calls', () => {
    const id1 = generateReceiptID();
    const id2 = generateReceiptID();
    const id3 = generateReceiptID();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('generates IDs with only uppercase alphanumeric characters', () => {
    const receiptID = generateReceiptID();
    const suffix = receiptID.slice(3); // Remove "CH_" prefix

    expect(suffix).toMatch(/^[A-Z0-9]+$/);
    expect(suffix).not.toMatch(/[a-z]/); // No lowercase
    expect(suffix).not.toMatch(/[^A-Z0-9]/); // No special chars
  });

  it('generates multiple IDs successfully', () => {
    // Test that we can generate many IDs without errors
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = generateReceiptID();
      expect(id).toMatch(/^CH_[A-Z0-9]{17}$/);
      ids.add(id);
    }

    // All IDs should be unique
    expect(ids.size).toBe(100);
  });
});

// Made with Bob
