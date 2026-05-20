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
    expect(userSchema.parse(validUser)).toEqual(validUser);
  });

  it('rejects unmasked card numbers', () => {
    expect(
      userSchema.safeParse({
        ...validUser,
        creditCardNumber: '4111 1111 1111 1111'
      }).success
    ).toBe(false);
  });
});
