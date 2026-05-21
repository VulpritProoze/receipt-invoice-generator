import { z } from 'zod';
import { invoiceSchema, invoiceItemSchema } from '@/models/invoice';

/**
 * Request schema for creating a new invoice
 * Omits auto-generated fields: invoiceID, createdAt
 */
export const invoiceCreateRequestSchema = invoiceSchema.omit({
  invoiceID: true,
  createdAt: true
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
