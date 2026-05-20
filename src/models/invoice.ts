import { z } from 'zod';

const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in ISO format YYYY-MM-DD (e.g., 2026-05-20)'
  );

export const invoiceItemSchema = z.object({
  itemID: z
    .string()
    .min(1, 'Item ID is required')
    .max(50, 'Item ID must not exceed 50 characters'),
  quantity: z
    .number()
    .finite('Quantity must be a finite number')
    .nonnegative('Quantity cannot be negative')
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must not exceed 500 characters'),
  rate: z
    .number()
    .finite('Rate must be a finite number')
    .nonnegative('Rate cannot be negative')
    .min(0.01, 'Rate must be at least 0.01'),
  date: isoDateSchema
});

export const invoiceSchema = z.object({
  invoiceID: z
    .string()
    .regex(
      /^INV\d{9}$/,
      'Invoice ID must match format INV followed by 9 digits (e.g., INV000000001)'
    ),
  invoiceDate: isoDateSchema,
  terms: z
    .string()
    .min(1, 'Terms are required')
    .max(200, 'Terms must not exceed 200 characters'),
  dueDate: isoDateSchema,
  currency: z.enum(['PHP', 'USD'], {
    message: 'Currency must be either PHP or USD'
  }),
  billTo: z
    .string()
    .min(1, 'Bill To name is required')
    .max(200, 'Bill To name must not exceed 200 characters'),
  billToAddressLine: z
    .string()
    .min(1, 'Bill To address line is required')
    .max(200, 'Bill To address line must not exceed 200 characters'),
  billToCityAddress: z
    .string()
    .min(1, 'Bill To city is required')
    .max(100, 'Bill To city must not exceed 100 characters'),
  billToPostalAddress: z
    .string()
    .min(1, 'Bill To postal address is required')
    .max(50, 'Bill To postal address must not exceed 50 characters'),
  billToCountry: z
    .string()
    .min(1, 'Bill To country is required')
    .max(100, 'Bill To country must not exceed 100 characters'),
  invoiceItems: z
    .array(invoiceItemSchema)
    .min(1, 'Invoice must contain at least one item'),
  taxRate: z
    .number()
    .finite('Tax rate must be a finite number')
    .min(0, 'Tax rate cannot be negative')
    .max(1, 'Tax rate must be between 0 and 1 (e.g., 0.12 for 12%)'),
  userID: z
    .string()
    .min(1, 'User ID is required')
    .max(100, 'User ID must not exceed 100 characters'),
  createdAt: isoDateSchema
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
