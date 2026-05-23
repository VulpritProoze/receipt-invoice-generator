export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { listBillingUserInvoices } from '@/modules/invoices/invoiceService';
import { listUserReceipts } from '@/modules/receipts/receiptService';
import {
  exportInvoicesToCSV,
  exportReceiptsToCSV,
  generateCSVFilename
} from '@/lib/reporting/exporters/csv';
import {
  exportInvoicesToXLSX,
  exportReceiptsToXLSX,
  generateXLSXFilename
} from '@/lib/reporting/exporters/xlsx';
import {
  exportInvoicesToPDF,
  exportReceiptsToPDF,
  generatePDFFilename
} from '@/lib/reporting/exporters/pdf';

/**
 * GET /api/reports/generate - Generate and download a report
 * 
 * Query parameters:
 * - type: 'invoice' | 'receipt' (required)
 * - userID: string (required)
 * - format: 'csv' | 'xlsx' | 'pdf' (optional, defaults to 'csv')
 * 
 * Returns generated file as download
 * 
 * @example
 * GET /api/reports/generate?type=invoice&userID=demo-user-001&format=xlsx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const userID = searchParams.get('userID');
    const format = searchParams.get('format') || 'csv';

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

    // Validate format parameter
    if (format !== 'csv' && format !== 'xlsx' && format !== 'pdf') {
      return NextResponse.json(
        { error: 'Invalid format parameter. Must be "csv", "xlsx", or "pdf"' },
        { status: 400 }
      );
    }

    let fileContent: string | Buffer;
    let filename: string;
    let contentType: string;

    // Generate report based on type and format
    if (type === 'invoice') {
      const invoices = await listBillingUserInvoices(userID);
      
      if (format === 'xlsx') {
        fileContent = exportInvoicesToXLSX(invoices);
        filename = generateXLSXFilename('invoice');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (format === 'pdf') {
        fileContent = await exportInvoicesToPDF(invoices);
        filename = generatePDFFilename('invoice');
        contentType = 'application/pdf';
      } else {
        fileContent = exportInvoicesToCSV(invoices);
        filename = generateCSVFilename('invoice');
        contentType = 'text/csv';
      }
    } else {
      const receipts = await listUserReceipts(userID);
      
      if (format === 'xlsx') {
        fileContent = exportReceiptsToXLSX(receipts);
        filename = generateXLSXFilename('receipt');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (format === 'pdf') {
        fileContent = await exportReceiptsToPDF(receipts);
        filename = generatePDFFilename('receipt');
        contentType = 'application/pdf';
      } else {
        fileContent = exportReceiptsToCSV(receipts);
        filename = generateCSVFilename('receipt');
        contentType = 'text/csv';
      }
    }

    // Return file as downloadable response
    return new NextResponse(fileContent as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
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
