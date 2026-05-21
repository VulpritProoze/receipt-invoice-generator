import { z } from 'zod';
import { receiptSchema } from '@/models/receipt';
import { invoiceItemSchema } from '@/models/invoice';

/**
 * Request schema for creating a new receipt
 * Omits auto-generated fields: receiptID, createdAt
 * accountBilled and chargedTo are optional in request (derived from user data)
 */
export const receiptCreateRequestSchema = receiptSchema
  .omit({
    receiptID: true,
    createdAt: true,
    accountBilled: true,
    chargedTo: true
  })
  .extend({
    // Make invoiceID optional for standalone receipts
    invoiceID: z
      .string()
      .regex(
        /^INV\d{9}$/,
        'Invoice ID must match format INV followed by 9 digits (e.g., INV000000001)'
      )
      .optional(),
    // Allow simplified item structure for standalone receipts
    invoiceItems: z
      .array(invoiceItemSchema)
      .min(1, 'Receipt must contain at least one item')
      .optional()
  });

/**
 * Type export for request DTO
 */
export type ReceiptCreateRequest = z.infer<typeof receiptCreateRequestSchema>;

// Re-export item schema for convenience
export { invoiceItemSchema };

// Made with Bob
