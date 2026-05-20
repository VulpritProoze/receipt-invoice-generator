import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  listUserInvoices,
  calculateInvoiceTotals
} from './invoiceService';
import * as dbInvoices from '@/lib/db/invoices';
import * as idGenerator from '@/lib/idGenerator';
import { Invoice, InvoiceItem } from '@/models/invoice';

// Mock database operations
jest.mock('@/lib/db/invoices');
jest.mock('@/lib/idGenerator');

describe('invoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateInvoiceTotals', () => {
    it('should calculate subtotal, tax, and total correctly', () => {
      const invoice: Invoice = {
        invoiceID: 'INV000000001',
        userID: 'user-123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        billTo: 'Test Client',
        billToAddressLine: '123 Test St',
        billToCityAddress: 'Test City',
        billToPostalAddress: '12345',
        billToCountry: 'Philippines',
        invoiceItems: [
          {
            itemID: 'item-1',
            quantity: 2,
            description: 'Service A',
            rate: 100,
            date: '2026-05-20'
          },
          {
            itemID: 'item-2',
            quantity: 3,
            description: 'Service B',
            rate: 50,
            date: '2026-05-20'
          }
        ],
        taxRate: 0.12,
        createdAt: '2026-05-20'
      };

      const result = calculateInvoiceTotals(invoice);

      expect(result.subtotal).toBe(350); // (2*100) + (3*50)
      expect(result.taxAmount).toBe(42); // 350 * 0.12
      expect(result.total).toBe(392); // 350 + 42
    });

    it('should guard against negative totals', () => {
      const invoice: Invoice = {
        invoiceID: 'INV000000001',
        userID: 'user-123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        billTo: 'Test Client',
        billToAddressLine: '123 Test St',
        billToCityAddress: 'Test City',
        billToPostalAddress: '12345',
        billToCountry: 'Philippines',
        invoiceItems: [],
        taxRate: 0.12,
        createdAt: '2026-05-20'
      };

      const result = calculateInvoiceTotals(invoice);

      expect(result.subtotal).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('createInvoice', () => {
    it('should create invoice with generated ID', async () => {
      (dbInvoices.getNextInvoiceSequence as jest.Mock).mockResolvedValue(1);
      (idGenerator.generateInvoiceID as jest.Mock).mockReturnValue('INV000000001');
      (dbInvoices.createInvoice as jest.Mock).mockResolvedValue(undefined);

      const invoiceData = {
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP' as const,
        billTo: 'Test Client',
        billToAddressLine: '123 Test St',
        billToCityAddress: 'Test City',
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
      };

      const result = await createInvoice('user-123', invoiceData);

      expect(result.invoiceID).toBe('INV000000001');
      expect(result.userID).toBe('user-123');
      expect(dbInvoices.getNextInvoiceSequence).toHaveBeenCalledWith('user-123');
      expect(idGenerator.generateInvoiceID).toHaveBeenCalledWith(1);
      expect(dbInvoices.createInvoice).toHaveBeenCalled();
    });
  });

  describe('getInvoice', () => {
    it('should return invoice', async () => {
      const mockInvoice: Invoice = {
        invoiceID: 'INV000000001',
        userID: 'user-123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        billTo: 'Test Client',
        billToAddressLine: '123 Test St',
        billToCityAddress: 'Test City',
        billToPostalAddress: '12345',
        billToCountry: 'Philippines',
        invoiceItems: [],
        taxRate: 0.12,
        createdAt: '2026-05-20'
      };

      (dbInvoices.getInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await getInvoice('user-123', 'INV000000001');

      expect(result).toEqual(mockInvoice);
    });

    it('should return null if not found', async () => {
      (dbInvoices.getInvoice as jest.Mock).mockResolvedValue(null);

      const result = await getInvoice('user-123', 'INV000000001');

      expect(result).toBeNull();
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice and return updated version', async () => {
      const existingInvoice: Invoice = {
        invoiceID: 'INV000000001',
        userID: 'user-123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
        billTo: 'Test Client',
        billToAddressLine: '123 Test St',
        billToCityAddress: 'Test City',
        billToPostalAddress: '12345',
        billToCountry: 'Philippines',
        invoiceItems: [],
        taxRate: 0.12,
        createdAt: '2026-05-20'
      };

      const updatedInvoice = { ...existingInvoice, terms: 'Net 30' };

      (dbInvoices.getInvoice as jest.Mock)
        .mockResolvedValueOnce(existingInvoice)
        .mockResolvedValueOnce(updatedInvoice);
      (dbInvoices.updateInvoice as jest.Mock).mockResolvedValue(undefined);

      const result = await updateInvoice('user-123', 'INV000000001', { terms: 'Net 30' });

      expect(result.terms).toBe('Net 30');
      expect(dbInvoices.updateInvoice).toHaveBeenCalledWith('user-123', 'INV000000001', {
        terms: 'Net 30'
      });
    });

    it('should throw error if invoice not found', async () => {
      (dbInvoices.getInvoice as jest.Mock).mockResolvedValue(null);

      await expect(
        updateInvoice('user-123', 'INV000000001', { terms: 'Net 30' })
      ).rejects.toThrow('Invoice not found');
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice', async () => {
      (dbInvoices.deleteInvoice as jest.Mock).mockResolvedValue(undefined);

      await deleteInvoice('user-123', 'INV000000001');

      expect(dbInvoices.deleteInvoice).toHaveBeenCalledWith('user-123', 'INV000000001');
    });
  });

  describe('listUserInvoices', () => {
    it('should return list of invoices', async () => {
      const mockInvoices: Invoice[] = [
        {
          invoiceID: 'INV000000001',
          userID: 'user-123',
          invoiceDate: '2026-05-20',
          terms: 'Due Upon Receipt',
          dueDate: '2026-05-27',
          currency: 'PHP',
          billTo: 'Client A',
          billToAddressLine: '123 Test St',
          billToCityAddress: 'Test City',
          billToPostalAddress: '12345',
          billToCountry: 'Philippines',
          invoiceItems: [],
          taxRate: 0.12,
          createdAt: '2026-05-20'
        }
      ];

      (dbInvoices.listInvoices as jest.Mock).mockResolvedValue(mockInvoices);

      const result = await listUserInvoices('user-123');

      expect(result).toEqual(mockInvoices);
      expect(dbInvoices.listInvoices).toHaveBeenCalledWith('user-123');
    });
  });
});

// Made with Bob