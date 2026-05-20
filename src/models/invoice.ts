import { z } from 'zod';

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected ISO date in YYYY-MM-DD format');

export interface InvoiceItem {
  itemID: string;
  quantity: number;
  description: string;
  rate: number;
  date: string;
}

export interface Invoice {
  invoiceID: string;
  invoiceDate: string;
  terms: string;
  dueDate: string;
  currency: 'PHP' | 'USD';
  billTo: string;
  billToAddressLine: string;
  billToCityAddress: string;
  billToPostalAddress: string;
  billToCountry: string;
  invoiceItems: InvoiceItem[];
  taxRate: number;
  userID: string;
  createdAt: string;
}

export const invoiceItemSchema = z.object({
  itemID: z.string().min(1),
  quantity: z.number().finite().nonnegative(),
  description: z.string().min(1),
  rate: z.number().finite().nonnegative(),
  date: isoDateSchema
});

export const invoiceSchema = z.object({
  invoiceID: z
    .string()
    .regex(/^INV\d{9}$/, 'invoiceID must match INV#########'),
  invoiceDate: isoDateSchema,
  terms: z.string().min(1),
  dueDate: isoDateSchema,
  currency: z.enum(['PHP', 'USD']),
  billTo: z.string().min(1),
  billToAddressLine: z.string().min(1),
  billToCityAddress: z.string().min(1),
  billToPostalAddress: z.string().min(1),
  billToCountry: z.string().min(1),
  invoiceItems: z.array(invoiceItemSchema),
  taxRate: z.number().finite().min(0),
  userID: z.string().min(1),
  createdAt: isoDateSchema
});

export type InvoiceRecord = z.infer<typeof invoiceSchema>;
