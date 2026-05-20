import { z } from 'zod';

const maskedCreditCardSchema = z
  .string()
  .regex(
    /^\*{4} \*{4} \*{4} \d{4}$/,
    'creditCardNumber must be masked as **** **** **** 1234'
  );

export interface User {
  userID: string;
  username: string;
  userEmail: string;
  fullName: string;
  creditCardNumber: string;
  creditCardType: string;
}

export const userSchema = z.object({
  userID: z.string().uuid(),
  username: z.string().min(1),
  userEmail: z.string().email(),
  fullName: z.string().min(1),
  creditCardNumber: maskedCreditCardSchema,
  creditCardType: z.string().min(1)
});

export type UserRecord = z.infer<typeof userSchema>;
