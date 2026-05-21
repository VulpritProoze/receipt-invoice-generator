import { NextRequest, NextResponse } from 'next/server';
import { listInvoiceItems } from '@/lib/db/invoices';

/**
 * GET /api/invoices/items
 * Fetches all invoice items for a user
 * Query params:
 * - userID: User ID (required)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userID = searchParams.get('userID');

    if (!userID) {
      return NextResponse.json(
        { error: 'userID query parameter is required' },
        { status: 400 }
      );
    }

    const items = await listInvoiceItems(userID);

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice items' },
      { status: 500 }
    );
  }
}

// Made with Bob
