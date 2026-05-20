/**
 * Security tests for import module
 * Tests file validation, size limits, and malicious file handling
 * See security rule: file import is a controlled attack surface
 */

import {
  validateFileType,
  validateFileSize,
  sanitizeFilename,
} from './fileValidator';
import { parseCSV } from './csvParser';
import { parseXLSX } from './xlsxParser';

describe('Import Security Tests', () => {
  describe('File type validation', () => {
    it('should reject .exe files', () => {
      expect(validateFileType('malware.exe', 'application/octet-stream')).toBe(
        false,
      );
    });

    it('should reject .sh shell scripts', () => {
      expect(validateFileType('script.sh', 'text/plain')).toBe(false);
    });

    it('should reject .bat batch files', () => {
      expect(validateFileType('script.bat', 'text/plain')).toBe(false);
    });

    it('should reject .cmd command files', () => {
      expect(validateFileType('script.cmd', 'text/plain')).toBe(false);
    });

    it('should reject .vbs VBScript files', () => {
      expect(validateFileType('script.vbs', 'text/plain')).toBe(false);
    });

    it('should reject .js JavaScript files', () => {
      expect(validateFileType('script.js', 'text/javascript')).toBe(false);
    });

    it('should reject file with correct MIME but executable extension', () => {
      // Attacker tries to upload .exe with CSV MIME type
      expect(validateFileType('malware.exe', 'text/csv')).toBe(false);
    });

    it('should reject file with correct extension but wrong MIME', () => {
      // Attacker tries to upload executable with .csv extension
      expect(validateFileType('data.csv', 'application/octet-stream')).toBe(
        false,
      );
    });

    it('should require both MIME type and extension to match', () => {
      // Only CSV MIME + CSV extension should pass
      expect(validateFileType('data.csv', 'text/csv')).toBe(true);
      expect(validateFileType('data.csv', 'application/pdf')).toBe(false);
      expect(validateFileType('data.pdf', 'text/csv')).toBe(false);
    });
  });

  describe('File size validation', () => {
    it('should enforce 5MB default limit', () => {
      const fiveMB = 5 * 1024 * 1024;
      const sixMB = 6 * 1024 * 1024;

      expect(validateFileSize(fiveMB)).toBe(true);
      expect(validateFileSize(sixMB)).toBe(false);
    });

    it('should reject extremely large files (DoS prevention)', () => {
      const oneGB = 1024 * 1024 * 1024;

      expect(validateFileSize(oneGB, 5)).toBe(false);
    });

    it('should reject zero-byte files', () => {
      expect(validateFileSize(0, 5)).toBe(false);
    });

    it('should reject negative sizes', () => {
      expect(validateFileSize(-1, 5)).toBe(false);
    });
  });

  describe('Filename sanitization', () => {
    it('should prevent path traversal with ../', () => {
      const malicious = '../../../etc/passwd';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain('../');
      expect(sanitized).not.toContain('/');
    });

    it('should prevent path traversal with ..\\', () => {
      const malicious = '..\\..\\..\\windows\\system32\\config';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain('..\\');
      expect(sanitized).not.toContain('\\');
    });

    it('should remove null bytes', () => {
      const malicious = 'file\0name.csv';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain('\0');
      expect(sanitized).toBe('filename.csv');
    });

    it('should prevent hidden file creation on Unix', () => {
      const hidden = '...hidden.csv';
      const sanitized = sanitizeFilename(hidden);

      expect(sanitized).not.toMatch(/^\./);
    });

    it('should truncate excessively long filenames', () => {
      const longName = 'a'.repeat(300) + '.csv';
      const sanitized = sanitizeFilename(longName);

      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it('should handle mixed path separators', () => {
      const malicious = 'path/to\\file/../../../etc/passwd';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('\\');
    });
  });

  describe('Parser resilience', () => {
    it('should not crash on malformed CSV', async () => {
      const malformed = 'Description,Quantity,Rate,Date\n"unclosed quote';

      // Should not throw, should handle gracefully
      await expect(parseCSV(malformed)).resolves.toBeDefined();
    });

    it('should not crash on CSV with mismatched columns', async () => {
      const mismatched = `Description,Quantity,Rate,Date
Item 1,1,100.00,2026-05-01
Item 2,2,200.00
Item 3,3`;

      const result = await parseCSV(mismatched);

      // Should parse what it can
      expect(result).toBeDefined();
    });

    it('should not crash on binary data passed as CSV', async () => {
      const binary = Buffer.from([0xff, 0xfe, 0xfd, 0xfc]).toString();

      await expect(parseCSV(binary)).rejects.toThrow();
    });

    it('should not crash on corrupted XLSX', async () => {
      const corrupted = Buffer.from('not a valid xlsx file');

      await expect(parseXLSX(corrupted)).rejects.toThrow();
    });

    it('should not execute any file content', async () => {
      // CSV with JavaScript-like content
      const malicious = `Description,Quantity,Rate,Date
<script>alert('xss')</script>,1,100.00,2026-05-01
'; DROP TABLE users; --,2,200.00,2026-05-02`;

      const items = await parseCSV(malicious);

      // Content should be treated as plain text, not executed
      if (items.length > 0) {
        expect(items[0].description).toContain('<script>');
        expect(items[0].description).not.toBe('alert'); // Not evaluated
      }
    });

    it('should handle CSV injection attempts', async () => {
      // Formula injection attempts
      const injection = `Description,Quantity,Rate,Date
=1+1,1,100.00,2026-05-01
@SUM(A1:A10),2,200.00,2026-05-02
+cmd|'/c calc',3,300.00,2026-05-03`;

      const items = await parseCSV(injection);

      // Formulas should be treated as text
      items.forEach((item) => {
        expect(typeof item.description).toBe('string');
      });
    });
  });

  describe('User isolation', () => {
    it('should not allow empty userID in import', async () => {
      const { importBillingHistory } = await import('./importService');
      const csv = `Description,Quantity,Rate,Date
Item,1,100.00,2026-05-01`;

      await expect(importBillingHistory('', csv, 'csv')).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should not allow whitespace-only userID', async () => {
      const { importBillingHistory } = await import('./importService');
      const csv = `Description,Quantity,Rate,Date
Item,1,100.00,2026-05-01`;

      await expect(importBillingHistory('   ', csv, 'csv')).rejects.toThrow(
        'User ID is required',
      );
    });
  });

  describe('Resource exhaustion prevention', () => {
    it('should handle CSV with many columns gracefully', async () => {
      const manyCols = Array(1000).fill('col').join(',');
      const csv = `${manyCols}\n${Array(1000).fill('val').join(',')}`;

      // Should not crash or hang
      await expect(parseCSV(csv)).rejects.toThrow();
    });

    it('should handle CSV with very long field values', async () => {
      const longValue = 'a'.repeat(10000);
      const csv = `Description,Quantity,Rate,Date
${longValue},1,100.00,2026-05-01`;

      const items = await parseCSV(csv);

      // Should parse but validate against schema
      // Description max is 500 chars, so this should be rejected
      expect(items.length).toBe(0);
    });
  });
});

// Made with Bob
