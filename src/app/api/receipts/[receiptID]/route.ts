import { NextRequest, NextResponse } from 'next/server';
import { getReceipt, deleteReceipt } from '@/modules/receipts/receiptService';

/**
 * GET /api/receipts/[receiptID]?userID=xxx - Get receipt by ID
 * Query params: userID (required)
 * Response: 200 with receipt, 404 if not found, 400 if userID missing, or 500 on error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ receiptID: string }> }
) {
  try {
    const { receiptID } = await params;
    const { searchParams } = new URL(req.url);
    const userID = searchParams.get('userID');

    if (!userID) {
      return NextResponse.json(
        { error: 'userID query parameter is required' },
        { status: 400 }
      );
    }

    const receipt = await getReceipt(userID, receiptID);

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json(receipt, { status: 200 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error getting receipt:', error);

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to get receipt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/receipts/[receiptID]?userID=xxx - Delete receipt
 * Query params: userID (required)
 * Response: 200 on success, 400 if userID missing, or 500 on error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ receiptID: string }> }
) {
  try {
    const { receiptID } = await params;
    const { searchParams } = new URL(req.url);
    const userID = searchParams.get('userID');

    if (!userID) {
      return NextResponse.json(
        { error: 'userID query parameter is required' },
        { status: 400 }
      );
    }

    await deleteReceipt(userID, receiptID);

    return NextResponse.json(
      { message: 'Receipt deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Log error server-side with context
    console.error('Error deleting receipt:', error);

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to delete receipt' },
      { status: 500 }
    );
  }
}

// Made with Bob
