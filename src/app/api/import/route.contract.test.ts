/**
 * Contract tests for import API route
 * Tests HTTP interface, request/response format, and error handling
 */

import { POST } from './route';
import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx-js-style';

// Mock the import service
jest.mock('@/modules/import/importService');

describe('POST /api/import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request validation', () => {
    it('should return 400 if userID is missing', async () => {
      const formData = new FormData();
      formData.append(
        'file',
        new File(['test'], 'test.csv', { type: 'text/csv' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('userID');
    });

    it('should return 400 if file is missing', async () => {
      const formData = new FormData();
      formData.append('userID', 'user123');

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('file');
    });

    it('should return 413 if file exceeds size limit', async () => {
      const formData = new FormData();
      formData.append('userID', 'user123');

      // Create 6MB file (exceeds 5MB limit)
      const largeContent = 'a'.repeat(6 * 1024 * 1024);
      formData.append(
        'file',
        new File([largeContent], 'large.csv', { type: 'text/csv' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data.error).toContain('too large');
    });

    it('should return 400 for invalid file type', async () => {
      const formData = new FormData();
      formData.append('userID', 'user123');
      formData.append(
        'file',
        new File(['test'], 'test.exe', { type: 'application/octet-stream' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid file type');
    });

    it('should return 400 for file with wrong MIME type', async () => {
      const formData = new FormData();
      formData.append('userID', 'user123');
      formData.append(
        'file',
        new File(['test'], 'test.csv', { type: 'application/pdf' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid file type');
    });
  });

  describe('Successful import', () => {
    it('should return 200 with import results for valid CSV', async () => {
      const { importBillingHistory } =
        await import('@/modules/import/importService');
      (importBillingHistory as jest.Mock).mockResolvedValue({
        imported: 5,
        skipped: 1,
        errors: ['Row 3: Invalid date']
      });

      const formData = new FormData();
      formData.append('userID', 'user123');
      const csvContent = `Description,Quantity,Rate,Date
Item,1,100.00,2026-05-01`;
      formData.append(
        'file',
        new File([csvContent], 'data.csv', { type: 'text/csv' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('imported');
      expect(data).toHaveProperty('skipped');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('filename');
      expect(data.imported).toBe(5);
      expect(data.skipped).toBe(1);
    });

    it('should return 200 with import results for valid XLSX', async () => {
      const { importBillingHistory } =
        await import('@/modules/import/importService');
      (importBillingHistory as jest.Mock).mockResolvedValue({
        imported: 3,
        skipped: 0,
        errors: []
      });

      const formData = new FormData();
      formData.append('userID', 'user123');

      // Create minimal XLSX buffer
      const data = [
        ['Description', 'Quantity', 'Rate', 'Date'],
        ['Item', 1, 100.0, '2026-05-01']
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      formData.append(
        'file',
        new File([buffer], 'data.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.imported).toBe(3);
      expect(responseData.skipped).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should return 500 if import service throws error', async () => {
      const { importBillingHistory } =
        await import('@/modules/import/importService');
      (importBillingHistory as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const formData = new FormData();
      formData.append('userID', 'user123');
      formData.append(
        'file',
        new File(['test'], 'data.csv', { type: 'text/csv' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Import failed');
      expect(data.message).toBeDefined();
    });

    it('should not expose internal error details to client', async () => {
      const { importBillingHistory } =
        await import('@/modules/import/importService');
      (importBillingHistory as jest.Mock).mockRejectedValue(
        new Error('Redis connection failed at 192.168.1.100:6379')
      );

      const formData = new FormData();
      formData.append('userID', 'user123');
      formData.append(
        'file',
        new File(['test'], 'data.csv', { type: 'text/csv' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      // Should not expose internal IP addresses or connection details
      expect(data.error).toBe('Import failed');
    });
  });

  describe('Response format', () => {
    it('should include sanitized filename in response', async () => {
      const { importBillingHistory } =
        await import('@/modules/import/importService');
      (importBillingHistory as jest.Mock).mockResolvedValue({
        imported: 1,
        skipped: 0,
        errors: []
      });

      const formData = new FormData();
      formData.append('userID', 'user123');
      formData.append(
        'file',
        new File(['test'], '../../../etc/passwd.csv', { type: 'text/csv' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filename).toBeDefined();
      // Filename should be sanitized (no path traversal)
      expect(data.filename).not.toContain('../');
      expect(data.filename).not.toContain('/');
    });

    it('should return JSON content type', async () => {
      const { importBillingHistory } =
        await import('@/modules/import/importService');
      (importBillingHistory as jest.Mock).mockResolvedValue({
        imported: 1,
        skipped: 0,
        errors: []
      });

      const formData = new FormData();
      formData.append('userID', 'user123');
      formData.append(
        'file',
        new File(['test'], 'data.csv', { type: 'text/csv' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });
  });

  describe('File type routing', () => {
    it('should route CSV files to CSV parser', async () => {
      const { importBillingHistory } =
        await import('@/modules/import/importService');
      (importBillingHistory as jest.Mock).mockResolvedValue({
        imported: 1,
        skipped: 0,
        errors: []
      });

      const formData = new FormData();
      formData.append('userID', 'user123');
      formData.append(
        'file',
        new File(['test'], 'data.csv', { type: 'text/csv' })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      await POST(request);

      expect(importBillingHistory).toHaveBeenCalledWith(
        'user123',
        expect.any(String), // CSV content as string
        'csv'
      );
    });

    it('should route XLSX files to XLSX parser', async () => {
      const { importBillingHistory } =
        await import('@/modules/import/importService');
      (importBillingHistory as jest.Mock).mockResolvedValue({
        imported: 1,
        skipped: 0,
        errors: []
      });

      const formData = new FormData();
      formData.append('userID', 'user123');

      const data = [['Description', 'Quantity', 'Rate', 'Date']];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      formData.append(
        'file',
        new File([buffer], 'data.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
      );

      const request = new NextRequest('http://localhost:3000/api/import', {
        method: 'POST',
        body: formData
      });

      await POST(request);

      expect(importBillingHistory).toHaveBeenCalledWith(
        'user123',
        expect.any(Buffer), // XLSX content as Buffer
        'xlsx'
      );
    });
  });
});

// Made with Bob
