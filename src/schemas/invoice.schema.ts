import { z } from 'zod';
import { invoiceSchema, invoiceItemSchema } from '@/models/invoice';

/**
 * Request schema for creating a new invoice
 * Omits auto-generated fields: invoiceID, createdAt
 */
export const invoiceCreateRequestSchema = z.object({
  billingUserID: z.string().min(1).max(50),
  billingHistoryIDs: z.array(z.string().min(1).max(50)).min(1),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  terms: z.string().min(1).max(200),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.enum(['PHP', 'USD']),
  taxRate: z.number().min(0).max(1)
});

/**
 * Request schema for updating an invoice
 * All fields optional except userID (for authorization)
 */
export const invoiceUpdateRequestSchema = invoiceSchema
  .omit({
    invoiceID: true,
    createdAt: true
  })
  .partial()
  .extend({
    userID: z.string().min(1, 'User ID is required')
  });

/**
 * Type exports for request DTOs
 */
export type InvoiceCreateRequest = z.infer<typeof invoiceCreateRequestSchema>;
export type InvoiceUpdateRequest = z.infer<typeof invoiceUpdateRequestSchema>;

// Re-export item schema for convenience
export { invoiceItemSchema };

// Made with Bob
