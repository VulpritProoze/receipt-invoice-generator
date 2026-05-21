/**
 * Unit tests for file validation utilities
 * Tests file type, size validation, and filename sanitization
 */

import {
  validateFileType,
  validateFileSize,
  sanitizeFilename,
  getFileType
} from './fileValidator';

describe('fileValidator', () => {
  describe('validateFileType', () => {
    it('should accept valid CSV file with correct MIME type', () => {
      expect(validateFileType('data.csv', 'text/csv')).toBe(true);
    });

    it('should accept valid XLSX file with correct MIME type', () => {
      expect(
        validateFileType(
          'data.xlsx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      ).toBe(true);
    });

    it('should accept XLSX file with legacy Excel MIME type', () => {
      expect(validateFileType('data.xlsx', 'application/vnd.ms-excel')).toBe(
        true
      );
    });

    it('should reject file with valid MIME but wrong extension', () => {
      expect(validateFileType('data.exe', 'text/csv')).toBe(false);
    });

    it('should reject file with valid extension but wrong MIME', () => {
      expect(validateFileType('data.csv', 'application/octet-stream')).toBe(
        false
      );
    });

    it('should reject executable file extension', () => {
      expect(validateFileType('malware.exe', 'application/octet-stream')).toBe(
        false
      );
    });

    it('should reject shell script', () => {
      expect(validateFileType('script.sh', 'text/plain')).toBe(false);
    });

    it('should reject batch file', () => {
      expect(validateFileType('script.bat', 'text/plain')).toBe(false);
    });

    it('should be case-insensitive for extensions', () => {
      expect(validateFileType('DATA.CSV', 'text/csv')).toBe(true);
      expect(validateFileType('Data.XlSx', 'application/vnd.ms-excel')).toBe(
        true
      );
    });
  });

  describe('validateFileSize', () => {
    it('should accept file within size limit', () => {
      const oneMB = 1024 * 1024;
      expect(validateFileSize(oneMB, 5)).toBe(true);
    });

    it('should accept file at exact size limit', () => {
      const fiveMB = 5 * 1024 * 1024;
      expect(validateFileSize(fiveMB, 5)).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      const sixMB = 6 * 1024 * 1024;
      expect(validateFileSize(sixMB, 5)).toBe(false);
    });

    it('should reject zero-size file', () => {
      expect(validateFileSize(0, 5)).toBe(false);
    });

    it('should reject negative size', () => {
      expect(validateFileSize(-100, 5)).toBe(false);
    });

    it('should use default 5MB limit when not specified', () => {
      const fourMB = 4 * 1024 * 1024;
      const sixMB = 6 * 1024 * 1024;
      expect(validateFileSize(fourMB)).toBe(true);
      expect(validateFileSize(sixMB)).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should preserve valid filename', () => {
      expect(sanitizeFilename('data.csv')).toBe('data.csv');
    });

    it('should replace forward slashes with underscores', () => {
      expect(sanitizeFilename('path/to/file.csv')).toBe('path_to_file.csv');
    });

    it('should replace backslashes with underscores', () => {
      expect(sanitizeFilename('path\\to\\file.csv')).toBe('path_to_file.csv');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file\0name.csv')).toBe('filename.csv');
    });

    it('should remove leading dots', () => {
      expect(sanitizeFilename('...hidden.csv')).toBe('hidden.csv');
    });

    it('should truncate long filenames preserving extension', () => {
      const longName = 'a'.repeat(300) + '.csv';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized.endsWith('.csv')).toBe(true);
    });

    it('should handle empty string by returning default', () => {
      expect(sanitizeFilename('')).toBe('unnamed_file');
    });

    it('should handle filename that becomes empty after sanitization', () => {
      expect(sanitizeFilename('...')).toBe('unnamed_file');
    });

    it('should handle path traversal attempts', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe(
        '.._.._.._etc_passwd'
      );
    });
  });

  describe('getFileType', () => {
    it('should return "csv" for .csv extension', () => {
      expect(getFileType('data.csv')).toBe('csv');
    });

    it('should return "xlsx" for .xlsx extension', () => {
      expect(getFileType('data.xlsx')).toBe('xlsx');
    });

    it('should return null for unsupported extension', () => {
      expect(getFileType('data.txt')).toBe(null);
    });

    it('should be case-insensitive', () => {
      expect(getFileType('DATA.CSV')).toBe('csv');
      expect(getFileType('Data.XlSx')).toBe('xlsx');
    });

    it('should return null for file without extension', () => {
      expect(getFileType('datafile')).toBe(null);
    });
  });
});

// Made with Bob
