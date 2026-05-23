import { z } from 'zod';

const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in ISO format YYYY-MM-DD (e.g., 2026-05-20)'
  );

export const billingUserSchema = z.object({
  billingUserID: z
    .string()
    .min(1, 'Billing User ID is required')
    .max(50, 'Billing User ID must not exceed 50 characters'),
  companyID: z
    .string()
    .min(1, 'Company ID is required')
    .max(50, 'Company ID must not exceed 50 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must not exceed 200 characters'),
  addressLine: z
    .string()
    .min(1, 'Address line is required')
    .max(200, 'Address line must not exceed 200 characters'),
  cityAddress: z
    .string()
    .min(1, 'City address is required')
    .max(100, 'City address must not exceed 100 characters'),
  postalAddress: z
    .string()
    .min(1, 'Postal address is required')
    .max(50, 'Postal address must not exceed 50 characters'),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country must not exceed 100 characters'),
  createdAt: isoDateSchema
});

export type BillingUser = z.infer<typeof billingUserSchema>;

// Made with Bob
