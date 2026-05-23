/**
 * Invoice Item Detail API route handler
 * Handles GET, PATCH, DELETE operations for individual invoice items
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getCompanyIDForUser } from '@/lib/db/company';
import {
  getInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
  type UpdateInvoiceItemInput,
} from '@/modules/invoiceItems/invoiceItemService';

/**
 * GET /api/invoice-items/[id]
 * Get a single invoice item master by ID
 *
 * Returns:
 * - 200: { invoiceItem: InvoiceItemMaster }
 * - 401: Unauthorized
 * - 403: Forbidden (invoice item belongs to different company)
 * - 404: Invoice item not found
 * - 500: Server error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get invoice item
    const invoiceItem = await getInvoiceItem(params.id);
    if (!invoiceItem) {
      return NextResponse.json(
        { error: 'Invoice item not found' },
        { status: 404 }
      );
    }

    // Verify invoice item belongs to user's company
    if (invoiceItem.companyID !== companyID) {
      return NextResponse.json(
        { error: 'Forbidden: Invoice item belongs to different company' },
        { status: 403 }
      );
    }

    return NextResponse.json({ invoiceItem }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/invoice-items/${params.id} error:`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get invoice item', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoice-items/[id]
 * Update an invoice item master
 *
 * Request body (all fields optional):
 * - description?: string
 * - defaultRate?: number | null
 *
 * Returns:
 * - 200: { invoiceItem: InvoiceItemMaster }
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 403: Forbidden (invoice item belongs to different company)
 * - 404: Invoice item not found
 * - 500: Server error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get existing invoice item
    const existing = await getInvoiceItem(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice item not found' },
        { status: 404 }
      );
    }

    // Verify invoice item belongs to user's company
    if (existing.companyID !== companyID) {
      return NextResponse.json(
        { error: 'Forbidden: Invoice item belongs to different company' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Build update input (only include provided fields)
    const updates: UpdateInvoiceItemInput = {};
    if (body.description !== undefined) updates.description = body.description;
    if (body.defaultRate !== undefined) updates.defaultRate = body.defaultRate;

    // Update invoice item (service layer validates with Zod)
    const invoiceItem = await updateInvoiceItem(params.id, updates);

    return NextResponse.json({ invoiceItem }, { status: 200 });
  } catch (error) {
    console.error(`PATCH /api/invoice-items/${params.id} error:`, error);

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
      { error: 'Failed to update invoice item', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoice-items/[id]
 * Delete an invoice item master
 * Fails if invoice item has billing history entries
 *
 * Returns:
 * - 204: No content (success)
 * - 400: Cannot delete (has billing history)
 * - 401: Unauthorized
 * - 403: Forbidden (invoice item belongs to different company)
 * - 404: Invoice item not found
 * - 500: Server error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get existing invoice item
    const existing = await getInvoiceItem(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice item not found' },
        { status: 404 }
      );
    }

    // Verify invoice item belongs to user's company
    if (existing.companyID !== companyID) {
      return NextResponse.json(
        { error: 'Forbidden: Invoice item belongs to different company' },
        { status: 403 }
      );
    }

    // Delete invoice item (service layer checks for cascade constraints)
    await deleteInvoiceItem(params.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/invoice-items/${params.id} error:`, error);

    // Handle cascade constraint errors
    if (
      error instanceof Error &&
      error.message.includes('billing history entries exist')
    ) {
      return NextResponse.json(
        { error: 'Cannot delete invoice item', message: error.message },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete invoice item', message: errorMessage },
      { status: 500 }
    );
  }
}

// Made with Bob