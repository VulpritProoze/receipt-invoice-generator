

import { mockRedis } from '@/lib/__mocks__/redis';
import { createUser, getUser, getUserByEmail } from './users';
import { createInvoice, getInvoice, listInvoices } from './invoices';
import {
  createReceipt,
  getReceipt,
  getReceiptByInvoiceID,
  listReceipts
} from './receipts';
import { setCompanyConfig, getCompanyConfig } from './company';
import { User } from '@/models/user';
import { Invoice, InvoiceItem } from '@/models/invoice';
import { Receipt } from '@/models/receipt';
import { CompanyConfig } from '@/models/company';

describe('database security tests', () => {
  beforeEach(() => {
    // Clear mock Redis store before each test
    mockRedis.clear();
  });

  const user1ID = '550e8400-e29b-41d4-a716-446655440001';
  const user2ID = '550e8400-e29b-41d4-a716-446655440002';

  const user1: User = {
    userID: user1ID,
    username: 'user1',
    userEmail: 'user1@example.com',
    fullName: 'User One',
    creditCardNumber: '**** **** **** 1111',
    creditCardType: 'Visa'
  };

  const user2: User = {
    userID: user2ID,
    username: 'user2',
    userEmail: 'user2@example.com',
    fullName: 'User Two',
    creditCardNumber: '**** **** **** 2222',
    creditCardType: 'Mastercard'
  };

  const validInvoiceItem: InvoiceItem = {
    itemID: 'item-001',
    quantity: 2,
    description: 'Test Item',
    rate: 100.0,
    date: '2026-05-20'
  };

  const user1Invoice: Invoice = {
    invoiceID: 'INV000000001',
    invoiceDate: '2026-05-20',
    terms: 'Due Upon Receipt',
    dueDate: '2026-06-20',
    currency: 'PHP',
    billTo: 'Client 1',
    billToAddressLine: '123 Test St',
    billToCityAddress: 'Test City',
    billToPostalAddress: '12345',
    billToCountry: 'Philippines',
    invoiceItems: [validInvoiceItem],
    taxRate: 0.12,
    userID: user1ID,
    createdAt: '2026-05-20'
  };

  const user2Invoice: Invoice = {
    ...user1Invoice,
    invoiceID: 'INV000000002',
    userID: user2ID,
    billTo: 'Client 2'
  };

  const user1Receipt: Receipt = {
    receiptID: 'CH_A3K9MXQP2T7VWRJNA',
    date: '2026-05-20',
    accountBilled: 'user1 (user1@example.com)',
    invoiceID: 'INV000000001',
    invoiceItems: [validInvoiceItem],
    total: 224.0,
    chargedTo: 'Visa **** **** **** 1111',
    userID: user1ID,
    createdAt: '2026-05-20'
  };

  const user2Receipt: Receipt = {
    receiptID: 'CH_B3K9MXQP2T7VWRJNB',
    date: '2026-05-20',
    accountBilled: 'user2 (user2@example.com)',
    invoiceID: 'INV000000002',
    invoiceItems: [validInvoiceItem],
    total: 224.0,
    chargedTo: 'Mastercard **** **** **** 2222',
    userID: user2ID,
    createdAt: '2026-05-20'
  };

  const user1CompanyConfig: CompanyConfig = {
    brandName: 'User 1 Brand',
    companyName: 'User 1 Company Inc.',
    companyUrl: 'https://user1.com',
    addressLine: '123 User 1 Street',
    postalAddress: 'User 1 City, 12345',
    country: 'Philippines',
    logoUrl: 'https://user1.com/logo.png'
  };

  const user2CompanyConfig: CompanyConfig = {
    ...user1CompanyConfig,
    brandName: 'User 2 Brand',
    companyName: 'User 2 Company Inc.',
    companyUrl: 'https://user2.com',
    logoUrl: 'https://user2.com/logo.png'
  };

  describe('user data isolation', () => {
    beforeEach(async () => {
      await createUser(user1);
      await createUser(user2);
    });

    it('should not allow access to another user by userID', async () => {
      const user = await getUser(user2ID);
      expect(user?.userID).toBe(user2ID);
      expect(user?.userEmail).toBe('user2@example.com');
      expect(user?.userEmail).not.toBe(user1.userEmail);
    });

    it('should not return user1 when searching for user2 email', async () => {
      const foundUser1 = await getUserByEmail(user1.userEmail);
      const foundUser2 = await getUserByEmail(user2.userEmail);

      expect(foundUser1?.userID).toBe(user1ID);
      expect(foundUser2?.userID).toBe(user2ID);
      expect(foundUser1?.userID).not.toBe(foundUser2?.userID);
    });
  });

  describe('invoice data isolation', () => {
    beforeEach(async () => {
      await createUser(user1);
      await createUser(user2);
      await createInvoice(user1ID, user1Invoice);
      await createInvoice(user2ID, user2Invoice);
    });

    it('should not allow user1 to access user2 invoice', async () => {
      const invoice = await getInvoice(user1ID, user2Invoice.invoiceID);
      expect(invoice).toBeNull();
    });

    it('should not allow user2 to access user1 invoice', async () => {
      const invoice = await getInvoice(user2ID, user1Invoice.invoiceID);
      expect(invoice).toBeNull();
    });

    it('should only return user1 invoices when listing for user1', async () => {
      const invoices = await listInvoices(user1ID);

      expect(invoices).toHaveLength(1);
      expect(invoices[0].invoiceID).toBe(user1Invoice.invoiceID);
      expect(invoices[0].userID).toBe(user1ID);
    });

    it('should only return user2 invoices when listing for user2', async () => {
      const invoices = await listInvoices(user2ID);

      expect(invoices).toHaveLength(1);
      expect(invoices[0].invoiceID).toBe(user2Invoice.invoiceID);
      expect(invoices[0].userID).toBe(user2ID);
    });

    it('should reject invoice creation with mismatched userID', async () => {
      const mismatchedInvoice: Invoice = {
        ...user1Invoice,
        invoiceID: 'INV000000003',
        userID: user2ID // Mismatch: trying to create user2 invoice under user1
      };

      await expect(createInvoice(user1ID, mismatchedInvoice)).rejects.toThrow(
        'Invoice userID does not match provided userID'
      );
    });
  });

  describe('receipt data isolation', () => {
    beforeEach(async () => {
      await createUser(user1);
      await createUser(user2);
      await createInvoice(user1ID, user1Invoice);
      await createInvoice(user2ID, user2Invoice);
      await createReceipt(user1ID, user1Receipt);
      await createReceipt(user2ID, user2Receipt);
    });

    it('should not allow user1 to access user2 receipt', async () => {
      const receipt = await getReceipt(user1ID, user2Receipt.receiptID);
      expect(receipt).toBeNull();
    });

    it('should not allow user2 to access user1 receipt', async () => {
      const receipt = await getReceipt(user2ID, user1Receipt.receiptID);
      expect(receipt).toBeNull();
    });

    it('should not allow user1 to find user2 receipt by invoiceID', async () => {
      const receipt = await getReceiptByInvoiceID(
        user1ID,
        user2Invoice.invoiceID
      );
      expect(receipt).toBeNull();
    });

    it('should only return user1 receipts when listing for user1', async () => {
      const receipts = await listReceipts(user1ID);

      expect(receipts).toHaveLength(1);
      expect(receipts[0].receiptID).toBe(user1Receipt.receiptID);
      expect(receipts[0].userID).toBe(user1ID);
    });

    it('should only return user2 receipts when listing for user2', async () => {
      const receipts = await listReceipts(user2ID);

      expect(receipts).toHaveLength(1);
      expect(receipts[0].receiptID).toBe(user2Receipt.receiptID);
      expect(receipts[0].userID).toBe(user2ID);
    });

    it('should reject receipt creation with mismatched userID', async () => {
      const mismatchedReceipt: Receipt = {
        ...user1Receipt,
        receiptID: 'CH_C5M1OYSR4V9YXTLQ',
        userID: user2ID // Mismatch
      };

      await expect(createReceipt(user1ID, mismatchedReceipt)).rejects.toThrow(
        'Receipt userID does not match provided userID'
      );
    });
  });

  describe('company config isolation', () => {
    beforeEach(async () => {
      await createUser(user1);
      await createUser(user2);
      await setCompanyConfig(user1ID, user1CompanyConfig);
      await setCompanyConfig(user2ID, user2CompanyConfig);
    });

    it('should not return user1 config when requesting user2 config', async () => {
      const config1 = await getCompanyConfig(user1ID);
      const config2 = await getCompanyConfig(user2ID);

      expect(config1?.brandName).toBe('User 1 Brand');
      expect(config2?.brandName).toBe('User 2 Brand');
      expect(config1?.brandName).not.toBe(config2?.brandName);
    });

    it('should maintain separate configs per user', async () => {
      const config1 = await getCompanyConfig(user1ID);
      const config2 = await getCompanyConfig(user2ID);

      expect(config1).not.toEqual(config2);
      expect(config1?.companyUrl).toBe('https://user1.com');
      expect(config2?.companyUrl).toBe('https://user2.com');
    });
  });

  describe('key injection attack prevention', () => {
    it('should safely handle userID with colon characters by rejecting them', async () => {
      const maliciousUserID = 'user:malicious:attempt';

      const maliciousUser: User = {
        ...user1,
        userID: maliciousUserID
      };

      await expect(createUser(maliciousUser)).rejects.toThrow();

      // Should not interfere with other users
      await createUser(user1);
      const user1Retrieved = await getUser(user1ID);
      expect(user1Retrieved?.userID).toBe(user1ID);
    });

    it('should safely handle invoiceID with special characters', async () => {
      await createUser(user1);

      const maliciousInvoice: Invoice = {
        ...user1Invoice,
        invoiceID: 'INV000000001' // Valid format
      };

      await createInvoice(user1ID, maliciousInvoice);

      // Attempt to access with pattern injection
      const retrieved = await getInvoice(user1ID, 'INV*');
      expect(retrieved).toBeNull(); // Should not match pattern
    });
  });

  describe('empty or invalid userID handling', () => {
    it('should handle empty userID gracefully', async () => {
      const user = await getUser('');
      expect(user).toBeNull();
    });

    it('should handle null-like userID gracefully', async () => {
      const invoices = await listInvoices('null');
      expect(invoices).toEqual([]);
    });

    it('should handle undefined-like userID gracefully', async () => {
      const receipts = await listReceipts('undefined');
      expect(receipts).toEqual([]);
    });
  });
});

// Made with Bob
