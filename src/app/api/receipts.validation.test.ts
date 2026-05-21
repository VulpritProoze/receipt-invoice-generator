import { POST } from './receipts/route';
import type { NextRequest } from 'next/server';

describe('Receipts POST validation', () => {
  it('accepts total: 0 and returns 201', async () => {
    const payload = {
      vendor: 'Store',
      items: [{ description: 'Item', quantity: 1, price: 50 }],
      total: 0,
      date: '2023-01-01'
    };
    const req = { json: async () => payload, url: 'http://localhost/api/receipts' } as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('returns 400 when required fields missing', async () => {
    const payload = { total: 0 };
    const req = { json: async () => payload, url: 'http://localhost/api/receipts' } as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.missingFields).toBeDefined();
    expect(Array.isArray(body.missingFields)).toBe(true);
  });
});
