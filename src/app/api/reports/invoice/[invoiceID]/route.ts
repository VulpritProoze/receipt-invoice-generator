/**
 * Invoice PDF Generation API Route
 *
 * GET /api/reports/invoice/[invoiceID]?userID=xxx
 *
 * Generates and returns an invoice PDF for download.
 *
 * Query Parameters:
 * - userID (required): The user requesting the invoice
 *
 * Response:
 * - 200: PDF file with Content-Type: application/pdf and Content-Disposition: attachment
 * - 400: Missing or invalid parameters
 * - 404: Invoice not found
 * - 403: User does not own the invoice
 * - 500: Server error during PDF generation
 *
 * Security:
 * - Validates user ownership of invoice
 * - Requires complete company configuration
 * - Never exposes internal error details in response
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInvoiceReport } from '@/modules/reports/reportService';

// Force Node.js runtime for PDFKit compatibility
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceID: string }> }
) {
  try {
    const { invoiceID } = await params;
    const { searchParams } = new URL(request.url);
    const userID = searchParams.get('userID');

    // Validate required parameters
    if (!userID) {
      return NextResponse.json(
        { error: 'userID query parameter is required' },
        { status: 400 }
      );
    }

    if (!invoiceID) {
      return NextResponse.json(
        { error: 'invoiceID is required' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoiceReport(userID, invoiceID);

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceID}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error) {
    // Log detailed error server-side
    console.error('Invoice PDF generation error:', error);

    // Determine appropriate error response
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found')) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('does not belong')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (
      errorMessage.includes('onboarding') ||
      errorMessage.includes('configuration')
    ) {
      return NextResponse.json(
        {
          error:
            'Company configuration incomplete. Please complete onboarding first.'
        },
        { status: 400 }
      );
    }

    // Generic error response (never expose internal details)
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}

// Made with Bob
