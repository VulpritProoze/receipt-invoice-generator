import { db } from '@/lib/db.sqlite';
import { CompanyConfig, companyConfigSchema } from '@/models/company';
import { generateID } from '@/lib/idGenerator';

/**
 * SQLite database operations for CompanyConfig entities.
 */

export async function setCompanyConfig(
  userID: string,
  config: CompanyConfig
): Promise<void> {
  const validated = companyConfigSchema.parse(config);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO company_configs (user_id, company_id, brand_name, company_name, company_url, address_line, postal_address, country, logo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    userID,
    validated.companyID,
    validated.brandName,
    validated.companyName,
    validated.companyUrl,
    validated.addressLine,
    validated.postalAddress,
    validated.country,
    validated.logoUrl
  );
}

export async function getCompanyConfig(
  userID: string
): Promise<CompanyConfig | null> {
  const stmt = db.prepare(`
    SELECT company_id as companyID, brand_name as brandName, company_name as companyName, company_url as companyUrl, address_line as addressLine, postal_address as postalAddress, country, logo_url as logoUrl
    FROM company_configs
    WHERE user_id = ?
  `);
  const row = stmt.get(userID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    return companyConfigSchema.parse(row);
  } catch (error) {
    throw new Error(
      `Invalid company config data in database for userID: ${userID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function updateCompanyConfig(
  userID: string,
  updates: Partial<CompanyConfig>
): Promise<void> {
  const existing = await getCompanyConfig(userID);

  if (!existing) {
    throw new Error(`Company config not found for userID: ${userID}`);
  }

  const updated = { ...existing, ...updates };
  const validated = companyConfigSchema.parse(updated);

  const stmt = db.prepare(`
    UPDATE company_configs
    SET brand_name = ?, company_name = ?, company_url = ?, address_line = ?, postal_address = ?, country = ?, logo_url = ?
    WHERE user_id = ?
  `);
  stmt.run(
    validated.brandName,
    validated.companyName,
    validated.companyUrl,
    validated.addressLine,
    validated.postalAddress,
    validated.country,
    validated.logoUrl,
    userID
  );
}

export async function getCompanyIDForUser(
  userID: string
): Promise<string | null> {
  const stmt = db.prepare(`
    SELECT company_id as companyID
    FROM company_configs
    WHERE user_id = ?
  `);
  const row = stmt.get(userID) as { companyID: string } | undefined;

  return row?.companyID ?? null;
}

export function generateCompanyID(): string {
  return generateID('COMP');
}
