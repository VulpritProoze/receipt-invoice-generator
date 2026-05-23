/**
 * Billing Users API route handler
 * Handles CRUD operations for billing users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getCompanyIDForUser } from '@/lib/db/company';
import {
  createBillingUser,
  listBillingUsers,
  type CreateBillingUserInput,
} from '@/modules/billingUsers/billingUserService';

/**
 * GET /api/billing-users
 * List all billing users for the authenticated user's company
 *
 * Returns:
 * - 200: { billingUsers: BillingUser[] }
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

    // List billing users
    const billingUsers = await listBillingUsers(companyID);

    return NextResponse.json({ billingUsers }, { status: 200 });
  } catch (error) {
    console.error('GET /api/billing-users error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to list billing users', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing-users
 * Create a new billing user
 *
 * Request body:
 * - name: string (required)
 * - addressLine: string (required)
 * - cityAddress: string (required)
 * - postalAddress: string (required)
 * - country: string (required)
 *
 * Returns:
 * - 201: { billingUser: BillingUser }
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
    const input: CreateBillingUserInput = {
      name: body.name,
      addressLine: body.addressLine,
      cityAddress: body.cityAddress,
      postalAddress: body.postalAddress,
      country: body.country,
    };

    // Create billing user (service layer validates with Zod)
    const billingUser = await createBillingUser(companyID, input);

    return NextResponse.json({ billingUser }, { status: 201 });
  } catch (error) {
    console.error('POST /api/billing-users error:', error);

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
      { error: 'Failed to create billing user', message: errorMessage },
      { status: 500 }
    );
  }
}

// Made with Bob