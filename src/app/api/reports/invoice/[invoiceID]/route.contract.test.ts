/**
 * Contract tests for Invoice PDF API Route
 *
 * Tests the API contract:
 * - Request parameters and validation
 * - Response status codes
 * - Response headers
 * - Error handling
 */

import { GET } from './route';
import { NextRequest } from 'next/server';
import * as reportService from '@/modules/reports/reportService';

jest.mock('@/modules/reports/reportService');

describe('GET /api/reports/invoice/[invoiceID]', () => {
  const mockPDFBuffer = Buffer.from('mock-pdf-content');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return PDF with correct headers when request is valid', async () => {
    (reportService.generateInvoiceReport as jest.Mock).mockResolvedValue(
      mockPDFBuffer
    );

    const request = new NextRequest(
      'http://localhost/api/reports/invoice/INV000000001?userID=user123'
    );
    const params = Promise.resolve({ invoiceID: 'INV000000001' });

    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="INV000000001.pdf"'
    );
    expect(response.headers.get('Content-Length')).toBe(
      mockPDFBuffer.length.toString()
    );

    const body = await response.arrayBuffer();
    expect(Buffer.from(body)).toEqual(mockPDFBuffer);

    expect(reportService.generateInvoiceReport).toHaveBeenCalledWith(
      'user123',
      'INV000000001'
    );
  });

  it('should return 400 when userID is missing', async () => {
    const request = new NextRequest(
      'http://localhost/api/reports/invoice/INV000000001'
    );
    const params = Promise.resolve({ invoiceID: 'INV000000001' });

    const response = await GET(request, { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'userID query parameter is required' });

    expect(reportService.generateInvoiceReport).not.toHaveBeenCalled();
  });

  it('should return 400 when invoiceID is missing', async () => {
    const request = new NextRequest(
      'http://localhost/api/reports/invoice/?userID=user123'
    );
    const params = Promise.resolve({ invoiceID: '' });

    const response = await GET(request, { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'invoiceID is required' });

    expect(reportService.generateInvoiceReport).not.toHaveBeenCalled();
  });

  it('should return 404 when invoice not found', async () => {
    (reportService.generateInvoiceReport as jest.Mock).mockRejectedValue(
      new Error('Invoice not found')
    );

    const request = new NextRequest(
      'http://localhost/api/reports/invoice/INV000000001?userID=user123'
    );
    const params = Promise.resolve({ invoiceID: 'INV000000001' });

    const response = await GET(request, { params });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Invoice not found' });
  });

  it('should return 403 when user does not own invoice', async () => {
    (reportService.generateInvoiceReport as jest.Mock).mockRejectedValue(
      new Error('Unauthorized: Invoice does not belong to this user')
    );

    const request = new NextRequest(
      'http://localhost/api/reports/invoice/INV000000001?userID=user123'
    );
    const params = Promise.resolve({ invoiceID: 'INV000000001' });

    const response = await GET(request, { params });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 when company configuration is incomplete', async () => {
    (reportService.generateInvoiceReport as jest.Mock).mockRejectedValue(
      new Error(
        'Company configuration incomplete. Please complete onboarding first.'
      )
    );

    const request = new NextRequest(
      'http://localhost/api/reports/invoice/INV000000001?userID=user123'
    );
    const params = Promise.resolve({ invoiceID: 'INV000000001' });

    const response = await GET(request, { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error:
        'Company configuration incomplete. Please complete onboarding first.'
    });
  });

  it('should return 500 for unexpected errors', async () => {
    (reportService.generateInvoiceReport as jest.Mock).mockRejectedValue(
      new Error('Unexpected database error')
    );

    const request = new NextRequest(
      'http://localhost/api/reports/invoice/INV000000001?userID=user123'
    );
    const params = Promise.resolve({ invoiceID: 'INV000000001' });

    const response = await GET(request, { params });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Failed to generate invoice PDF' });
  });

  it('should handle non-Error exceptions', async () => {
    (reportService.generateInvoiceReport as jest.Mock).mockRejectedValue(
      'string error'
    );

    const request = new NextRequest(
      'http://localhost/api/reports/invoice/INV000000001?userID=user123'
    );
    const params = Promise.resolve({ invoiceID: 'INV000000001' });

    const response = await GET(request, { params });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Failed to generate invoice PDF' });
  });
});

// Made with Bob
