import { db } from '@/lib/db.sqlite';
import { BillingUser, billingUserSchema } from '@/models/billingUser';

/**
 * SQLite database operations for BillingUser entities.
 */

export async function createBillingUser(
  billingUser: BillingUser
): Promise<void> {
  const validated = billingUserSchema.parse(billingUser);

  const stmt = db.prepare(`
    INSERT INTO billing_users (billing_user_id, company_id, name, address_line, city_address, postal_address, country, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    validated.billingUserID,
    validated.companyID,
    validated.name,
    validated.addressLine,
    validated.cityAddress,
    validated.postalAddress,
    validated.country,
    validated.createdAt
  );
}

export async function getBillingUser(
  billingUserID: string
): Promise<BillingUser | null> {
  const stmt = db.prepare(`
    SELECT 
      billing_user_id as billingUserID,
      company_id as companyID,
      name,
      address_line as addressLine,
      city_address as cityAddress,
      postal_address as postalAddress,
      country,
      created_at as createdAt
    FROM billing_users
    WHERE billing_user_id = ?
  `);
  const row = stmt.get(billingUserID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    return billingUserSchema.parse(row);
  } catch (error) {
    throw new Error(
      `Invalid billing user data in database for billingUserID: ${billingUserID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function updateBillingUser(
  billingUserID: string,
  updates: Partial<Omit<BillingUser, 'billingUserID' | 'companyID' | 'createdAt'>>
): Promise<void> {
  const existing = await getBillingUser(billingUserID);

  if (!existing) {
    throw new Error(`Billing user not found for billingUserID: ${billingUserID}`);
  }

  const updated = { ...existing, ...updates };
  const validated = billingUserSchema.parse(updated);

  const stmt = db.prepare(`
    UPDATE billing_users
    SET name = ?, address_line = ?, city_address = ?, postal_address = ?, country = ?
    WHERE billing_user_id = ?
  `);
  stmt.run(
    validated.name,
    validated.addressLine,
    validated.cityAddress,
    validated.postalAddress,
    validated.country,
    billingUserID
  );
}

export async function deleteBillingUser(billingUserID: string): Promise<void> {
  const stmt = db.prepare(`
    DELETE FROM billing_users
    WHERE billing_user_id = ?
  `);
  stmt.run(billingUserID);
}

export async function listBillingUsers(
  companyID: string
): Promise<BillingUser[]> {
  const stmt = db.prepare(`
    SELECT 
      billing_user_id as billingUserID,
      company_id as companyID,
      name,
      address_line as addressLine,
      city_address as cityAddress,
      postal_address as postalAddress,
      country,
      created_at as createdAt
    FROM billing_users
    WHERE company_id = ?
    ORDER BY name ASC
  `);
  const rows = stmt.all(companyID) as Record<string, unknown>[];

  return rows.map((row) => {
    try {
      return billingUserSchema.parse(row);
    } catch (error) {
      throw new Error(
        `Invalid billing user data in database. Data integrity check failed.`,
        { cause: error }
      );
    }
  });
}

// Made with Bob
