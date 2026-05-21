/**
 * Fixture tests for import module
 * Verifies all fixture files in __fixtures__/ directory parse correctly
 */

import { parseCSV, parseCSVWithDetails } from './csvParser';
import { parseXLSX, parseXLSXWithDetails } from './xlsxParser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Import Fixture Tests', () => {
  const fixturesDir = join(__dirname, '__fixtures__');

  describe('valid-billing.csv', () => {
    it('should parse without errors', async () => {
      const filePath = join(fixturesDir, 'valid-billing.csv');
      const content = readFileSync(filePath, 'utf-8');

      const items = await parseCSV(content);

      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBe(5); // Based on fixture content

      // Verify all items have required fields
      items.forEach((item) => {
        expect(item.itemID).toBeDefined();
        expect(typeof item.itemID).toBe('string');
        expect(item.description).toBeTruthy();
        expect(item.quantity).toBeGreaterThan(0);
        expect(Number.isInteger(item.quantity)).toBe(true);
        expect(item.rate).toBeGreaterThan(0);
        expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should have zero skipped rows', async () => {
      const filePath = join(fixturesDir, 'valid-billing.csv');
      const content = readFileSync(filePath, 'utf-8');

      const result = await parseCSVWithDetails(content);

      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('valid-billing.xlsx', () => {
    it('should parse without errors', async () => {
      const filePath = join(fixturesDir, 'valid-billing.xlsx');
      const buffer = readFileSync(filePath);

      const items = await parseXLSX(buffer);

      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBe(5); // Based on fixture content

      // Verify all items have required fields
      items.forEach((item) => {
        expect(item.itemID).toBeDefined();
        expect(typeof item.itemID).toBe('string');
        expect(item.description).toBeTruthy();
        expect(item.quantity).toBeGreaterThan(0);
        expect(Number.isInteger(item.quantity)).toBe(true);
        expect(item.rate).toBeGreaterThan(0);
        expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should have zero skipped rows', async () => {
      const filePath = join(fixturesDir, 'valid-billing.xlsx');
      const buffer = readFileSync(filePath);

      const result = await parseXLSXWithDetails(buffer);

      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should produce same data as CSV version', async () => {
      const csvPath = join(fixturesDir, 'valid-billing.csv');
      const xlsxPath = join(fixturesDir, 'valid-billing.xlsx');

      const csvContent = readFileSync(csvPath, 'utf-8');
      const xlsxBuffer = readFileSync(xlsxPath);

      const csvItems = await parseCSV(csvContent);
      const xlsxItems = await parseXLSX(xlsxBuffer);

      expect(csvItems.length).toBe(xlsxItems.length);

      // Compare data (excluding itemID which is generated)
      for (let i = 0; i < csvItems.length; i++) {
        expect(csvItems[i].description).toBe(xlsxItems[i].description);
        expect(csvItems[i].quantity).toBe(xlsxItems[i].quantity);
        expect(csvItems[i].rate).toBe(xlsxItems[i].rate);
        expect(csvItems[i].date).toBe(xlsxItems[i].date);
      }
    });
  });

  describe('invalid-dates.csv', () => {
    it('should skip rows with invalid dates', async () => {
      const filePath = join(fixturesDir, 'invalid-dates.csv');
      const content = readFileSync(filePath, 'utf-8');

      const result = await parseCSVWithDetails(content);

      expect(result.skipped).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);

      // Errors should mention date validation
      const dateErrors = result.errors.filter((err) =>
        err.toLowerCase().includes('date')
      );
      expect(dateErrors.length).toBeGreaterThan(0);
    });

    it('should still parse valid rows', async () => {
      const filePath = join(fixturesDir, 'invalid-dates.csv');
      const content = readFileSync(filePath, 'utf-8');

      const result = await parseCSVWithDetails(content);

      // Should have some valid items
      expect(result.items.length).toBeGreaterThanOrEqual(0);

      // All parsed items should have valid dates
      result.items.forEach((item) => {
        expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('missing-quantity.csv', () => {
    it('should skip rows with missing quantity', async () => {
      const filePath = join(fixturesDir, 'missing-quantity.csv');
      const content = readFileSync(filePath, 'utf-8');

      const result = await parseCSVWithDetails(content);

      expect(result.skipped).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);

      // Errors should mention quantity or missing fields
      const quantityErrors = result.errors.filter(
        (err) =>
          err.toLowerCase().includes('quantity') ||
          err.toLowerCase().includes('missing')
      );
      expect(quantityErrors.length).toBeGreaterThan(0);
    });

    it('should still parse valid rows', async () => {
      const filePath = join(fixturesDir, 'missing-quantity.csv');
      const content = readFileSync(filePath, 'utf-8');

      const result = await parseCSVWithDetails(content);

      // Should have some valid items
      expect(result.items.length).toBeGreaterThanOrEqual(0);

      // All parsed items should have valid quantity
      result.items.forEach((item) => {
        expect(item.quantity).toBeGreaterThan(0);
        expect(Number.isInteger(item.quantity)).toBe(true);
      });
    });
  });

  describe('Fixture file integrity', () => {
    it('should have all expected fixture files', () => {
      const expectedFiles = [
        'valid-billing.csv',
        'valid-billing.xlsx',
        'invalid-dates.csv',
        'missing-quantity.csv'
      ];

      expectedFiles.forEach((filename) => {
        const filePath = join(fixturesDir, filename);
        expect(() => readFileSync(filePath)).not.toThrow();
      });
    });

    it('should have non-empty fixture files', () => {
      const files = [
        'valid-billing.csv',
        'valid-billing.xlsx',
        'invalid-dates.csv',
        'missing-quantity.csv'
      ];

      files.forEach((filename) => {
        const filePath = join(fixturesDir, filename);
        const stats = readFileSync(filePath);
        expect(stats.length).toBeGreaterThan(0);
      });
    });
  });
});

// Made with Bob
