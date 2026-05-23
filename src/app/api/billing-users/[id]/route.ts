/**
 * Billing User Detail API route handler
 * Handles GET, PATCH, DELETE operations for individual billing users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getCompanyIDForUser } from '@/lib/db/company';
import {
  getBillingUser,
  updateBillingUser,
  deleteBillingUser,
  type UpdateBillingUserInput,
} from '@/modules/billingUsers/billingUserService';

/**
 * GET /api/billing-users/[id]
 * Get a single billing user by ID
 *
 * Returns:
 * - 200: { billingUser: BillingUser }
 * - 401: Unauthorized
 * - 403: Forbidden (billing user belongs to different company)
 * - 404: Billing user not found
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

    // Get billing user
    const billingUser = await getBillingUser(params.id);
    if (!billingUser) {
      return NextResponse.json(
        { error: 'Billing user not found' },
        { status: 404 }
      );
    }

    // Verify billing user belongs to user's company
    if (billingUser.companyID !== companyID) {
      return NextResponse.json(
        { error: 'Forbidden: Billing user belongs to different company' },
        { status: 403 }
      );
    }

    return NextResponse.json({ billingUser }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/billing-users/${params.id} error:`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get billing user', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/billing-users/[id]
 * Update a billing user
 *
 * Request body (all fields optional):
 * - name?: string
 * - addressLine?: string
 * - cityAddress?: string
 * - postalAddress?: string
 * - country?: string
 *
 * Returns:
 * - 200: { billingUser: BillingUser }
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 403: Forbidden (billing user belongs to different company)
 * - 404: Billing user not found
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

    // Get existing billing user
    const existing = await getBillingUser(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Billing user not found' },
        { status: 404 }
      );
    }

    // Verify billing user belongs to user's company
    if (existing.companyID !== companyID) {
      return NextResponse.json(
        { error: 'Forbidden: Billing user belongs to different company' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Build update input (only include provided fields)
    const updates: UpdateBillingUserInput = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.addressLine !== undefined) updates.addressLine = body.addressLine;
    if (body.cityAddress !== undefined) updates.cityAddress = body.cityAddress;
    if (body.postalAddress !== undefined)
      updates.postalAddress = body.postalAddress;
    if (body.country !== undefined) updates.country = body.country;

    // Update billing user (service layer validates with Zod)
    const billingUser = await updateBillingUser(params.id, updates);

    return NextResponse.json({ billingUser }, { status: 200 });
  } catch (error) {
    console.error(`PATCH /api/billing-users/${params.id} error:`, error);

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
      { error: 'Failed to update billing user', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing-users/[id]
 * Delete a billing user
 * Fails if billing user has billing history entries
 *
 * Returns:
 * - 204: No content (success)
 * - 400: Cannot delete (has billing history)
 * - 401: Unauthorized
 * - 403: Forbidden (billing user belongs to different company)
 * - 404: Billing user not found
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

    // Get existing billing user
    const existing = await getBillingUser(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Billing user not found' },
        { status: 404 }
      );
    }

    // Verify billing user belongs to user's company
    if (existing.companyID !== companyID) {
      return NextResponse.json(
        { error: 'Forbidden: Billing user belongs to different company' },
        { status: 403 }
      );
    }

    // Delete billing user (service layer checks for cascade constraints)
    await deleteBillingUser(params.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/billing-users/${params.id} error:`, error);

    // Handle cascade constraint errors
    if (
      error instanceof Error &&
      error.message.includes('billing history entries exist')
    ) {
      return NextResponse.json(
        { error: 'Cannot delete billing user', message: error.message },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete billing user', message: errorMessage },
      { status: 500 }
    );
  }
}

// Made with Bob