import { NextRequest, NextResponse } from 'next/server';
import {
  createReceipt,
  listUserReceipts
} from '@/modules/receipts/receiptService';

/**
 * POST /api/receipts - Create a new receipt from an invoice
 * Request body: Receipt data without receiptID (will be generated)
 * Response: 201 with created receipt, or 400/500 on error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      'userID',
      'date',
      'invoiceID',
      'invoiceItems',
      'total'
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: { missingFields }
        },
        { status: 400 }
      );
    }

    // Validate invoice items array
    if (!Array.isArray(body.invoiceItems) || body.invoiceItems.length === 0) {
      return NextResponse.json(
        { error: 'Receipt must contain at least one item' },
        { status: 400 }
      );
    }

    // Create receipt (will generate receiptID and validate invoice exists)
    const receipt = await createReceipt(body.userID, {
      date: body.date,
      invoiceID: body.invoiceID,
      invoiceItems: body.invoiceItems,
      total: body.total
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error creating receipt:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message === 'Invoice not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.message === 'Receipt already exists for this invoice') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.message === 'User not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      // Zod validation errors
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            error: 'Invalid receipt data',
            details: error.message
          },
          { status: 400 }
        );
      }
    }

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/receipts?userID=xxx - List all receipts for a user
 * Query params: userID (required)
 * Response: 200 with array of receipts, or 400/500 on error
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

    const receipts = await listUserReceipts(userID);

    return NextResponse.json({ receipts }, { status: 200 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error listing receipts:', error);

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to list receipts' },
      { status: 500 }
    );
  }
}

// Made with Bob
