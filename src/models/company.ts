import { z } from 'zod';

export const companyConfigSchema = z.object({
  companyID: z
    .string()
    .min(1, 'Company ID is required')
    .max(50, 'Company ID must not exceed 50 characters'),
  brandName: z
    .string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must not exceed 100 characters'),
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must not exceed 200 characters'),
  companyUrl: z.string().url('Must be a valid URL'),
  addressLine: z
    .string()
    .min(1, 'Address line is required')
    .max(200, 'Address line must not exceed 200 characters'),
  postalAddress: z
    .string()
    .min(1, 'Postal address is required')
    .max(100, 'Postal address must not exceed 100 characters'),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country must not exceed 100 characters'),
  logoUrl: z.string().url('Logo URL must be a valid URL')
});

export type CompanyConfig = z.infer<typeof companyConfigSchema>;
