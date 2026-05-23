import { z } from 'zod';

const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in ISO format YYYY-MM-DD (e.g., 2026-05-20)'
  );

// InvoiceItemMaster: Master catalog of billable services
export const invoiceItemMasterSchema = z.object({
  invoiceItemID: z
    .string()
    .min(1, 'Invoice Item ID is required')
    .max(50, 'Invoice Item ID must not exceed 50 characters'),
  companyID: z
    .string()
    .min(1, 'Company ID is required')
    .max(50, 'Company ID must not exceed 50 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must not exceed 500 characters'),
  defaultRate: z
    .number()
    .finite('Default rate must be a finite number')
    .nonnegative('Default rate cannot be negative')
    .min(0.01, 'Default rate must be at least 0.01')
    .nullable(),
  createdAt: isoDateSchema
});

// Nested billing history entry structure for invoice JSON
const billingHistoryEntrySchema = z.object({
  billingHistoryID: z.string().min(1).max(50),
  quantity: z.number().int().min(1),
  rate: z.number().min(0.01),
  date: isoDateSchema,
  amount: z.number().min(0) // Calculated: quantity * rate
});

// Invoice item structure with nested billing history
const invoiceItemWithHistorySchema = z.object({
  invoiceItemID: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  billingHistoryEntries: z
    .array(billingHistoryEntrySchema)
    .min(1, 'Invoice item must contain at least one billing history entry')
});

export const invoiceSchema = z.object({
  invoiceID: z
    .string()
    .regex(
      /^INV\d{9}$/,
      'Invoice ID must match format INV followed by 9 digits (e.g., INV000000001)'
    ),
  billingUserID: z
    .string()
    .min(1, 'Billing User ID is required')
    .max(50, 'Billing User ID must not exceed 50 characters'),
  invoiceDate: isoDateSchema,
  terms: z
    .string()
    .min(1, 'Terms are required')
    .max(200, 'Terms must not exceed 200 characters'),
  dueDate: isoDateSchema,
  currency: z.enum(['PHP', 'USD'], {
    message: 'Currency must be either PHP or USD'
  }),
  invoiceItems: z
    .array(invoiceItemWithHistorySchema)
    .min(1, 'Invoice must contain at least one item'),
  taxRate: z
    .number()
    .finite('Tax rate must be a finite number')
    .min(0, 'Tax rate cannot be negative')
    .max(1, 'Tax rate must be between 0 and 1 (e.g., 0.12 for 12%)'),
  createdAt: isoDateSchema
});

export type InvoiceItemMaster = z.infer<typeof invoiceItemMasterSchema>;
export type BillingHistoryEntry = z.infer<typeof billingHistoryEntrySchema>;
export type InvoiceItemWithHistory = z.infer<
  typeof invoiceItemWithHistorySchema
>;
export type Invoice = z.infer<typeof invoiceSchema>;

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

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

