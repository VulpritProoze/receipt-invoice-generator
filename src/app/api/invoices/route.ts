import { NextRequest, NextResponse } from 'next/server';
import {
  createInvoice,
  listUserInvoices
} from '@/modules/invoices/invoiceService';
import { invoiceCreateRequestSchema } from '@/schemas';

/**
 * POST /api/invoices - Create a new invoice
 * Request body: Invoice data without invoiceID (will be generated)
 * Response: 201 with created invoice, or 400/500 on error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body using centralized schema
    const result = invoiceCreateRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid invoice data',
          details: result.error.flatten()
        },
        { status: 400 }
      );
    }

    // Create invoice with validated data (will generate invoiceID)
    const validatedData = result.data;
    const invoice = await createInvoice(validatedData.userID, {
      invoiceDate: validatedData.invoiceDate,
      terms: validatedData.terms,
      dueDate: validatedData.dueDate,
      currency: validatedData.currency,
      billTo: validatedData.billTo,
      billToAddressLine: validatedData.billToAddressLine,
      billToCityAddress: validatedData.billToCityAddress,
      billToPostalAddress: validatedData.billToPostalAddress,
      billToCountry: validatedData.billToCountry,
      invoiceItems: validatedData.invoiceItems,
      taxRate: validatedData.taxRate
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
