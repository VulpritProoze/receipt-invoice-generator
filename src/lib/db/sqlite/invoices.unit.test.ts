import {
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  listInvoices,
  getNextInvoiceSequence,
  createInvoiceItem,
  getInvoiceItem,
  listInvoiceItems,
  deleteInvoiceItem
} from './invoices';
import { Invoice, InvoiceItem } from '@/models/invoice';
import { db } from '@/lib/db.sqlite';

describe('SQLite invoices database operations', () => {
  const userID = '550e8400-e29b-41d4-a716-446655440000';

  const validInvoiceItem: InvoiceItem = {
    itemID: 'item-001',
    quantity: 2,
    description: 'Test Item',
    rate: 100.0,
    date: '2026-05-20'
  };

  const validInvoice: Invoice = {
    invoiceID: 'INV000000001',
    invoiceDate: '2026-05-20',
    terms: 'Due Upon Receipt',
    dueDate: '2026-06-20',
    currency: 'PHP',
    billTo: 'Test Client',
    billToAddressLine: '123 Test St',
    billToCityAddress: 'Test City',
    billToPostalAddress: '12345',
    billToCountry: 'Philippines',
    invoiceItems: [validInvoiceItem],
    taxRate: 0.12,
    userID,
    createdAt: '2026-05-20'
  };

  describe('createInvoice', () => {
    it('should create an invoice with valid data', async () => {
      await createInvoice(userID, validInvoice);

      const row = db.prepare('SELECT * FROM invoices WHERE user_id = ? AND invoice_id = ?').get(userID, validInvoice.invoiceID) as { invoice_id: string; tax_rate: number } | undefined;
      expect(row).toBeDefined();
      expect(row?.invoice_id).toBe(validInvoice.invoiceID);
      expect(row?.tax_rate).toBe(validInvoice.taxRate);
    });

    it('should reject invoice with mismatched userID', async () => {
      const mismatchedInvoice = {
        ...validInvoice,
        userID: 'different-user-id'
      };

      await expect(createInvoice(userID, mismatchedInvoice)).rejects.toThrow(
        'Invoice userID does not match provided userID'
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
          invoice_id, user_id, invoice_date, terms, due_date, currency,
          bill_to, bill_to_address_line, bill_to_city_address, bill_to_postal_address, bill_to_country,
          invoice_items, tax_rate, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        validInvoice.invoiceID,
        userID,
        validInvoice.invoiceDate,
        validInvoice.terms,
        validInvoice.dueDate,
        validInvoice.currency,
        validInvoice.billTo,
        validInvoice.billToAddressLine,
        validInvoice.billToCityAddress,
        validInvoice.billToPostalAddress,
        validInvoice.billToCountry,
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

  describe('standalone invoice items', () => {
    it('should create, get, list and delete invoice items', async () => {
      await createInvoiceItem(userID, validInvoiceItem);

      const retrieved = await getInvoiceItem(userID, validInvoiceItem.itemID);
      expect(retrieved).toEqual(validInvoiceItem);

      const list = await listInvoiceItems(userID);
      expect(list).toHaveLength(1);

      await deleteInvoiceItem(userID, validInvoiceItem.itemID);
      const retrieved2 = await getInvoiceItem(userID, validInvoiceItem.itemID);
      expect(retrieved2).toBeNull();
    });
  });
});
