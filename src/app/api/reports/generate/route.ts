import { NextRequest, NextResponse } from 'next/server';
import { listUserInvoices } from '@/modules/invoices/invoiceService';
import { listUserReceipts } from '@/modules/receipts/receiptService';
import {
  exportInvoicesToCSV,
  exportReceiptsToCSV,
  generateCSVFilename
} from '@/lib/reporting/exporters/csv';

/**
 * GET /api/reports/generate - Generate and download a report
 * 
 * Query parameters:
 * - type: 'invoice' | 'receipt' (required)
 * - userID: string (required)
 * 
 * Returns CSV file as download
 * 
 * @example
 * GET /api/reports/generate?type=invoice&userID=demo-user-001
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const userID = searchParams.get('userID');

    // Validate required parameters
    if (!type || !userID) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and userID' },
        { status: 400 }
      );
    }

    // Validate type parameter
    if (type !== 'invoice' && type !== 'receipt') {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "invoice" or "receipt"' },
        { status: 400 }
      );
    }

    let csvContent: string;
    let filename: string;

    // Generate report based on type
    if (type === 'invoice') {
      const invoices = await listUserInvoices(userID);
      csvContent = exportInvoicesToCSV(invoices);
      filename = generateCSVFilename('invoice');
    } else {
      const receipts = await listUserReceipts(userID);
      csvContent = exportReceiptsToCSV(receipts);
      filename = generateCSVFilename('receipt');
    }

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Made with Bob
