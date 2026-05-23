import { NextRequest, NextResponse } from 'next/server';
import {
  getInvoice,
  updateInvoice,
  deleteInvoice
} from '@/modules/invoices/invoiceService';
import { getCurrentUserId } from '@/lib/auth';
import { getInvoiceByID } from '@/lib/db/invoices';

/**
 * GET /api/invoices/[invoiceID]?billingUserID=xxx - Get invoice by ID
 * Query params: billingUserID (optional - uses invoice lookup by ID if omitted)
 * Response: 200 with invoice, 404 if not found, 401 if unauthenticated, or 500 on error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceID: string }> }
) {
  try {
    const userID = await getCurrentUserId();
    if (!userID) {
      return NextResponse.json(
        { error: 'User must be authenticated' },
        { status: 401 }
      );
    }

    const { invoiceID } = await params;
    const { searchParams } = new URL(req.url);
    const billingUserID = searchParams.get('billingUserID');

    let invoice;
    if (billingUserID) {
      invoice = await getInvoice(billingUserID, invoiceID);
    } else {
      // Lookup by invoiceID alone when billingUserID not provided
      invoice = await getInvoiceByID(invoiceID);
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice, { status: 200 });
  } catch (error) {
    console.error('Error getting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to get invoice' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices/[invoiceID]?billingUserID=xxx - Update invoice metadata
 * Query params: billingUserID (required)
 * Request body: Partial invoice metadata (invoiceDate, terms, dueDate, currency, taxRate)
 * Response: 200 with updated invoice, 404 if not found, 400/401/500 on error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceID: string }> }
) {
  try {
    const userID = await getCurrentUserId();
    if (!userID) {
      return NextResponse.json(
        { error: 'User must be authenticated' },
        { status: 401 }
      );
    }

    const { invoiceID } = await params;
    const { searchParams } = new URL(req.url);
    const billingUserID = searchParams.get('billingUserID');

    if (!billingUserID) {
      return NextResponse.json(
        { error: 'billingUserID query parameter is required' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Don't allow updating immutable fields
    if (body.invoiceID || body.billingUserID || body.createdAt || body.invoiceItems) {
      return NextResponse.json(
        { error: 'Cannot update invoiceID, billingUserID, createdAt, or invoiceItems' },
        { status: 400 }
      );
    }

    const updatedInvoice = await updateInvoice(billingUserID, invoiceID, body);

    return NextResponse.json(updatedInvoice, { status: 200 });
  } catch (error) {
    console.error('Error updating invoice:', error);

    if (error instanceof Error) {
      if (error.message === 'Invoice not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid invoice data', details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[invoiceID]?billingUserID=xxx - Delete invoice
 * Also restores billing history entries to unbilled status.
 * Query params: billingUserID (required)
 * Response: 200 on success, 401/400/500 on error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceID: string }> }
) {
  try {
    const userID = await getCurrentUserId();
    if (!userID) {
      return NextResponse.json(
        { error: 'User must be authenticated' },
        { status: 401 }
      );
    }

    const { invoiceID } = await params;
    const { searchParams } = new URL(req.url);
    const billingUserID = searchParams.get('billingUserID');

    if (!billingUserID) {
      return NextResponse.json(
        { error: 'billingUserID query parameter is required' },
        { status: 400 }
      );
    }

    await deleteInvoice(billingUserID, invoiceID);

    return NextResponse.json(
      { message: 'Invoice deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}

// Made with Bob
