/**
 * Import Create Items API route handler
 * Handles creation of missing invoice items during import flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getCompanyIDForUser } from '@/lib/db/company';
import {
  createInvoiceItem,
  type CreateInvoiceItemInput,
} from '@/modules/invoiceItems/invoiceItemService';

/**
 * POST /api/import/create-items
 * Create multiple invoice item masters from unmatched import items
 *
 * Request body:
 * - items: Array<{ description: string, defaultRate?: number | null }>
 *
 * Returns:
 * - 201: { created: number, invoiceItems: InvoiceItemMaster[] }
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

    // Validate items array
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Create all invoice items
    const createdItems = [];
    const errors = [];

    for (const item of body.items) {
      try {
        // Validate item structure
        if (!item.description || typeof item.description !== 'string') {
          errors.push({
            description: item.description || 'unknown',
            error: 'description is required and must be a string',
          });
          continue;
        }

        const input: CreateInvoiceItemInput = {
          description: item.description,
          defaultRate: item.defaultRate ?? null,
        };

        // Create invoice item (service layer validates with Zod)
        const invoiceItem = await createInvoiceItem(companyID, input);
        createdItems.push(invoiceItem);
      } catch (error) {
        console.error(
          `Failed to create invoice item: ${item.description}`,
          error
        );
        errors.push({
          description: item.description,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Return results
    return NextResponse.json(
      {
        created: createdItems.length,
        invoiceItems: createdItems,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/import/create-items error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create invoice items', message: errorMessage },
      { status: 500 }
    );
  }
}

// Made with Bob