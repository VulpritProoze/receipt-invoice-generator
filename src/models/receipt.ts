import { z } from 'zod';
import { invoiceItemSchema } from './invoice';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected ISO date in YYYY-MM-DD format');

export interface Receipt {
  receiptID: string;
  date: string;
  accountBilled: string;
  invoiceID: string;
  invoiceItems: InvoiceItem[];
  total: number;
  chargedTo: string;
  userID: string;
  createdAt: string;
}

export type InvoiceItem = import('./invoice').InvoiceItem;

export const receiptSchema = z.object({
  receiptID: z.string().regex(/^CH_[A-Z0-9]{17}$/, 'receiptID must match CH_ + 17 uppercase alphanumeric chars'),
  date: isoDateSchema,
  accountBilled: z.string().min(1),
  invoiceID: z.string().regex(/^INV\d{9}$/, 'invoiceID must match INV#########'),
  invoiceItems: z.array(invoiceItemSchema),
  total: z.number().finite().nonnegative(),
  chargedTo: z.string().min(1),
  userID: z.string().min(1),
  createdAt: isoDateSchema
});

export type ReceiptRecord = z.infer<typeof receiptSchema>;