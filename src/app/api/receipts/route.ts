import { NextRequest, NextResponse } from 'next/server';
import {
  createReceipt,
  listUserReceipts
} from '@/modules/receipts/receiptService';
import { getCurrentUserId } from '@/lib/auth';
import { createReceipt as dbCreateReceipt } from '@/lib/db/receipts';
import { generateReceiptID, generateInvoiceID } from '@/lib/idGenerator';
import { getUser } from '@/lib/db/users';
import { receiptCreateRequestSchema } from '@/schemas';

/**
 * POST /api/receipts - Create a new receipt (from invoice or standalone)
 * Uses current user from auth when available, falls back to demo-user-001.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userID = (await getCurrentUserId()) || 'demo-user-001';

    // Validate request body using centralized schema
    const result = receiptCreateRequestSchema.safeParse({
      ...body,
      userID // Add userID to validation payload
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid receipt data',
          details: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // If invoiceID provided, use service which enforces invoice existence
    if (validatedData.invoiceID) {
      const receipt = await createReceipt(userID, {
        date: validatedData.date,
        invoiceID: validatedData.invoiceID,
        invoiceItems: validatedData.invoiceItems || [],
        total: validatedData.total
      });
      return NextResponse.json(receipt, { status: 201 });
    }

    // Standalone receipt - build minimal receipt object and store directly
    const user = await getUser(userID);
    const receiptID = generateReceiptID();
    const createdAt = new Date().toISOString().split('T')[0];
    const invoiceID = generateInvoiceID(1);

    const receiptObj = {
      receiptID,
      date: validatedData.date,
      accountBilled: user ? `${user.username} (${user.userEmail})` : 'Unknown',
      invoiceID,
      invoiceItems: validatedData.invoiceItems || [
        {
          itemID: 'item-001',
          description: 'Standalone receipt',
          quantity: 1,
          rate: validatedData.total,
          date: validatedData.date
        }
      ],
      total: validatedData.total,
      chargedTo: user ? `${user.creditCardType} ${user.creditCardNumber}` : '—',
      userID,
      createdAt
    };

    // Store using DB helper (it validates via schema)
    await dbCreateReceipt(userID, receiptObj);

    return NextResponse.json(receiptObj, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);

    if (error instanceof Error) {
      if (error.message === 'Invoice not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid receipt data', details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/receipts - List all receipts for the current user
 */
export async function GET(_req: NextRequest) {
  try {
    const userID = (await getCurrentUserId()) || 'demo-user-001';

    const receipts = await listUserReceipts(userID);

    return NextResponse.json({ receipts }, { status: 200 });
  } catch (error) {
    console.error('Error listing receipts:', error);
    return NextResponse.json(
      { error: 'Failed to list receipts' },
      { status: 500 }
    );
  }
}

// Made with Bob
