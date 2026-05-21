import { NextResponse } from 'next/server';

/**
 * GET /api/import/sample
 * Returns a sample CSV file for billing history import
 */
export async function GET() {
  const sampleCSV = `Description,Quantity,Rate,Date
Web Development Services,40,150.00,2026-05-01
UI/UX Design Consultation,8,200.00,2026-05-05
Database Optimization,16,175.00,2026-05-10
API Integration,24,160.00,2026-05-15
Code Review and Testing,12,140.00,2026-05-20`;

  return new NextResponse(sampleCSV, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="sample-billing-history.csv"'
    }
  });
}

// Made with Bob
