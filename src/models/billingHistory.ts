import { z } from 'zod';

const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in ISO format YYYY-MM-DD (e.g., 2026-05-20)'
  );

export const billingHistorySchema = z.object({
  billingHistoryID: z
    .string()
    .min(1, 'Billing History ID is required')
    .max(50, 'Billing History ID must not exceed 50 characters'),
  billingUserID: z
    .string()
    .min(1, 'Billing User ID is required')
    .max(50, 'Billing User ID must not exceed 50 characters'),
  invoiceItemID: z
    .string()
    .min(1, 'Invoice Item ID is required')
    .max(50, 'Invoice Item ID must not exceed 50 characters'),
  quantity: z
    .number()
    .finite('Quantity must be a finite number')
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1'),
  rate: z
    .number()
    .finite('Rate must be a finite number')
    .nonnegative('Rate cannot be negative')
    .min(0.01, 'Rate must be at least 0.01'),
  date: isoDateSchema,
  billedStatus: z.enum(['unbilled', 'billed'], {
    message: 'Billed status must be either unbilled or billed'
  }),
  invoiceID: z
    .string()
    .nullable()
    .refine(
      (val) => val === null || (val.length >= 1 && val.length <= 50),
      'Invoice ID must be between 1 and 50 characters when provided'
    ),
  createdAt: isoDateSchema
});

export type BillingHistory = z.infer<typeof billingHistorySchema>;

// Made with Bob
