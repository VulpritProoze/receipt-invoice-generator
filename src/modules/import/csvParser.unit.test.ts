/**
 * Unit tests for CSV parser
 * Tests parsing, validation, and error handling
 */

import { parseCSV, parseCSVWithDetails } from './csvParser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('csvParser', () => {
  describe('parseCSV', () => {
    it('should parse valid CSV file', async () => {
      const csv = `Description,Quantity,Rate,Date
Web hosting,1,1200.00,2026-05-01
Design work,2,1500.00,2026-05-02`;

      const items = await parseCSV(csv);

      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({
        description: 'Web hosting',
        quantity: 1,
        rate: 1200.0,
        date: '2026-05-01'
      });
      expect(items[0].itemID).toBeDefined();
      expect(items[1]).toMatchObject({
        description: 'Design work',
        quantity: 2,
        rate: 1500.0,
        date: '2026-05-02'
      });
    });

    it('should throw error for empty file', async () => {
      await expect(parseCSV('')).rejects.toThrow('File is empty');
    });

    it('should throw error for file with missing columns', async () => {
      const csv = `Description,Quantity
Web hosting,1`;

      await expect(parseCSV(csv)).rejects.toThrow(
        'CSV missing required columns'
      );
    });

    it('should throw error when all rows are invalid', async () => {
      const csv = `Description,Quantity,Rate,Date
,,,
invalid,not-a-number,not-a-number,invalid-date`;

      await expect(parseCSV(csv)).rejects.toThrow('CSV parsing failed');
    });

    it('should skip invalid rows and return valid ones', async () => {
      const csv = `Description,Quantity,Rate,Date
Valid item,1,100.00,2026-05-01
,,,
Invalid item,not-a-number,100.00,2026-05-02
Another valid,2,200.00,2026-05-03`;

      const items = await parseCSV(csv);

      expect(items).toHaveLength(2);
      expect(items[0].description).toBe('Valid item');
      expect(items[1].description).toBe('Another valid');
    });

    it('should handle CSV with extra whitespace', async () => {
      const csv = `Description,Quantity,Rate,Date
  Web hosting  ,  1  ,  1200.00  ,  2026-05-01  `;

      const items = await parseCSV(csv);

      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('Web hosting');
      expect(items[0].date).toBe('2026-05-01');
    });

    it('should convert quantity to integer', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,2.7,100.00,2026-05-01`;

      const items = await parseCSV(csv);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2); // Floored to integer
    });
  });

  describe('parseCSVWithDetails', () => {
    it('should return detailed results with skipped count', async () => {
      const csv = `Description,Quantity,Rate,Date
Valid item,1,100.00,2026-05-01
Invalid item,not-a-number,100.00,2026-05-02
Another valid,2,200.00,2026-05-03`;

      const result = await parseCSVWithDetails(csv);

      expect(result.items).toHaveLength(2);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Row 3');
    });

    it('should report errors for rows with negative quantity', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,-1,100.00,2026-05-01`;

      const result = await parseCSVWithDetails(csv);

      expect(result.items).toHaveLength(0);
      expect(result.skipped).toBe(1);
      expect(result.errors[0]).toContain('quantity');
    });

    it('should report errors for rows with negative rate', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,1,-100.00,2026-05-01`;

      const result = await parseCSVWithDetails(csv);

      expect(result.items).toHaveLength(0);
      expect(result.skipped).toBe(1);
      expect(result.errors[0]).toContain('rate');
    });

    it('should report errors for rows with invalid date format', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,1,100.00,05/01/2026`;

      const result = await parseCSVWithDetails(csv);

      expect(result.items).toHaveLength(0);
      expect(result.skipped).toBe(1);
      expect(result.errors[0]).toContain('date');
    });

    it('should handle empty rows gracefully', async () => {
      const csv = `Description,Quantity,Rate,Date
Valid item,1,100.00,2026-05-01

Another valid,2,200.00,2026-05-03`;

      const result = await parseCSVWithDetails(csv);

      expect(result.items).toHaveLength(2);
      expect(result.skipped).toBe(0);
    });

    it('should report multiple validation errors per row', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,-1,-100.00,invalid-date`;

      const result = await parseCSVWithDetails(csv);

      expect(result.items).toHaveLength(0);
      expect(result.skipped).toBe(1);
      expect(result.errors[0]).toContain('Row 2');
    });
  });

  describe('fixture file parsing', () => {
    it('should parse valid-billing.csv fixture', async () => {
      const fixturePath = join(__dirname, '__fixtures__', 'valid-billing.csv');
      const csv = readFileSync(fixturePath, 'utf-8');

      const items = await parseCSV(csv);

      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.itemID).toBeDefined();
        expect(item.description).toBeTruthy();
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.rate).toBeGreaterThan(0);
        expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should handle invalid-dates.csv fixture', async () => {
      const fixturePath = join(__dirname, '__fixtures__', 'invalid-dates.csv');
      const csv = readFileSync(fixturePath, 'utf-8');

      const result = await parseCSVWithDetails(csv);

      expect(result.skipped).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing-quantity.csv fixture', async () => {
      const fixturePath = join(
        __dirname,
        '__fixtures__',
        'missing-quantity.csv'
      );
      const csv = readFileSync(fixturePath, 'utf-8');

      const result = await parseCSVWithDetails(csv);

      expect(result.skipped).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

// Made with Bob
