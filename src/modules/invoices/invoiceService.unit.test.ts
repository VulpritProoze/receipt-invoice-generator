import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  listBillingUserInvoices,
  calculateInvoiceTotals
} from './invoiceService';
import * as dbInvoices from '@/lib/db/invoices';
import * as billingHistoryDB from '@/lib/db/billingHistory';
import * as invoiceItemMastersDB from '@/lib/db/invoiceItemMasters';
import * as idGenerator from '@/lib/idGenerator';
import { Invoice } from '@/models/invoice';

// Mock database operations
jest.mock('@/lib/db/invoices');
jest.mock('@/lib/db/billingHistory');
jest.mock('@/lib/db/invoiceItemMasters');
jest.mock('@/lib/idGenerator');

describe('invoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockInvoice: Invoice = {
    invoiceID: 'INV000000001',
    billingUserID: 'billing-123',
    invoiceDate: '2026-05-20',
    terms: 'Due Upon Receipt',
    dueDate: '2026-05-27',
    currency: 'PHP',
    invoiceItems: [
      {
        invoiceItemID: 'item-1',
        description: 'Service A',
        billingHistoryEntries: [
          {
            billingHistoryID: 'bh-1',
            quantity: 2,
            rate: 100,
            date: '2026-05-20',
            amount: 200
          }
        ]
      },
      {
        invoiceItemID: 'item-2',
        description: 'Service B',
        billingHistoryEntries: [
          {
            billingHistoryID: 'bh-2',
            quantity: 3,
            rate: 50,
            date: '2026-05-20',
            amount: 150
          }
        ]
      }
    ],
    taxRate: 0.12,
    createdAt: '2026-05-20'
  };

  describe('calculateInvoiceTotals', () => {
    it('should calculate subtotal, tax, and total correctly', () => {
      const result = calculateInvoiceTotals(mockInvoice);

      expect(result.subtotal).toBe(350); // (2*100) + (3*50)
      expect(result.taxAmount).toBe(42); // 350 * 0.12
      expect(result.total).toBe(392); // 350 + 42
    });

    it('should guard against negative totals', () => {
      const invoice: Invoice = {
        invoiceID: 'INV000000001',
        billingUserID: 'billing-123',
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP',
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
      const mockHistory = [
        {
          billingHistoryID: 'bh-1',
          billingUserID: 'billing-123',
          invoiceItemID: 'item-1',
          quantity: 2,
          rate: 100,
          date: '2026-05-20',
          billedStatus: 'unbilled',
          invoiceID: null,
          createdAt: '2026-05-20'
        }
      ];

      const mockItemMaster = {
        invoiceItemID: 'item-1',
        companyID: 'company-123',
        description: 'Service A',
        defaultRate: 100,
        createdAt: '2026-05-20'
      };

      (billingHistoryDB.getBillingHistoriesByIDs as any).mockResolvedValue(mockHistory);
      (invoiceItemMastersDB.getInvoiceItemMaster as any).mockResolvedValue(mockItemMaster);
      (dbInvoices.getNextInvoiceSequence as any).mockResolvedValue(1);
      (idGenerator.generateInvoiceID as any).mockReturnValue('INV000000001');
      (dbInvoices.createInvoice as any).mockResolvedValue(undefined);
      (billingHistoryDB.markBillingHistoryAsBilled as any).mockResolvedValue(undefined);

      const invoiceData = {
        invoiceDate: '2026-05-20',
        terms: 'Due Upon Receipt',
        dueDate: '2026-05-27',
        currency: 'PHP' as const,
        taxRate: 0.12
      };

      const result = await createInvoice('billing-123', ['bh-1'], invoiceData);

      expect(result.invoiceID).toBe('INV000000001');
      expect(result.billingUserID).toBe('billing-123');
      expect(dbInvoices.getNextInvoiceSequence).toHaveBeenCalledWith('billing-123');
      expect(idGenerator.generateInvoiceID).toHaveBeenCalledWith(1);
      expect(dbInvoices.createInvoice).toHaveBeenCalled();
    });
  });

  describe('getInvoice', () => {
    it('should return invoice', async () => {
      (dbInvoices.getInvoice as any).mockResolvedValue(mockInvoice);

      const result = await getInvoice('billing-123', 'INV000000001');

      expect(result).toEqual(mockInvoice);
    });

    it('should return null if not found', async () => {
      (dbInvoices.getInvoice as any).mockResolvedValue(null);

      const result = await getInvoice('billing-123', 'INV000000001');

      expect(result).toBeNull();
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice and return updated version', async () => {
      const updatedInvoice = { ...mockInvoice, terms: 'Net 30' };

      (dbInvoices.getInvoice as any)
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce(updatedInvoice);
      (dbInvoices.updateInvoice as any).mockResolvedValue(undefined);

      const result = await updateInvoice('billing-123', 'INV000000001', {
        terms: 'Net 30'
      });

      expect(result.terms).toBe('Net 30');
      expect(dbInvoices.updateInvoice).toHaveBeenCalledWith(
        'billing-123',
        'INV000000001',
        {
          terms: 'Net 30'
        }
      );
    });

    it('should throw error if invoice not found', async () => {
      (dbInvoices.getInvoice as any).mockResolvedValue(null);

      await expect(
        updateInvoice('billing-123', 'INV000000001', { terms: 'Net 30' })
      ).rejects.toThrow('Invoice not found');
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice and unmark billing history', async () => {
      (dbInvoices.getInvoice as any).mockResolvedValue(mockInvoice);
      (billingHistoryDB.unmarkBillingHistoryAsBilled as any).mockResolvedValue(undefined);
      (dbInvoices.deleteInvoice as any).mockResolvedValue(undefined);

      await deleteInvoice('billing-123', 'INV000000001');

      expect(dbInvoices.deleteInvoice).toHaveBeenCalledWith(
        'billing-123',
        'INV000000001'
      );
      expect(billingHistoryDB.unmarkBillingHistoryAsBilled).toHaveBeenCalledWith(['bh-1', 'bh-2']);
    });
  });

  describe('listBillingUserInvoices', () => {
    it('should return list of invoices', async () => {
      const mockInvoices: Invoice[] = [mockInvoice];

      (dbInvoices.listInvoices as any).mockResolvedValue(mockInvoices);

      const result = await listBillingUserInvoices('billing-123');

      expect(result).toEqual(mockInvoices);
      expect(dbInvoices.listInvoices).toHaveBeenCalledWith('billing-123');
    });
  });
});
