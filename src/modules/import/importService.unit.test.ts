/**
 * Unit tests for import service
 * Tests orchestration of parsing and storage with mocked database
 */

import { importBillingHistory, validateImportFile } from './importService';
import * as invoicesDb from '@/lib/db/invoices';

// Mock the database module
jest.mock('@/lib/db/invoices');

describe('importService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('importBillingHistory', () => {
    it('should import valid CSV file', async () => {
      const csv = `Description,Quantity,Rate,Date
Web hosting,1,1200.00,2026-05-01
Design work,2,1500.00,2026-05-02`;

      const mockCreateInvoiceItem = jest
        .spyOn(invoicesDb, 'createInvoiceItem')
        .mockResolvedValue();

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockCreateInvoiceItem).toHaveBeenCalledTimes(2);
    });

    it('should import valid XLSX file', async () => {
      // Create minimal XLSX buffer
      const XLSX = require('xlsx');
      const data = [
        ['Description', 'Quantity', 'Rate', 'Date'],
        ['Web hosting', 1, 1200.0, '2026-05-01'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = Buffer.from(
        XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }),
      );

      const mockCreateInvoiceItem = jest
        .spyOn(invoicesDb, 'createInvoiceItem')
        .mockResolvedValue();

      const result = await importBillingHistory('user123', buffer, 'xlsx');

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(mockCreateInvoiceItem).toHaveBeenCalledTimes(1);
    });

    it('should skip invalid rows and import valid ones', async () => {
      const csv = `Description,Quantity,Rate,Date
Valid item,1,100.00,2026-05-01
Invalid item,not-a-number,100.00,2026-05-02
Another valid,2,200.00,2026-05-03`;

      const mockCreateInvoiceItem = jest
        .spyOn(invoicesDb, 'createInvoiceItem')
        .mockResolvedValue();

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(mockCreateInvoiceItem).toHaveBeenCalledTimes(2);
    });

    it('should throw error if userID is missing', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,1,100.00,2026-05-01`;

      await expect(importBillingHistory('', csv, 'csv')).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error for unsupported file type', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,1,100.00,2026-05-01`;

      await expect(
        importBillingHistory('user123', csv, 'txt' as 'csv'),
      ).rejects.toThrow('Unsupported file type');
    });

    it('should throw error if CSV content is not a string', async () => {
      await expect(
        importBillingHistory('user123', Buffer.from('test'), 'csv'),
      ).rejects.toThrow('CSV file content must be a string');
    });

    it('should throw error if XLSX content is not a Buffer', async () => {
      await expect(
        importBillingHistory('user123', 'test', 'xlsx'),
      ).rejects.toThrow('XLSX file content must be a Buffer');
    });

    it('should handle storage errors gracefully', async () => {
      const csv = `Description,Quantity,Rate,Date
Item 1,1,100.00,2026-05-01
Item 2,2,200.00,2026-05-02`;

      const mockCreateInvoiceItem = jest
        .spyOn(invoicesDb, 'createInvoiceItem')
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockResolvedValueOnce();

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

    it('should associate items with correct userID', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,1,100.00,2026-05-01`;

      const mockCreateInvoiceItem = jest
        .spyOn(invoicesDb, 'createInvoiceItem')
        .mockResolvedValue();

      await importBillingHistory('user456', csv, 'csv');

      expect(mockCreateInvoiceItem).toHaveBeenCalledWith(
        'user456',
        expect.objectContaining({
          description: 'Item',
          quantity: 1,
          rate: 100.0,
        }),
      );
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
      const XLSX = require('xlsx');
      const data = [
        ['Description', 'Quantity', 'Rate', 'Date'],
        ['Valid item', 1, 100.0, '2026-05-01'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = Buffer.from(
        XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }),
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

// Made with Bob
