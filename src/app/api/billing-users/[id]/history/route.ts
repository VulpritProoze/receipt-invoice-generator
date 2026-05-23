/**
 * Billing History API route handler
 * Handles GET operations for billing history scoped to a billing user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getCompanyIDForUser } from '@/lib/db/company';
import { getBillingUser } from '@/modules/billingUsers/billingUserService';
import {
  getBillingHistoryForUser,
  type BillingHistoryFilters,
} from '@/modules/billingHistory/billingHistoryService';

/**
 * GET /api/billing-users/[id]/history
 * Get billing history for a specific billing user with optional filters
 *
 * Query parameters (all optional):
 * - startDate: string (YYYY-MM-DD) - filter entries >= this date
 * - endDate: string (YYYY-MM-DD) - filter entries <= this date
 * - billedStatus: 'unbilled' | 'billed' - filter by billed status
 * - invoiceItemID: string - filter by specific invoice item
 *
 * Returns:
 * - 200: { billingHistory: BillingHistory[] }
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const filters: BillingHistoryFilters = {};

    const startDate = searchParams.get('startDate');
    if (startDate) filters.startDate = startDate;

    const endDate = searchParams.get('endDate');
    if (endDate) filters.endDate = endDate;

    const billedStatus = searchParams.get('billedStatus');
    if (billedStatus === 'unbilled' || billedStatus === 'billed') {
      filters.billedStatus = billedStatus;
    }

    const invoiceItemID = searchParams.get('invoiceItemID');
    if (invoiceItemID) filters.invoiceItemID = invoiceItemID;

    // Get billing history
    const billingHistory = await getBillingHistoryForUser(params.id, filters);

    return NextResponse.json({ billingHistory }, { status: 200 });
  } catch (error) {
    console.error(
      `GET /api/billing-users/${params.id}/history error:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get billing history', message: errorMessage },
      { status: 500 }
    );
  }
}

// Made with Bob