import path from 'path';
import fs from 'fs';

/**
 * SQLite database singleton.
 *
 * This module is only safe to load when USE_REDIS is NOT 'true'.
 * The DB adapters in src/lib/db/ use dynamic `await import()` to ensure
 * this module is never evaluated in Redis mode (which would crash on Vercel
 * because the .dev directory does not exist there).
 */

const useRedis = process.env.USE_REDIS === 'true';

// Resolve the DB path only when SQLite is needed
const dbPath = !useRedis
  ? (process.env.DATABASE_URL ?? path.join(process.cwd(), '.dev', 'billgen.db'))
  : null;

// Lazy singleton — never instantiated when USE_REDIS=true
let _db: import('better-sqlite3').Database | null = null;

function openDb(): import('better-sqlite3').Database {
  if (useRedis || !dbPath) {
    throw new Error('SQLite is not available when USE_REDIS=true');
  }
  if (!_db) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    _db = new Database(dbPath) as import('better-sqlite3').Database;
    runMigrations(_db);
  }
  return _db;
}

function runMigrations(database: import('better-sqlite3').Database): void {
  database.exec(`
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

/**
 * The SQLite database instance.
 * Accessed via a Proxy so the real DB is only opened on first use.
 * This means importing this module is always safe — it won't crash
 * until you actually call a method on `db`.
 */
export const db = new Proxy({} as import('better-sqlite3').Database, {
  get(_target, prop) {
    return (openDb() as unknown as Record<string | symbol, unknown>)[prop];
  }
});

/** Exposed for use in tests that need to call initializeDatabase directly. */
export function initializeDatabase(): void {
  runMigrations(openDb());
}
