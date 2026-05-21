import { NextRequest, NextResponse } from 'next/server';
import { getReceipt, deleteReceipt } from '@/modules/receipts/receiptService';
import { getCurrentUserId } from '@/lib/auth';

/**
 * GET /api/receipts/[receiptID] - Get receipt by ID for current user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ receiptID: string }> }
) {
  try {
    const { receiptID } = await params;
    const userID = (await getCurrentUserId()) || 'demo-user-001';

    const receipt = await getReceipt(userID, receiptID);

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json(receipt, { status: 200 });
  } catch (error) {
    console.error('Error getting receipt:', error);
    return NextResponse.json(
      { error: 'Failed to get receipt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/receipts/[receiptID] - Delete receipt for current user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ receiptID: string }> }
) {
  try {
    const { receiptID } = await params;
    const userID = (await getCurrentUserId()) || 'demo-user-001';

    await deleteReceipt(userID, receiptID);

    return NextResponse.json(
      { message: 'Receipt deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
      { error: 'Failed to delete receipt' },
      { status: 500 }
    );
  }
}

// Made with Bob
