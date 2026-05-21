import { NextRequest, NextResponse } from 'next/server';
import {
  getInvoice,
  updateInvoice,
  deleteInvoice
} from '@/modules/invoices/invoiceService';

/**
 * GET /api/invoices/[invoiceID]?userID=xxx - Get invoice by ID
 * Query params: userID (required)
 * Response: 200 with invoice, 404 if not found, 400 if userID missing, or 500 on error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceID: string }> }
) {
  try {
    const { invoiceID } = await params;
    const { searchParams } = new URL(req.url);
    const userID = searchParams.get('userID');

    if (!userID) {
      return NextResponse.json(
        { error: 'userID query parameter is required' },
        { status: 400 }
      );
    }

    const invoice = await getInvoice(userID, invoiceID);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice, { status: 200 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error getting invoice:', error);

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to get invoice' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices/[invoiceID]?userID=xxx - Update invoice
 * Query params: userID (required)
 * Request body: Partial invoice data (fields to update)
 * Response: 200 with updated invoice, 404 if not found, 400 on validation error, or 500 on error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceID: string }> }
) {
  try {
    const { invoiceID } = await params;
    const { searchParams } = new URL(req.url);
    const userID = searchParams.get('userID');

    if (!userID) {
      return NextResponse.json(
        { error: 'userID query parameter is required' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Don't allow updating invoiceID, userID, or createdAt
    if (body.invoiceID || body.userID || body.createdAt) {
      return NextResponse.json(
        { error: 'Cannot update invoiceID, userID, or createdAt' },
        { status: 400 }
      );
    }

    const updatedInvoice = await updateInvoice(userID, invoiceID, body);

    return NextResponse.json(updatedInvoice, { status: 200 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error updating invoice:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message === 'Invoice not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

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
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[invoiceID]?userID=xxx - Delete invoice
 * Query params: userID (required)
 * Response: 200 on success, 400 if userID missing, or 500 on error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceID: string }> }
) {
  try {
    const { invoiceID } = await params;
    const { searchParams } = new URL(req.url);
    const userID = searchParams.get('userID');

    if (!userID) {
      return NextResponse.json(
        { error: 'userID query parameter is required' },
        { status: 400 }
      );
    }

    await deleteInvoice(userID, invoiceID);

    return NextResponse.json(
      { message: 'Invoice deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Log error server-side with context
    console.error('Error deleting invoice:', error);

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}

// Made with Bob
