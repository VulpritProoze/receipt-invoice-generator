/**
 * Central schema registry for API request/response validation
 * 
 * This module exports all request and response schemas used across the application.
 * Request schemas omit auto-generated fields (IDs, timestamps) that are added server-side.
 * 
 * Usage in API routes:
 * ```typescript
 * import { invoiceCreateRequestSchema } from '@/schemas';
 * 
 * const result = invoiceCreateRequestSchema.safeParse(body);
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Invalid request', details: result.error.flatten() },
 *     { status: 400 }
 *   );
 * }
 * ```
 */

// Invoice schemas
export {
  invoiceCreateRequestSchema,
  invoiceUpdateRequestSchema,
  invoiceItemSchema,
  type InvoiceCreateRequest,
  type InvoiceUpdateRequest
} from './invoice.schema';

// Receipt schemas
export {
  receiptCreateRequestSchema,
  type ReceiptCreateRequest
} from './receipt.schema';

// Re-export full entity schemas from models for response validation
export { invoiceSchema, type Invoice, type InvoiceItem } from '@/models/invoice';
export { receiptSchema, type Receipt } from '@/models/receipt';
export { userSchema, type User } from '@/models/user';
export { companyConfigSchema, type CompanyConfig } from '@/models/company';

// Made with Bob
