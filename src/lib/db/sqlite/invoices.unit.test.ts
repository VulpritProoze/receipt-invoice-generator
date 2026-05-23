import {
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  listInvoices,
  getNextInvoiceSequence
} from './invoices';
import { Invoice, InvoiceItemWithHistory } from '@/models/invoice';
import { db } from '@/lib/db.sqlite';

describe('SQLite invoices database operations', () => {
  const userID = '550e8400-e29b-41d4-a716-446655440000';

  const validInvoiceItem: InvoiceItemWithHistory = {
    invoiceItemID: 'item-001',
    description: 'Test Item',
    billingHistoryEntries: [
      {
        billingHistoryID: 'bh-001',
        quantity: 2,
        rate: 100.0,
        date: '2026-05-20',
        amount: 200.0
      }
    ]
  };

  const validInvoice: Invoice = {
    invoiceID: 'INV000000001',
    invoiceDate: '2026-05-20',
    terms: 'Due Upon Receipt',
    dueDate: '2026-06-20',
    currency: 'PHP',
    invoiceItems: [validInvoiceItem],
    taxRate: 0.12,
    billingUserID: userID,
    createdAt: '2026-05-20'
  };

  beforeEach(async () => {
    db.prepare('PRAGMA foreign_keys = OFF').run();
    db.prepare('DELETE FROM invoices').run();
    db.prepare('DELETE FROM invoice_sequences').run();
    db.prepare('DELETE FROM billing_history').run();
    db.prepare('DELETE FROM invoice_item_masters').run();
    db.prepare('DELETE FROM billing_users').run();
    db.prepare('DELETE FROM company_configs').run();
    db.prepare('PRAGMA foreign_keys = ON').run();

    // Insert company config
    db.prepare(`
      INSERT INTO company_configs (user_id, company_id, brand_name, company_name, company_url, address_line, postal_address, country, logo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('user-123', 'company-123', 'Test Brand', 'Test Company Inc.', 'https://example.com', '123 Test St', '12345', 'Philippines', 'https://example.com/logo.png');

    // Insert billing user for userID
    db.prepare(`
      INSERT INTO billing_users (billing_user_id, company_id, name, address_line, city_address, postal_address, country, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userID, 'company-123', 'Test Client', '123 Test St', 'Test City', '12345', 'Philippines', '2026-05-20');

    // Insert billing user for user-2-id
    db.prepare(`
      INSERT INTO billing_users (billing_user_id, company_id, name, address_line, city_address, postal_address, country, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('user-2-id', 'company-123', 'Client 2', '123 St', 'City 2', '12345', 'Philippines', '2026-05-20');
  });

  describe('createInvoice', () => {
    it('should create an invoice with valid data', async () => {
      await createInvoice(userID, validInvoice);

      const row = db.prepare('SELECT * FROM invoices WHERE billing_user_id = ? AND invoice_id = ?').get(userID, validInvoice.invoiceID) as { invoice_id: string; tax_rate: number } | undefined;
      expect(row).toBeDefined();
      expect(row?.invoice_id).toBe(validInvoice.invoiceID);
      expect(row?.tax_rate).toBe(validInvoice.taxRate);
    });

    it('should reject invoice with mismatched userID', async () => {
      const mismatchedInvoice = {
        ...validInvoice,
        billingUserID: 'different-user-id'
      };

      await expect(createInvoice(userID, mismatchedInvoice)).rejects.toThrow(
        'Invoice billingUserID does not match provided billingUserID'
      );
    });

    it('should reject invalid invoice data', async () => {
      const invalidInvoice = {
        ...validInvoice,
        invoiceID: 'INVALID'
      };

      await expect(
        createInvoice(userID, invalidInvoice as Invoice)
      ).rejects.toThrow();
    });
  });

  describe('getInvoice', () => {
    beforeEach(async () => {
      await createInvoice(userID, validInvoice);
    });

    it('should retrieve an existing invoice', async () => {
      const retrieved = await getInvoice(userID, validInvoice.invoiceID);
      expect(retrieved).toEqual(validInvoice);
    });

    it('should return null for non-existent invoice', async () => {
      const retrieved = await getInvoice(userID, 'INV999999999');
      expect(retrieved).toBeNull();
    });

    it('should throw error for corrupted invoice data', async () => {
      // Store invalid data directly
      db.prepare(`
        INSERT OR REPLACE INTO invoices (
          invoice_id, billing_user_id, invoice_date, terms, due_date, currency,
          invoice_items, tax_rate, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        validInvoice.invoiceID,
        userID,
        validInvoice.invoiceDate,
        validInvoice.terms,
        validInvoice.dueDate,
        validInvoice.currency,
        'invalid-json', // Corrupted JSON
        validInvoice.taxRate,
        validInvoice.createdAt
      );

      await expect(getInvoice(userID, validInvoice.invoiceID)).rejects.toThrow();
    });
  });

  describe('updateInvoice', () => {
    beforeEach(async () => {
      await createInvoice(userID, validInvoice);
    });

    it('should update invoice fields', async () => {
      await updateInvoice(userID, validInvoice.invoiceID, {
        terms: 'Net 30'
      });

      const updated = await getInvoice(userID, validInvoice.invoiceID);
      expect(updated?.terms).toBe('Net 30');
    });
  });

  describe('deleteInvoice', () => {
    beforeEach(async () => {
      await createInvoice(userID, validInvoice);
    });

    it('should delete an invoice', async () => {
      await deleteInvoice(userID, validInvoice.invoiceID);

      const retrieved = await getInvoice(userID, validInvoice.invoiceID);
      expect(retrieved).toBeNull();
    });
  });

  describe('listInvoices', () => {
    it('should list all invoices for a user sorted by createdAt descending', async () => {
      const invoice2: Invoice = {
        ...validInvoice,
        invoiceID: 'INV000000002',
        createdAt: '2026-05-21'
      };

      await createInvoice(userID, validInvoice);
      await createInvoice(userID, invoice2);

      const invoices = await listInvoices(userID);
      expect(invoices).toHaveLength(2);
      expect(invoices[0].invoiceID).toBe('INV000000002');
      expect(invoices[1].invoiceID).toBe('INV000000001');
    });
  });

  describe('getNextInvoiceSequence', () => {
    it('should increment sequence on each call', async () => {
      const seq1 = await getNextInvoiceSequence(userID);
      const seq2 = await getNextInvoiceSequence(userID);

      expect(seq1).toBe(1);
      expect(seq2).toBe(2);
    });

    it('should maintain separate sequences per user', async () => {
      const user2ID = 'user-2-id';

      const seq1User1 = await getNextInvoiceSequence(userID);
      const seq1User2 = await getNextInvoiceSequence(user2ID);

      expect(seq1User1).toBe(1);
      expect(seq1User2).toBe(1);
    });
  });
});
