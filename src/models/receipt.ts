import { z } from 'zod';
import { invoiceItemSchema } from './invoice';

const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in ISO format YYYY-MM-DD (e.g., 2026-05-20)'
  );

export const receiptSchema = z.object({
  receiptID: z
    .string()
    .regex(
      /^CH_[A-Z0-9]{17}$/,
      'Receipt ID must match format CH_ followed by 17 uppercase alphanumeric characters (e.g., CH_A3K9MXQP2T7VWRJN)'
    ),
  date: isoDateSchema,
  accountBilled: z
    .string()
    .min(1, 'Account billed is required')
    .max(200, 'Account billed must not exceed 200 characters'),
  invoiceID: z
    .string()
    .regex(
      /^INV\d{9}$/,
      'Invoice ID must match format INV followed by 9 digits (e.g., INV000000001)'
    ),
  invoiceItems: z
    .array(invoiceItemSchema)
    .min(1, 'Receipt must contain at least one item'),
  total: z
    .number()
    .finite('Total must be a finite number')
    .nonnegative('Total cannot be negative')
    .min(0, 'Total must be at least 0'),
  chargedTo: z
    .string()
    .min(1, 'Charged To is required')
    .max(200, 'Charged To must not exceed 200 characters'),
  userID: z
    .string()
    .min(1, 'User ID is required')
    .max(100, 'User ID must not exceed 100 characters'),
  createdAt: isoDateSchema
});

export type Receipt = z.infer<typeof receiptSchema>;
export type { InvoiceItem } from './invoice';
