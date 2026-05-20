/**
 * Receipt PDF Generation API Route
 * 
 * GET /api/reports/receipt/[receiptID]?userID=xxx
 * 
 * Generates and returns a receipt PDF for download.
 * 
 * Query Parameters:
 * - userID (required): The user requesting the receipt
 * 
 * Response:
 * - 200: PDF file with Content-Type: application/pdf and Content-Disposition: attachment
 * - 400: Missing or invalid parameters
 * - 404: Receipt or related invoice not found
 * - 403: User does not own the receipt
 * - 500: Server error during PDF generation
 * 
 * Security:
 * - Validates user ownership of receipt
 * - Loads invoice from database (never accepts from request body)
 * - Requires complete company configuration
 * - Never exposes internal error details in response
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateReceiptReport } from '@/modules/reports/reportService';

// Force Node.js runtime for PDFKit compatibility
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ receiptID: string }> },
) {
  try {
    const { receiptID } = await params;
    const { searchParams } = new URL(request.url);
    const userID = searchParams.get('userID');

    // Validate required parameters
    if (!userID) {
      return NextResponse.json({ error: 'userID query parameter is required' }, { status: 400 });
    }

    if (!receiptID) {
      return NextResponse.json({ error: 'receiptID is required' }, { status: 400 });
    }

    // Generate PDF (service layer handles invoice loading from database)
    const pdfBuffer = await generateReceiptReport(userID, receiptID);

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${receiptID}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    // Log detailed error server-side
    console.error('Receipt PDF generation error:', error);

    // Determine appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Receipt or related invoice not found' },
        { status: 404 },
      );
    }

    if (errorMessage.includes('Unauthorized') || errorMessage.includes('does not belong')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (errorMessage.includes('onboarding') || errorMessage.includes('configuration')) {
      return NextResponse.json(
        { error: 'Company configuration incomplete. Please complete onboarding first.' },
        { status: 400 },
      );
    }

    // Generic error response (never expose internal details)
    return NextResponse.json({ error: 'Failed to generate receipt PDF' }, { status: 500 });
  }
}

// Made with Bob
