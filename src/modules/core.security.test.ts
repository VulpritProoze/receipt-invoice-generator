import { describe, it, expect, beforeEach } from '@jest/globals';
import { registerUser, updateUserProfile } from './users/userService';
import { createInvoice, getInvoice } from './invoices/invoiceService';
import { createReceipt } from './receipts/receiptService';
import { maskCreditCard } from '@/lib/maskCreditCard';

/**
 * Security tests for core modules.
 * Verifies security requirements are enforced.
 */

describe('Core Modules Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      const invoice = await createInvoice(user.userID, {
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        billTo: 'Client',
        billToAddressLine: '123 St',
        billToCityAddress: 'City',
        billToPostalAddress: '12345',
        billToCountry: 'Philippines',
        invoiceItems: [
          {
            itemID: 'item-1',
            quantity: 1,
            description: 'Service',
            rate: 100,
            date: '2026-05-20'
          }
        ],
        taxRate: 0.12
      });

      // Create first receipt
      await createReceipt(user.userID, {
        date: '2026-05-20',
        invoiceID: invoice.invoiceID,
        invoiceItems: invoice.invoiceItems,
        total: 112
      });

      // Attempt to create duplicate receipt
      await expect(
        createReceipt(user.userID, {
          date: '2026-05-20',
          invoiceID: invoice.invoiceID,
          invoiceItems: invoice.invoiceItems,
          total: 112
        })
      ).rejects.toThrow('Receipt already exists for this invoice');
    });
  });

  describe('User isolation', () => {
    it('should isolate invoice data by userID', async () => {
      const userA = await registerUser({
        username: 'usera',
        userEmail: 'usera@test.com',
        fullName: 'User A',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      });

      const userB = await registerUser({
        username: 'userb',
        userEmail: 'userb@test.com',
        fullName: 'User B',
        creditCardNumber: '5555555555554444',
        creditCardType: 'Mastercard'
      });

      // Create invoice for User A
      const invoiceA = await createInvoice(userA.userID, {
        invoiceDate: '2026-05-20',
        terms: 'Net 30',
        dueDate: '2026-06-19',
        currency: 'PHP',
        billTo: 'Client A',
        billToAddressLine: '123 A St',
        billToCityAddress: 'City A',
        billToPostalAddress: '11111',
        billToCountry: 'Philippines',
        invoiceItems: [
          {
            itemID: 'item-a',
            quantity: 1,
            description: 'Service A',
            rate: 100,
            date: '2026-05-20'
          }
        ],
        taxRate: 0.12
      });

      // User B should not be able to access User A's invoice
      const result = await getInvoice(userB.userID, invoiceA.invoiceID);

      // In a real implementation with proper isolation, this would return null
      // The database layer enforces this via key structure: invoice:[userID]:[invoiceID]
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

      // Create invoice with zero items (edge case)
      const invoice = await createInvoice(user.userID, {
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        billTo: 'Client',
        billToAddressLine: '123 St',
        billToCityAddress: 'City',
        billToPostalAddress: '12345',
        billToCountry: 'Philippines',
        invoiceItems: [
          {
            itemID: 'zero-item',
            quantity: 1,
            description: 'Zero rate item',
            rate: 0.01, // Minimum rate per schema
            date: '2026-05-20'
          }
        ],
        taxRate: 0
      });

      const { calculateInvoiceTotals } =
        await import('./invoices/invoiceService');
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
        userEmail: 'usera@test.com',
        fullName: 'User A',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      });

      const userB = await registerUser({
        username: 'userb',
        userEmail: 'userb@test.com',
        fullName: 'User B',
        creditCardNumber: '5555555555554444',
        creditCardType: 'Mastercard'
      });

      // User B attempts to change email to User A's email
      await expect(
        updateUserProfile(userB.userID, { userEmail: 'usera@test.com' })
      ).rejects.toThrow('Email already in use by another account');
    });
  });
});

// Made with Bob
