import { NextRequest, NextResponse } from 'next/server';
import {
  createInvoice,
  listBillingUserInvoices
} from '@/modules/invoices/invoiceService';
import { invoiceCreateRequestSchema } from '@/schemas';
import { getCurrentUserId } from '@/lib/auth';
import { getCompanyIDForUser } from '@/lib/db/company';
import { listBillingUsers } from '@/modules/billingUsers/billingUserService';

/**
 * POST /api/invoices - Create a new invoice from billing history
 * Request body: { billingUserID, billingHistoryIDs, invoiceDate, terms, dueDate, currency, taxRate }
 * Response: 201 with created invoice, or 400/401/500 on error
 */
export async function POST(req: NextRequest) {
  try {
    const userID = await getCurrentUserId();
    if (!userID) {
      return NextResponse.json(
        { error: 'User must be authenticated' },
        { status: 401 }
      );
    }

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

    const { billingUserID, billingHistoryIDs, ...invoiceData } = result.data;

    // Create invoice from billing history
    const invoice = await createInvoice(billingUserID, billingHistoryIDs, invoiceData);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);

    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid invoice data', details: error.message },
          { status: 400 }
        );
      }
      // Known business errors
      if (
        error.message.includes('not found') ||
        error.message.includes('already billed') ||
        error.message.includes('does not belong')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices?billingUserID=xxx - List all invoices
 * Query params: billingUserID (optional - filters to a specific billing user)
 * If omitted, lists all invoices across all billing users for the company.
 * Response: 200 with array of invoices, or 401/500 on error
 */
export async function GET(req: NextRequest) {
  try {
    const userID = await getCurrentUserId();
    if (!userID) {
      return NextResponse.json(
        { error: 'User must be authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const billingUserID = searchParams.get('billingUserID');

    if (billingUserID) {
      // Return invoices for a specific billing user
      const invoices = await listBillingUserInvoices(billingUserID);
      return NextResponse.json({ invoices }, { status: 200 });
    }

    // Return invoices for all billing users in the company
    const companyID = await getCompanyIDForUser(userID);
    if (!companyID) {
      return NextResponse.json({ invoices: [] }, { status: 200 });
    }

    const billingUsers = await listBillingUsers(companyID);
    const allInvoicesNested = await Promise.all(
      billingUsers.map((bu) => listBillingUserInvoices(bu.billingUserID))
    );
    const invoices = allInvoicesNested
      .flat()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ invoices }, { status: 200 });
  } catch (error) {
    console.error('Error listing invoices:', error);
    return NextResponse.json(
      { error: 'Failed to list invoices' },
      { status: 500 }
    );
  }
}

// Made with Bob
