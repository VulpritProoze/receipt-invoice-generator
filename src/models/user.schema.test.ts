import { userSchema } from './user';

describe('userSchema', () => {
  const validUser = {
    userID: '550e8400-e29b-41d4-a716-446655440000',
    username: 'copilot',
    userEmail: 'copilot@example.com',
    fullName: 'Copilot User',
    creditCardNumber: '**** **** **** 1234',
    creditCardType: 'Visa'
  };

  it('accepts a valid masked user record', () => {
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validUser);
    }
  });

  describe('userID validation', () => {
    it('rejects invalid UUID format', () => {
      const result = userSchema.safeParse({
        ...validUser,
        userID: 'not-a-uuid'
      });
      expect(result.success).toBe(false);
    });

    it('rejects UUID without hyphens', () => {
      const result = userSchema.safeParse({
        ...validUser,
        userID: '550e8400e29b41d4a716446655440000'
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid UUID v4', () => {
      const result = userSchema.safeParse({
        ...validUser,
        userID: '123e4567-e89b-12d3-a456-426614174000'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('username validation', () => {
    it('rejects empty username', () => {
      const result = userSchema.safeParse({
        ...validUser,
        username: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects username exceeding 50 characters', () => {
      const result = userSchema.safeParse({
        ...validUser,
        username: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });

    it('rejects username with spaces', () => {
      const result = userSchema.safeParse({
        ...validUser,
        username: 'user name'
      });
      expect(result.success).toBe(false);
    });

    it('rejects username with special characters', () => {
      const result = userSchema.safeParse({
        ...validUser,
        username: 'user@name'
      });
      expect(result.success).toBe(false);
    });

    it('accepts username with hyphens and underscores', () => {
      const result = userSchema.safeParse({
        ...validUser,
        username: 'user-name_123'
      });
      expect(result.success).toBe(true);
    });

    it('accepts alphanumeric username', () => {
      const result = userSchema.safeParse({
        ...validUser,
        username: 'user123'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('userEmail validation', () => {
    it('rejects invalid email format', () => {
      const result = userSchema.safeParse({
        ...validUser,
        userEmail: 'not-an-email'
      });
      expect(result.success).toBe(false);
    });

    it('rejects email without domain', () => {
      const result = userSchema.safeParse({
        ...validUser,
        userEmail: 'user@'
      });
      expect(result.success).toBe(false);
    });

    it('rejects email exceeding 200 characters', () => {
      const longEmail = 'a'.repeat(190) + '@example.com';
      const result = userSchema.safeParse({
        ...validUser,
        userEmail: longEmail
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid email', () => {
      const result = userSchema.safeParse({
        ...validUser,
        userEmail: 'user.name+tag@example.co.uk'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('fullName validation', () => {
    it('rejects empty full name', () => {
      const result = userSchema.safeParse({
        ...validUser,
        fullName: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects full name exceeding 200 characters', () => {
      const result = userSchema.safeParse({
        ...validUser,
        fullName: 'a'.repeat(201)
      });
      expect(result.success).toBe(false);
    });

    it('accepts full name with spaces', () => {
      const result = userSchema.safeParse({
        ...validUser,
        fullName: 'John Michael Smith'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('creditCardNumber validation', () => {
    it('rejects unmasked card numbers', () => {
      const result = userSchema.safeParse({
        ...validUser,
        creditCardNumber: '4111 1111 1111 1111'
      });
      expect(result.success).toBe(false);
    });

    it('rejects partially masked card numbers', () => {
      const result = userSchema.safeParse({
        ...validUser,
        creditCardNumber: '4111 **** **** 1234'
      });
      expect(result.success).toBe(false);
    });

    it('rejects card number without spaces', () => {
      const result = userSchema.safeParse({
        ...validUser,
        creditCardNumber: '****************1234'
      });
      expect(result.success).toBe(false);
    });

    it('rejects card number with wrong last 4 format', () => {
      const result = userSchema.safeParse({
        ...validUser,
        creditCardNumber: '**** **** **** 12AB'
      });
      expect(result.success).toBe(false);
    });

    it('accepts properly masked card number', () => {
      const result = userSchema.safeParse({
        ...validUser,
        creditCardNumber: '**** **** **** 5678'
      });
      expect(result.success).toBe(true);
    });

    it('accepts masked card with zeros in last 4', () => {
      const result = userSchema.safeParse({
        ...validUser,
        creditCardNumber: '**** **** **** 0000'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('creditCardType validation', () => {
    it('rejects empty credit card type', () => {
      const result = userSchema.safeParse({
        ...validUser,
        creditCardType: ''
      });
      expect(result.success).toBe(false);
    });

    it('rejects credit card type exceeding 50 characters', () => {
      const result = userSchema.safeParse({
        ...validUser,
        creditCardType: 'a'.repeat(51)
      });
      expect(result.success).toBe(false);
    });

    it('accepts common credit card types', () => {
      const types = ['Visa', 'Mastercard', 'American Express', 'Discover'];
      types.forEach((type) => {
        const result = userSchema.safeParse({
          ...validUser,
          creditCardType: type
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('missing fields', () => {
    it('rejects user missing userID', () => {
      const { userID, ...incomplete } = validUser;
      const result = userSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects user missing username', () => {
      const { username, ...incomplete } = validUser;
      const result = userSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects user missing creditCardNumber', () => {
      const { creditCardNumber, ...incomplete } = validUser;
      const result = userSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });
});
