import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_URL ?? path.join(process.cwd(), '.dev', 'billgen.db');

export const db = new Database(dbPath);

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      user_email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      credit_card_number TEXT NOT NULL,
      credit_card_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS company_configs (
      user_id TEXT PRIMARY KEY,
      brand_name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      company_url TEXT NOT NULL,
      address_line TEXT NOT NULL,
      postal_address TEXT NOT NULL,
      country TEXT NOT NULL,
      logo_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_sequences (
      user_id TEXT PRIMARY KEY,
      next_value INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS invoices (
      invoice_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      terms TEXT NOT NULL,
      due_date TEXT NOT NULL,
      currency TEXT NOT NULL,
      bill_to TEXT NOT NULL,
      bill_to_address_line TEXT NOT NULL,
      bill_to_city_address TEXT NOT NULL,
      bill_to_postal_address TEXT NOT NULL,
      bill_to_country TEXT NOT NULL,
      invoice_items TEXT NOT NULL,
      tax_rate REAL NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (invoice_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      item_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      description TEXT NOT NULL,
      rate REAL NOT NULL,
      date TEXT NOT NULL,
      PRIMARY KEY (item_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS receipts (
      receipt_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      account_billed TEXT NOT NULL,
      invoice_id TEXT NOT NULL,
      invoice_items TEXT NOT NULL,
      total REAL NOT NULL,
      charged_to TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (receipt_id, user_id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_invoice
      ON receipts (user_id, invoice_id);
  `);
}

initializeDatabase();
