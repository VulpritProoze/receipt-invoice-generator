/**
 * Contract tests for Receipt PDF API Route
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

describe('GET /api/reports/receipt/[receiptID]', () => {
  const mockPDFBuffer = Buffer.from('mock-pdf-content');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return PDF with correct headers when request is valid', async () => {
    (reportService.generateReceiptReport as jest.Mock).mockResolvedValue(
      mockPDFBuffer
    );

    const request = new NextRequest(
      'http://localhost/api/reports/receipt/CH_A3K9MXQP2T7VWRJN5?userID=user123'
    );
    const params = Promise.resolve({ receiptID: 'CH_A3K9MXQP2T7VWRJN5' });

    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="CH_A3K9MXQP2T7VWRJN5.pdf"'
    );
    expect(response.headers.get('Content-Length')).toBe(
      mockPDFBuffer.length.toString()
    );

    const body = await response.arrayBuffer();
    expect(Buffer.from(body)).toEqual(mockPDFBuffer);

    expect(reportService.generateReceiptReport).toHaveBeenCalledWith(
      'user123',
      'CH_A3K9MXQP2T7VWRJN5'
    );
  });

  it('should return 400 when userID is missing', async () => {
    const request = new NextRequest(
      'http://localhost/api/reports/receipt/CH_A3K9MXQP2T7VWRJN5'
    );
    const params = Promise.resolve({ receiptID: 'CH_A3K9MXQP2T7VWRJN5' });

    const response = await GET(request, { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'userID query parameter is required' });

    expect(reportService.generateReceiptReport).not.toHaveBeenCalled();
  });

  it('should return 400 when receiptID is missing', async () => {
    const request = new NextRequest(
      'http://localhost/api/reports/receipt/?userID=user123'
    );
    const params = Promise.resolve({ receiptID: '' });

    const response = await GET(request, { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'receiptID is required' });

    expect(reportService.generateReceiptReport).not.toHaveBeenCalled();
  });

  it('should return 404 when receipt not found', async () => {
    (reportService.generateReceiptReport as jest.Mock).mockRejectedValue(
      new Error('Receipt not found')
    );

    const request = new NextRequest(
      'http://localhost/api/reports/receipt/CH_A3K9MXQP2T7VWRJN5?userID=user123'
    );
    const params = Promise.resolve({ receiptID: 'CH_A3K9MXQP2T7VWRJN5' });

    const response = await GET(request, { params });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Receipt or related invoice not found' });
  });

  it('should return 404 when related invoice not found', async () => {
    (reportService.generateReceiptReport as jest.Mock).mockRejectedValue(
      new Error('Related invoice not found')
    );

    const request = new NextRequest(
      'http://localhost/api/reports/receipt/CH_A3K9MXQP2T7VWRJN5?userID=user123'
    );
    const params = Promise.resolve({ receiptID: 'CH_A3K9MXQP2T7VWRJN5' });

    const response = await GET(request, { params });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Receipt or related invoice not found' });
  });

  it('should return 403 when user does not own receipt', async () => {
    (reportService.generateReceiptReport as jest.Mock).mockRejectedValue(
      new Error('Unauthorized: Receipt does not belong to this user')
    );

    const request = new NextRequest(
      'http://localhost/api/reports/receipt/CH_A3K9MXQP2T7VWRJN5?userID=user123'
    );
    const params = Promise.resolve({ receiptID: 'CH_A3K9MXQP2T7VWRJN5' });

    const response = await GET(request, { params });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 403 when user does not own related invoice', async () => {
    (reportService.generateReceiptReport as jest.Mock).mockRejectedValue(
      new Error('Unauthorized: Invoice does not belong to this user')
    );

    const request = new NextRequest(
      'http://localhost/api/reports/receipt/CH_A3K9MXQP2T7VWRJN5?userID=user123'
    );
    const params = Promise.resolve({ receiptID: 'CH_A3K9MXQP2T7VWRJN5' });

    const response = await GET(request, { params });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 when company configuration is incomplete', async () => {
    (reportService.generateReceiptReport as jest.Mock).mockRejectedValue(
      new Error(
        'Company configuration incomplete. Please complete onboarding first.'
      )
    );

    const request = new NextRequest(
      'http://localhost/api/reports/receipt/CH_A3K9MXQP2T7VWRJN5?userID=user123'
    );
    const params = Promise.resolve({ receiptID: 'CH_A3K9MXQP2T7VWRJN5' });

    const response = await GET(request, { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error:
        'Company configuration incomplete. Please complete onboarding first.'
    });
  });

  it('should return 500 for unexpected errors', async () => {
    (reportService.generateReceiptReport as jest.Mock).mockRejectedValue(
      new Error('Unexpected database error')
    );

    const request = new NextRequest(
      'http://localhost/api/reports/receipt/CH_A3K9MXQP2T7VWRJN5?userID=user123'
    );
    const params = Promise.resolve({ receiptID: 'CH_A3K9MXQP2T7VWRJN5' });

    const response = await GET(request, { params });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Failed to generate receipt PDF' });
  });

  it('should handle non-Error exceptions', async () => {
    (reportService.generateReceiptReport as jest.Mock).mockRejectedValue(
      'string error'
    );

    const request = new NextRequest(
      'http://localhost/api/reports/receipt/CH_A3K9MXQP2T7VWRJN5?userID=user123'
    );
    const params = Promise.resolve({ receiptID: 'CH_A3K9MXQP2T7VWRJN5' });

    const response = await GET(request, { params });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Failed to generate receipt PDF' });
  });
});

// Made with Bob
