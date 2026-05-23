/**
 * Invoice Items API route handler
 * Handles CRUD operations for invoice item masters (catalog)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getCompanyIDForUser } from '@/lib/db/company';
import {
  createInvoiceItem,
  listInvoiceItems,
  type CreateInvoiceItemInput,
} from '@/modules/invoiceItems/invoiceItemService';

/**
 * GET /api/invoice-items
 * List all invoice item masters for the authenticated user's company
 *
 * Returns:
 * - 200: { invoiceItems: InvoiceItemMaster[] }
 * - 401: Unauthorized
 * - 404: Company not found
 * - 500: Server error
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const userID = await getCurrentUserId();
    if (!userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company ID for user
    const companyID = await getCompanyIDForUser(userID);
    if (!companyID) {
      return NextResponse.json(
        { error: 'Company not found for user' },
        { status: 404 }
      );
    }

    // List invoice items
    const invoiceItems = await listInvoiceItems(companyID);

    return NextResponse.json({ invoiceItems }, { status: 200 });
  } catch (error) {
    console.error('GET /api/invoice-items error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to list invoice items', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoice-items
 * Create a new invoice item master
 *
 * Request body:
 * - description: string (required)
 * - defaultRate: number | null (optional)
 *
 * Returns:
 * - 201: { invoiceItem: InvoiceItemMaster }
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 404: Company not found
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const userID = await getCurrentUserId();
    if (!userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company ID for user
    const companyID = await getCompanyIDForUser(userID);
    if (!companyID) {
      return NextResponse.json(
        { error: 'Company not found for user' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    const input: CreateInvoiceItemInput = {
      description: body.description,
      defaultRate: body.defaultRate ?? null,
    };

    // Create invoice item (service layer validates with Zod)
    const invoiceItem = await createInvoiceItem(companyID, input);

    return NextResponse.json({ invoiceItem }, { status: 201 });
  } catch (error) {
    console.error('POST /api/invoice-items error:', error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid request body', message: error.message },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create invoice item', message: errorMessage },
      { status: 500 }
    );
  }
}

// Made with Bob