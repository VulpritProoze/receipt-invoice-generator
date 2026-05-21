import { NextRequest, NextResponse } from 'next/server';
import {
  createInvoice,
  listUserInvoices
} from '@/modules/invoices/invoiceService';

/**
 * POST /api/invoices - Create a new invoice
 * Request body: Invoice data without invoiceID (will be generated)
 * Response: 201 with created invoice, or 400/500 on error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      'userID',
      'invoiceDate',
      'terms',
      'dueDate',
      'currency',
      'billTo',
      'billToAddressLine',
      'billToCityAddress',
      'billToPostalAddress',
      'billToCountry',
      'invoiceItems',
      'taxRate'
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        body[field] === undefined ||
        body[field] === null ||
        (typeof body[field] === 'string' && body[field].trim() === '')
    );

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
        { error: 'Invoice must contain at least one item' },
        { status: 400 }
      );
    }

    // Create invoice (will generate invoiceID)
    const invoice = await createInvoice(body.userID, {
      invoiceDate: body.invoiceDate,
      terms: body.terms,
      dueDate: body.dueDate,
      currency: body.currency,
      billTo: body.billTo,
      billToAddressLine: body.billToAddressLine,
      billToCityAddress: body.billToCityAddress,
      billToPostalAddress: body.billToPostalAddress,
      billToCountry: body.billToCountry,
      invoiceItems: body.invoiceItems,
      taxRate: body.taxRate
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error creating invoice:', error);

    // Check for specific error types
    if (error instanceof Error) {
      // Zod validation errors
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            error: 'Invalid invoice data',
            details: error.message
          },
          { status: 400 }
        );
      }
    }

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices?userID=xxx - List all invoices for a user
 * Query params: userID (required)
 * Response: 200 with array of invoices, or 400/500 on error
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

    const invoices = await listUserInvoices(userID);

    return NextResponse.json({ invoices }, { status: 200 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error listing invoices:', error);

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to list invoices' },
      { status: 500 }
    );
  }
}

// Made with Bob
