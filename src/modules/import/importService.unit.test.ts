/**
 * Unit tests for import service
 * Tests orchestration of parsing and storage with mocked services
 */

import { importBillingHistory, validateImportFile } from './importService';
import * as billingUserService from '@/modules/billingUsers/billingUserService';
import * as billingHistoryService from '@/modules/billingHistory/billingHistoryService';
import * as importMatcher from './importMatcher';
import * as XLSX from 'xlsx-js-style';

// Mock the services
jest.mock('@/modules/billingUsers/billingUserService');
jest.mock('@/modules/billingHistory/billingHistoryService');
jest.mock('./importMatcher');

describe('importService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    (billingUserService.getBillingUser as any).mockResolvedValue({
      billingUserID: 'user123',
      companyID: 'company123',
      name: 'Test Billing User'
    });
    (importMatcher.matchImportRowsToItems as any).mockResolvedValue({
      matched: [
        { invoiceItemID: 'item-1', description: 'Web hosting', quantity: 1, rate: 1200, date: '2026-05-01' },
        { invoiceItemID: 'item-2', description: 'Design work', quantity: 2, rate: 1500, date: '2026-05-02' }
      ],
      unmatched: []
    });
    (billingHistoryService.createBillingHistory as any).mockResolvedValue({});
  });

  describe('importBillingHistory', () => {
    it('should import valid CSV file when all items match catalog', async () => {
      const csv = `Description,Quantity,Rate,Date
Web hosting,1,1200.00,2026-05-01
Design work,2,1500.00,2026-05-02`;

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(billingHistoryService.createBillingHistory).toHaveBeenCalledTimes(2);
    });

    it('should import valid XLSX file', async () => {
      // Create minimal XLSX buffer
      const data = [
        ['Description', 'Quantity', 'Rate', 'Date'],
        ['Web hosting', 1, 1200.0, '2026-05-01']
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = Buffer.from(
        XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      );

      (importMatcher.matchImportRowsToItems as any).mockResolvedValue({
        matched: [
          { invoiceItemID: 'item-1', description: 'Web hosting', quantity: 1, rate: 1200, date: '2026-05-01' }
        ],
        unmatched: []
      });

      const result = await importBillingHistory('user123', buffer, 'xlsx');

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(billingHistoryService.createBillingHistory).toHaveBeenCalledTimes(1);
    });

    it('should abort import and return unmatched items if unmatched items exist', async () => {
      const csv = `Description,Quantity,Rate,Date
Web hosting,1,1200.00,2026-05-01
Unmatched service,2,2000.00,2026-05-02`;

      (importMatcher.matchImportRowsToItems as any).mockResolvedValue({
        matched: [
          { invoiceItemID: 'item-1', description: 'Web hosting', quantity: 1, rate: 1200, date: '2026-05-01' }
        ],
        unmatched: [
          { description: 'Unmatched service' }
        ]
      });

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(2); // CSV has 2 items
      expect(result.unmatched).toHaveLength(1);
      expect(result.unmatched?.[0].description).toBe('Unmatched service');
      expect(billingHistoryService.createBillingHistory).not.toHaveBeenCalled();
    });

    it('should throw error if billingUserID is missing', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,1,100.00,2026-05-01`;

      await expect(importBillingHistory('', csv, 'csv')).rejects.toThrow(
        'Billing User ID is required'
      );
    });

    it('should throw error for unsupported file type', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,1,100.00,2026-05-01`;

      await expect(
        importBillingHistory('user123', csv, 'txt' as 'csv')
      ).rejects.toThrow('Unsupported file type');
    });

    it('should throw error if CSV content is not a string', async () => {
      await expect(
        importBillingHistory('user123', Buffer.from('test'), 'csv')
      ).rejects.toThrow('CSV file content must be a string');
    });

    it('should throw error if XLSX content is not a Buffer', async () => {
      await expect(
        importBillingHistory('user123', 'test', 'xlsx')
      ).rejects.toThrow('XLSX file content must be a Buffer');
    });

    it('should handle storage errors gracefully', async () => {
      const csv = `Description,Quantity,Rate,Date
Web hosting,1,1200.00,2026-05-01
Design work,2,1500.00,2026-05-02`;

      (billingHistoryService.createBillingHistory as any)
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockResolvedValueOnce({});

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Storage error');
    });

    it('should return zero imported when no valid items', async () => {
      const csv = `Description,Quantity,Rate,Date
,,,`;

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateImportFile', () => {
    it('should validate CSV file without storing', async () => {
      const csv = `Description,Quantity,Rate,Date
Valid item,1,100.00,2026-05-01
Invalid item,not-a-number,100.00,2026-05-02`;

      const result = await validateImportFile(csv, 'csv');

      expect(result.validItems).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate XLSX file without storing', async () => {
      const data = [
        ['Description', 'Quantity', 'Rate', 'Date'],
        ['Valid item', 1, 100.0, '2026-05-01']
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = Buffer.from(
        XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      );

      const result = await validateImportFile(buffer, 'xlsx');

      expect(result.validItems).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid file', async () => {
      const csv = `Description,Quantity
Missing columns`;

      const result = await validateImportFile(csv, 'csv');

      expect(result.validItems).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle unsupported file type', async () => {
      const result = await validateImportFile('test', 'txt' as 'csv');

      expect(result.validItems).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Unsupported file type');
    });
  });
});
