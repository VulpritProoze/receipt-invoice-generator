import { z } from 'zod';

export interface CompanyConfig {
  brandName: string;
  companyName: string;
  companyUrl: string;
  addressLine: string;
  postalAddress: string;
  country: string;
  logoUrl: string;
}

export const companyConfigSchema = z.object({
  brandName: z.string().min(1),
  companyName: z.string().min(1),
  companyUrl: z.string().url(),
  addressLine: z.string().min(1),
  postalAddress: z.string().min(1),
  country: z.string().min(1),
  logoUrl: z.string().url()
});

export type CompanyConfigRecord = z.infer<typeof companyConfigSchema>;