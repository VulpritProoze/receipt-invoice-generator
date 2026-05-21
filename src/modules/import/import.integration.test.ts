/**
 * Integration tests for import module
 * Tests complete workflow: upload → parse → validate → store
 * Uses mocked Redis for database operations
 */

import { importBillingHistory } from './importService';
import { redis } from '@/lib/redis';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as XLSX from 'xlsx-js-style';

// Mock Redis is automatically used via jest.setup.ts

describe('Import Integration Tests', () => {
  beforeEach(async () => {
    // Clear Redis mock before each test
    if (redis) {
      const keys = await redis.keys('*');
      for (const key of keys) {
        await redis.del(key);
      }
    }
  });

  describe('Complete CSV import workflow', () => {
    it('should import CSV file and store items in database', async () => {
      const csv = `Description,Quantity,Rate,Date
Web hosting,1,1200.00,2026-05-01
Design work,2,1500.00,2026-05-02
Consulting,3,2000.00,2026-05-03`;

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify items are stored in Redis
      const keys = await redis!.keys('invoiceItem:user123:*');
      expect(keys.length).toBe(3);

      // Verify item data
      const item = await redis!.get<unknown>(keys[0]);
      expect(item).toBeDefined();
      expect(item).toHaveProperty('itemID');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('rate');
      expect(item).toHaveProperty('date');
    });

    it('should associate items with correct user', async () => {
      const csv = `Description,Quantity,Rate,Date
Item,1,100.00,2026-05-01`;

      await importBillingHistory('user456', csv, 'csv');

      // Check that items are under correct user key
      const user456Keys = await redis!.keys('invoiceItem:user456:*');
      const user123Keys = await redis!.keys('invoiceItem:user123:*');

      expect(user456Keys.length).toBe(1);
      expect(user123Keys.length).toBe(0);
    });

    it('should handle partial import with some invalid rows', async () => {
      const csv = `Description,Quantity,Rate,Date
Valid item 1,1,100.00,2026-05-01
Invalid item,not-a-number,100.00,2026-05-02
Valid item 2,2,200.00,2026-05-03`;

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);

      // Verify only valid items are stored
      const keys = await redis!.keys('invoiceItem:user123:*');
      expect(keys.length).toBe(2);
    });
  });

  describe('Complete XLSX import workflow', () => {
    it('should import XLSX file and store items in database', async () => {
      const data = [
        ['Description', 'Quantity', 'Rate', 'Date'],
        ['Web hosting', 1, 1200.0, '2026-05-01'],
        ['Design work', 2, 1500.0, '2026-05-02']
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = Buffer.from(
        XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      );

      const result = await importBillingHistory('user123', buffer, 'xlsx');

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);

      // Verify items are stored
      const keys = await redis!.keys('invoiceItem:user123:*');
      expect(keys.length).toBe(2);
    });
  });

  describe('Fixture file integration', () => {
    it('should import valid-billing.csv fixture completely', async () => {
      const fixturePath = join(__dirname, '__fixtures__', 'valid-billing.csv');
      const csv = readFileSync(fixturePath, 'utf-8');

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(5);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify all items stored
      const keys = await redis!.keys('invoiceItem:user123:*');
      expect(keys.length).toBe(5);
    });

    it('should import valid-billing.xlsx fixture completely', async () => {
      const fixturePath = join(__dirname, '__fixtures__', 'valid-billing.xlsx');
      const buffer = readFileSync(fixturePath);

      const result = await importBillingHistory('user123', buffer, 'xlsx');

      expect(result.imported).toBe(5);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify all items stored
      const keys = await redis!.keys('invoiceItem:user123:*');
      expect(keys.length).toBe(5);
    });

    it('should handle invalid-dates.csv with partial import', async () => {
      const fixturePath = join(__dirname, '__fixtures__', 'invalid-dates.csv');
      const csv = readFileSync(fixturePath, 'utf-8');

      const result = await importBillingHistory('user123', csv, 'csv');

      // Should have some skipped rows
      expect(result.skipped).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);

      // Should still import valid rows
      const keys = await redis!.keys('invoiceItem:user123:*');
      expect(keys.length).toBe(result.imported);
    });

    it('should handle missing-quantity.csv with partial import', async () => {
      const fixturePath = join(
        __dirname,
        '__fixtures__',
        'missing-quantity.csv'
      );
      const csv = readFileSync(fixturePath, 'utf-8');

      const result = await importBillingHistory('user123', csv, 'csv');

      // Should have some skipped rows
      expect(result.skipped).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);

      // Should still import valid rows
      const keys = await redis!.keys('invoiceItem:user123:*');
      expect(keys.length).toBe(result.imported);
    });
  });

  describe('Multiple user isolation', () => {
    it('should keep items separate between users', async () => {
      const csv1 = `Description,Quantity,Rate,Date
User1 Item,1,100.00,2026-05-01`;

      const csv2 = `Description,Quantity,Rate,Date
User2 Item,2,200.00,2026-05-02`;

      await importBillingHistory('user1', csv1, 'csv');
      await importBillingHistory('user2', csv2, 'csv');

      const user1Keys = await redis!.keys('invoiceItem:user1:*');
      const user2Keys = await redis!.keys('invoiceItem:user2:*');

      expect(user1Keys.length).toBe(1);
      expect(user2Keys.length).toBe(1);

      // Verify items belong to correct users
      const user1Item = await redis!.get<{ description: string }>(user1Keys[0]);
      const user2Item = await redis!.get<{ description: string }>(user2Keys[0]);

      expect(user1Item?.description).toBe('User1 Item');
      expect(user2Item?.description).toBe('User2 Item');
    });
  });

  describe('Error recovery', () => {
    it('should continue importing after storage error', async () => {
      const csv = `Description,Quantity,Rate,Date
Item 1,1,100.00,2026-05-01
Item 2,2,200.00,2026-05-02
Item 3,3,300.00,2026-05-03`;

      // Mock Redis to fail on second item
      let callCount = 0;
      const originalSet = redis!.set;
      redis!.set = jest.fn(async (key: string, value: unknown) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Storage error');
        }
        return originalSet.call(redis, key, value);
      });

      const result = await importBillingHistory('user123', csv, 'csv');

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);

      // Restore original
      redis!.set = originalSet;
    });
  });

  describe('Data integrity', () => {
    it('should store items with all required fields', async () => {
      const csv = `Description,Quantity,Rate,Date
Test Item,5,250.50,2026-05-15`;

      await importBillingHistory('user123', csv, 'csv');

      const keys = await redis!.keys('invoiceItem:user123:*');
      const item = await redis!.get<{
        itemID: string;
        description: string;
        quantity: number;
        rate: number;
        date: string;
      }>(keys[0]);

      expect(item).toBeDefined();
      expect(item!.itemID).toBeDefined();
      expect(typeof item!.itemID).toBe('string');
      expect(item!.description).toBe('Test Item');
      expect(item!.quantity).toBe(5);
      expect(item!.rate).toBe(250.5);
      expect(item!.date).toBe('2026-05-15');
    });

    it('should generate unique itemIDs for each item', async () => {
      const csv = `Description,Quantity,Rate,Date
Item 1,1,100.00,2026-05-01
Item 2,2,200.00,2026-05-02
Item 3,3,300.00,2026-05-03`;

      await importBillingHistory('user123', csv, 'csv');

      const keys = await redis!.keys('invoiceItem:user123:*');
      const items = await Promise.all(
        keys.map((key) => redis!.get<{ itemID: string }>(key))
      );

      const itemIDs = items.map((item) => item!.itemID);
      const uniqueIDs = new Set(itemIDs);

      expect(uniqueIDs.size).toBe(3); // All IDs should be unique
    });
  });
});

// Made with Bob
