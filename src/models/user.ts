import { z } from 'zod';

const maskedCreditCardSchema = z
  .string()
  .regex(
    /^\*{4} \*{4} \*{4} \d{4}$/,
    'Credit card number must be masked in format **** **** **** 1234'
  );

export const userSchema = z.object({
  userID: z.string().uuid('User ID must be a valid UUID'),
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, hyphens, and underscores'
    ),
  userEmail: z
    .string()
    .email('Must be a valid email address')
    .max(200, 'Email must not exceed 200 characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(200, 'Full name must not exceed 200 characters'),
  creditCardNumber: maskedCreditCardSchema,
  creditCardType: z
    .string()
    .min(1, 'Credit card type is required')
    .max(50, 'Credit card type must not exceed 50 characters')
});

export type User = z.infer<typeof userSchema>;
