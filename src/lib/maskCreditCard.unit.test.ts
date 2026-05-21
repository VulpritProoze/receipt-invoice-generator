import { maskCreditCard } from './maskCreditCard';

describe('maskCreditCard', () => {
  it('masks a 16-digit card number correctly', () => {
    expect(maskCreditCard('4111111111111234')).toBe('**** **** **** 1234');
  });

  it('masks card numbers with spaces', () => {
    expect(maskCreditCard('4111 1111 1111 1234')).toBe('**** **** **** 1234');
  });

  it('masks card numbers with dashes', () => {
    expect(maskCreditCard('4111-1111-1111-1234')).toBe('**** **** **** 1234');
  });

  it('masks card numbers with mixed separators', () => {
    expect(maskCreditCard('4111 1111-1111 1234')).toBe('**** **** **** 1234');
  });

  it('handles 13-digit card numbers (minimum valid length)', () => {
    expect(maskCreditCard('4111111111234')).toBe('**** **** **** 1234');
  });

  it('handles 15-digit card numbers (Amex)', () => {
    expect(maskCreditCard('371449635398431')).toBe('**** **** **** 8431');
  });

  it('handles 19-digit card numbers (maximum valid length)', () => {
    expect(maskCreditCard('4111111111111111234')).toBe('**** **** **** 1234');
  });

  it('extracts last 4 digits correctly', () => {
    expect(maskCreditCard('4111111111111111')).toBe('**** **** **** 1111');
    expect(maskCreditCard('5555555555554444')).toBe('**** **** **** 4444');
    expect(maskCreditCard('378282246310005')).toBe('**** **** **** 0005');
  });

  it('throws error for empty string', () => {
    expect(() => maskCreditCard('')).toThrow(
      'Credit card number must be a non-empty string'
    );
  });

  it('throws error for null or undefined', () => {
    expect(() => maskCreditCard(null as unknown as string)).toThrow(
      'Credit card number must be a non-empty string'
    );
    expect(() => maskCreditCard(undefined as unknown as string)).toThrow(
      'Credit card number must be a non-empty string'
    );
  });

  it('throws error for non-string input', () => {
    expect(() => maskCreditCard(123456789 as unknown as string)).toThrow(
      'Credit card number must be a non-empty string'
    );
  });

  it('throws error for card number too short', () => {
    expect(() => maskCreditCard('123456789012')).toThrow(
      'Credit card number must contain between 13 and 19 digits'
    );
  });

  it('throws error for card number too long', () => {
    expect(() => maskCreditCard('12345678901234567890')).toThrow(
      'Credit card number must contain between 13 and 19 digits'
    );
  });

  it('throws error for string with no digits', () => {
    expect(() => maskCreditCard('abcd-efgh-ijkl-mnop')).toThrow(
      'Credit card number must contain between 13 and 19 digits'
    );
  });

  it('throws error for string with insufficient digits', () => {
    expect(() => maskCreditCard('4111 1111 11')).toThrow(
      'Credit card number must contain between 13 and 19 digits'
    );
  });

  it('handles card numbers with various non-digit characters', () => {
    expect(maskCreditCard('4111.1111.1111.1234')).toBe('**** **** **** 1234');
    expect(maskCreditCard('4111/1111/1111/1234')).toBe('**** **** **** 1234');
    expect(maskCreditCard('(4111) 1111-1111 1234')).toBe('**** **** **** 1234');
  });

  it('returns consistent format regardless of input format', () => {
    const inputs = [
      '4111111111111234',
      '4111 1111 1111 1234',
      '4111-1111-1111-1234',
      '4111.1111.1111.1234'
    ];

    const expected = '**** **** **** 1234';
    inputs.forEach((input) => {
      expect(maskCreditCard(input)).toBe(expected);
    });
  });
});

// Made with Bob
