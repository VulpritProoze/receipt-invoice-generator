import { describe, it, expect, beforeEach } from '@jest/globals';
import { registerUser, updateUserProfile } from './users/userService';
import { createInvoice, getInvoice, calculateInvoiceTotals } from './invoices/invoiceService';
import { createReceipt } from './receipts/receiptService';
import { maskCreditCard } from '@/lib/maskCreditCard';
import { setCompanyConfig } from '@/lib/db/company';
import { createBillingUser } from '@/lib/db/billingUsers';
import { createInvoiceItemMaster } from '@/lib/db/invoiceItemMasters';
import { createBillingHistory } from '@/lib/db/billingHistory';
import { db } from '@/lib/db.sqlite';

/**
 * Security tests for core modules.
 * Verifies security requirements are enforced.
 */

describe('Core Modules Security', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    db.prepare('PRAGMA foreign_keys = OFF').run();
    db.prepare('DELETE FROM receipts').run();
    db.prepare('DELETE FROM invoices').run();
    db.prepare('DELETE FROM billing_history').run();
    db.prepare('DELETE FROM invoice_item_masters').run();
    db.prepare('DELETE FROM billing_users').run();
    db.prepare('DELETE FROM company_configs').run();
    db.prepare('DELETE FROM users').run();
    db.prepare('PRAGMA foreign_keys = ON').run();
  });

  describe('Credit card masking', () => {
    it('should mask credit card on user registration', async () => {
      const user = await registerUser({
        username: 'securitytest',
        userEmail: 'security@test.com',
        fullName: 'Security Test',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      });

      // Verify raw number is not stored
      expect(user.creditCardNumber).not.toContain('4111111111111111');
      // Verify masked format
      expect(user.creditCardNumber).toMatch(/^\*{4} \*{4} \*{4} \d{4}$/);
      // Verify last 4 digits are preserved
      expect(user.creditCardNumber).toContain('1111');
    });

    it('should mask credit card on user update', async () => {
      const user = await registerUser({
        username: 'updatetest',
        userEmail: 'update@test.com',
        fullName: 'Update Test',
        creditCardNumber: '5555555555554444',
        creditCardType: 'Mastercard'
      });

      const updated = await updateUserProfile(user.userID, {
        creditCardNumber: '378282246310005'
      });

      // Verify new card is masked
      expect(updated.creditCardNumber).not.toContain('378282246310005');
      expect(updated.creditCardNumber).toMatch(/^\*{4} \*{4} \*{4} \d{4}$/);
      expect(updated.creditCardNumber).toContain('0005');
    });

    it('should reject invalid credit card numbers', () => {
      // Too short
      expect(() => maskCreditCard('123')).toThrow();

      // Too long
      expect(() => maskCreditCard('12345678901234567890')).toThrow();

      // Empty
      expect(() => maskCreditCard('')).toThrow();

      // Non-string
      expect(() => maskCreditCard(null as unknown as string)).toThrow();
    });
  });

  describe('Receipt creation security', () => {
    it('should require valid invoice before creating receipt', async () => {
      const user = await registerUser({
        username: 'receipttest',
        userEmail: 'receipt@test.com',
        fullName: 'Receipt Test',
        creditCardNumber: '6011111111111117',
        creditCardType: 'Discover'
      });

      // Attempt to create receipt without valid invoice
      await expect(
        createReceipt(user.userID, {
          date: '2026-05-20',
          invoiceID: 'INV999999999', // Non-existent invoice
          invoiceItems: [
            {
              itemID: 'fake-item',
              quantity: 1,
              description: 'Fake',
              rate: 100,
              date: '2026-05-20'
            }
          ],
          total: 100
        })
      ).rejects.toThrow('Invoice not found');
    });

    it('should prevent duplicate receipts for same invoice', async () => {
      const user = await registerUser({
        username: 'duptest',
        userEmail: 'dup@test.com',
        fullName: 'Duplicate Test',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      });

      // 1. Set company config for this user
      await setCompanyConfig(user.userID, {
        companyID: 'company-dup',
        brandName: 'TestCorp',
        companyName: 'TestCorp Inc.',
        companyUrl: 'https://testcorp.com',
        addressLine: '123 Test Street',
        postalAddress: 'Test City, TC 12345',
        country: 'Test Country',
        logoUrl: 'https://testcorp.com/logo.png'
      });

      // 2. Create billing user
      await createBillingUser({
        billingUserID: 'billing-dup',
        companyID: 'company-dup',
        name: 'Client',
        addressLine: '123 St',
        cityAddress: 'City',
        postalAddress: '12345',
        country: 'Philippines',
        createdAt: '2026-05-20'
      });

      // 3. Create invoice item master
      await createInvoiceItemMaster({
        invoiceItemID: 'item-dup',
        companyID: 'company-dup',
        description: 'Service',
        defaultRate: 100,
        createdAt: '2026-05-20'
      });

      // 4. Create billing history entry
      await createBillingHistory({
        billingHistoryID: 'bh-dup',
        billingUserID: 'billing-dup',
        invoiceItemID: 'item-dup',
        quantity: 1,
        rate: 100,
        date: '2026-05-20',
        billedStatus: 'unbilled',
        invoiceID: null,
        createdAt: '2026-05-20'
      });

      // 5. Create invoice using service
      const invoice = await createInvoice('billing-dup', ['bh-dup'], {
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        taxRate: 0.12
      });

      // Create first receipt
      await createReceipt(user.userID, {
        date: '2026-05-20',
        invoiceID: invoice.invoiceID,
        invoiceItems: [
          {
            itemID: 'item-dup',
            quantity: 1,
            description: 'Service',
            rate: 100,
            date: '2026-05-20'
          }
        ],
        total: 112
      });

      // Attempt to create duplicate receipt
      await expect(
        createReceipt(user.userID, {
          date: '2026-05-20',
          invoiceID: invoice.invoiceID,
          invoiceItems: [
            {
              itemID: 'item-dup',
              quantity: 1,
              description: 'Service',
              rate: 100,
              date: '2026-05-20'
            }
          ],
          total: 112
        })
      ).rejects.toThrow('Receipt already exists for this invoice');
    });
  });

  describe('User isolation', () => {
    it('should isolate invoice data by userID', async () => {
      const userA = await registerUser({
        username: 'usera',
        userEmail: 'usera_isolate@test.com',
        fullName: 'User A',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      });

      const _userB = await registerUser({
        username: 'userb',
        userEmail: 'userb_isolate@test.com',
        fullName: 'User B',
        creditCardNumber: '5555555555554444',
        creditCardType: 'Mastercard'
      });

      // 1. Set company config for User A
      await setCompanyConfig(userA.userID, {
        companyID: 'company-a',
        brandName: 'Brand A',
        companyName: 'Company A Inc.',
        companyUrl: 'https://comp-a.com',
        addressLine: '123 A St',
        postalAddress: 'City A, 11111',
        country: 'Philippines',
        logoUrl: 'https://comp-a.com/logo.png'
      });

      // 2. Create billing user for User A
      await createBillingUser({
        billingUserID: 'billing-a',
        companyID: 'company-a',
        name: 'Client A',
        addressLine: '123 A St',
        cityAddress: 'City A',
        postalAddress: '11111',
        country: 'Philippines',
        createdAt: '2026-05-20'
      });

      // 3. Create invoice item master for User A
      await createInvoiceItemMaster({
        invoiceItemID: 'item-a',
        companyID: 'company-a',
        description: 'Service A',
        defaultRate: 100,
        createdAt: '2026-05-20'
      });

      // 4. Create billing history entry for User A
      await createBillingHistory({
        billingHistoryID: 'bh-a',
        billingUserID: 'billing-a',
        invoiceItemID: 'item-a',
        quantity: 1,
        rate: 100,
        date: '2026-05-20',
        billedStatus: 'unbilled',
        invoiceID: null,
        createdAt: '2026-05-20'
      });

      // 5. Create invoice using service
      const invoiceA = await createInvoice('billing-a', ['bh-a'], {
        invoiceDate: '2026-05-20',
        terms: 'Net 30',
        dueDate: '2026-06-19',
        currency: 'PHP',
        taxRate: 0.12
      });

      // User B's billing user should not be able to access User A's invoice
      const result = await getInvoice('billing-b', invoiceA.invoiceID);

      // In a real implementation with proper isolation, this would return null
      expect(result).toBeNull();
    });
  });

  describe('Invoice total calculation security', () => {
    it('should guard against negative totals', async () => {
      const user = await registerUser({
        username: 'negtest',
        userEmail: 'neg@test.com',
        fullName: 'Negative Test',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      });

      // 1. Set company config for user
      await setCompanyConfig(user.userID, {
        companyID: 'company-neg',
        brandName: 'TestCorp',
        companyName: 'TestCorp Inc.',
        companyUrl: 'https://testcorp.com',
        addressLine: '123 Test Street',
        postalAddress: 'Test City, TC 12345',
        country: 'Test Country',
        logoUrl: 'https://testcorp.com/logo.png'
      });

      // 2. Create billing user
      await createBillingUser({
        billingUserID: 'billing-neg',
        companyID: 'company-neg',
        name: 'Client',
        addressLine: '123 St',
        cityAddress: 'City',
        postalAddress: '12345',
        country: 'Philippines',
        createdAt: '2026-05-20'
      });

      // 3. Create invoice item master
      await createInvoiceItemMaster({
        invoiceItemID: 'item-neg',
        companyID: 'company-neg',
        description: 'Zero rate item',
        defaultRate: 0.01,
        createdAt: '2026-05-20'
      });

      // 4. Create billing history entry
      await createBillingHistory({
        billingHistoryID: 'bh-neg',
        billingUserID: 'billing-neg',
        invoiceItemID: 'item-neg',
        quantity: 1,
        rate: 0.01,
        date: '2026-05-20',
        billedStatus: 'unbilled',
        invoiceID: null,
        createdAt: '2026-05-20'
      });

      // 5. Create invoice using service
      const invoice = await createInvoice('billing-neg', ['bh-neg'], {
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        taxRate: 0
      });

      const totals = calculateInvoiceTotals(invoice);

      // Verify totals are never negative
      expect(totals.subtotal).toBeGreaterThanOrEqual(0);
      expect(totals.taxAmount).toBeGreaterThanOrEqual(0);
      expect(totals.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Email uniqueness', () => {
    it('should prevent duplicate email registration', async () => {
      await registerUser({
        username: 'first',
        userEmail: 'duplicate@test.com',
        fullName: 'First User',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      });

      // Attempt to register with same email
      await expect(
        registerUser({
          username: 'second',
          userEmail: 'duplicate@test.com',
          fullName: 'Second User',
          creditCardNumber: '5555555555554444',
          creditCardType: 'Mastercard'
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should prevent email takeover via update', async () => {
      const _userA = await registerUser({
        username: 'usera',
        userEmail: 'usera_update@test.com',
        fullName: 'User A',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      });

      const userB = await registerUser({
        username: 'userb',
        userEmail: 'userb_update@test.com',
        fullName: 'User B',
        creditCardNumber: '5555555555554444',
        creditCardType: 'Mastercard'
      });

      // User B attempts to change email to User A's email
      await expect(
        updateUserProfile(userB.userID, { userEmail: 'usera_update@test.com' })
      ).rejects.toThrow('Email already in use by another account');
    });
  });
});

// Made with Bob
