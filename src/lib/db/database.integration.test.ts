

import { mockRedis } from '@/lib/__mocks__/redis';
import { createUser, getUser } from './users';
import {
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  listInvoices,
  getNextInvoiceSequence
} from './invoices';
import {
  createReceipt,
  getReceipt,
  getReceiptByInvoiceID,
  deleteReceipt
} from './receipts';
import { setCompanyConfig, getCompanyConfig } from './company';
import { User } from '@/models/user';
import { Invoice, InvoiceItem } from '@/models/invoice';
import { Receipt } from '@/models/receipt';
import { CompanyConfig } from '@/models/company';

describe('database integration tests', () => {
  beforeEach(() => {
    // Clear mock Redis store before each test
    mockRedis.clear();
  });

  const userID = '550e8400-e29b-41d4-a716-446655440000';

  const validUser: User = {
    userID,
    username: 'testuser',
    userEmail: 'test@example.com',
    fullName: 'Test User',
    creditCardNumber: '**** **** **** 1234',
    creditCardType: 'Visa'
  };

  const validCompanyConfig: CompanyConfig = {
    brandName: 'Test Brand',
    companyName: 'Test Company Inc.',
    companyUrl: 'https://example.com',
    addressLine: '123 Test Street',
    postalAddress: 'Test City, 12345',
    country: 'Philippines',
    logoUrl: 'https://example.com/logo.png'
  };

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

  const validReceipt: Receipt = {
    receiptID: 'CH_A3K9MXQP2T7VWRJNZ',
    date: '2026-05-20',
    accountBilled: 'testuser (test@example.com)',
    invoiceID: 'INV000000001',
    invoiceItems: [validInvoiceItem],
    total: 224.0,
    chargedTo: 'Visa **** **** **** 1234',
    userID,
    createdAt: '2026-05-20'
  };

  describe('complete user onboarding workflow', () => {
    it('should create user and company config in sequence', async () => {
      // Step 1: Create user
      await createUser(validUser);
      const user = await getUser(userID);
      expect(user).toEqual(validUser);

      // Step 2: Set company config (onboarding)
      await setCompanyConfig(userID, validCompanyConfig);
      const config = await getCompanyConfig(userID);
      expect(config).toEqual(validCompanyConfig);

      // Verify both exist
      expect(user).not.toBeNull();
      expect(config).not.toBeNull();
    });
  });

  describe('invoice creation workflow', () => {
    beforeEach(async () => {
      await createUser(validUser);
      await setCompanyConfig(userID, validCompanyConfig);
    });

    it('should create invoice with sequential ID generation', async () => {
      const seq1 = await getNextInvoiceSequence(userID);
      const invoice1: Invoice = {
        ...validInvoice,
        invoiceID: `INV${String(seq1).padStart(9, '0')}`
      };

      await createInvoice(userID, invoice1);

      const seq2 = await getNextInvoiceSequence(userID);
      const invoice2: Invoice = {
        ...validInvoice,
        invoiceID: `INV${String(seq2).padStart(9, '0')}`,
        createdAt: '2026-05-21'
      };

      await createInvoice(userID, invoice2);

      // Verify both invoices exist
      const retrieved1 = await getInvoice(userID, invoice1.invoiceID);
      const retrieved2 = await getInvoice(userID, invoice2.invoiceID);

      expect(retrieved1).toEqual(invoice1);
      expect(retrieved2).toEqual(invoice2);

      // Verify list returns both
      const invoices = await listInvoices(userID);
      expect(invoices).toHaveLength(2);
    });
  });

  describe('invoice to receipt workflow', () => {
    beforeEach(async () => {
      await createUser(validUser);
      await setCompanyConfig(userID, validCompanyConfig);
      await createInvoice(userID, validInvoice);
    });

    it('should create receipt referencing existing invoice', async () => {
      // Verify invoice exists
      const invoice = await getInvoice(userID, validInvoice.invoiceID);
      expect(invoice).not.toBeNull();

      // Create receipt for invoice
      await createReceipt(userID, validReceipt);

      // Verify receipt exists
      const receipt = await getReceipt(userID, validReceipt.receiptID);
      expect(receipt).toEqual(validReceipt);

      // Verify receipt can be found by invoiceID
      const receiptByInvoice = await getReceiptByInvoiceID(
        userID,
        validInvoice.invoiceID
      );
      expect(receiptByInvoice).toEqual(validReceipt);
    });

    it('should allow receipt creation even if invoice does not exist', async () => {
      // Business decision: receipt stores snapshot of invoice data
      const receiptForNonExistentInvoice: Receipt = {
        ...validReceipt,
        invoiceID: 'INV999999999'
      };

      await createReceipt(userID, receiptForNonExistentInvoice);

      const receipt = await getReceipt(
        userID,
        receiptForNonExistentInvoice.receiptID
      );
      expect(receipt).not.toBeNull();
    });
  });

  describe('data isolation between users', () => {
    const user2ID = '550e8400-e29b-41d4-a716-446655440001';

    const user2: User = {
      ...validUser,
      userID: user2ID,
      username: 'user2',
      userEmail: 'user2@example.com'
    };

    const user2Invoice: Invoice = {
      ...validInvoice,
      userID: user2ID
    };

    beforeEach(async () => {
      await createUser(validUser);
      await createUser(user2);
      await createInvoice(userID, validInvoice);
      await createInvoice(user2ID, user2Invoice);
    });

    it('should not return user1 invoices when listing user2 invoices', async () => {
      const user1Invoices = await listInvoices(userID);
      const user2Invoices = await listInvoices(user2ID);

      expect(user1Invoices).toHaveLength(1);
      expect(user2Invoices).toHaveLength(1);

      expect(user1Invoices[0].invoiceID).toBe(validInvoice.invoiceID);
      expect(user2Invoices[0].invoiceID).toBe(user2Invoice.invoiceID);
    });

    it('should not allow user1 to access user2 invoice', async () => {
      const invoice = await getInvoice(userID, user2Invoice.invoiceID);
      expect(invoice).toBeNull();
    });

    it('should maintain separate invoice sequences per user', async () => {
      const seq1User1 = await getNextInvoiceSequence(userID);
      const seq1User2 = await getNextInvoiceSequence(user2ID);

      expect(seq1User1).toBe(1);
      expect(seq1User2).toBe(1);

      const seq2User1 = await getNextInvoiceSequence(userID);
      expect(seq2User1).toBe(2);

      const seq2User2 = await getNextInvoiceSequence(user2ID);
      expect(seq2User2).toBe(2);
    });
  });

  describe('complete CRUD lifecycle', () => {
    beforeEach(async () => {
      await createUser(validUser);
      await setCompanyConfig(userID, validCompanyConfig);
    });

    it('should handle create → read → update → delete for invoice', async () => {
      // Create
      await createInvoice(userID, validInvoice);

      // Read
      let invoice = await getInvoice(userID, validInvoice.invoiceID);
      expect(invoice?.terms).toBe('Due Upon Receipt');

      // Update
      await updateInvoice(userID, validInvoice.invoiceID, {
        terms: 'Net 30'
      });

      invoice = await getInvoice(userID, validInvoice.invoiceID);
      expect(invoice?.terms).toBe('Net 30');

      // Delete
      await deleteInvoice(userID, validInvoice.invoiceID);

      invoice = await getInvoice(userID, validInvoice.invoiceID);
      expect(invoice).toBeNull();
    });
  });

  describe('cross-entity consistency', () => {
    beforeEach(async () => {
      await createUser(validUser);
      await setCompanyConfig(userID, validCompanyConfig);
      await createInvoice(userID, validInvoice);
      await createReceipt(userID, validReceipt);
    });

    it('should maintain receipt when invoice is deleted', async () => {
      // Business decision: receipts are financial records and persist independently
      await deleteInvoice(userID, validInvoice.invoiceID);

      const invoice = await getInvoice(userID, validInvoice.invoiceID);
      expect(invoice).toBeNull();

      const receipt = await getReceipt(userID, validReceipt.receiptID);
      expect(receipt).not.toBeNull();
    });

    it('should maintain invoice when receipt is deleted', async () => {
      await deleteReceipt(userID, validReceipt.receiptID);

      const receipt = await getReceipt(userID, validReceipt.receiptID);
      expect(receipt).toBeNull();

      const invoice = await getInvoice(userID, validInvoice.invoiceID);
      expect(invoice).not.toBeNull();
    });
  });
});

// Made with Bob
