/**
 * Receipt PDF Generator
 *
 * TEMPLATE ANALYSIS (docs/templates/receipt-template.png):
 *
 * Page Structure:
 * 1. Header Section (centered):
 *    - Icon/logo (circular, centered)
 *    - "Receipt" label (large, centered below icon)
 *    - Horizontal spacing
 *
 * 2. Thank You Message:
 *    - "We received payment for your [Service] subscription. Thanks for your business!"
 *    - "Questions? Visit [contact URL]"
 *    - Left-aligned, regular text
 *
 * 3. Transaction Details (two-column layout):
 *    - Left column: labels (bold)
 *    - Right column: values (regular)
 *    - Fields:
 *      - Date: timestamp with timezone
 *      - Account billed: username (email)
 *      - GitHub Plan: plan name
 *      - Total: amount with currency
 *      - Charged to: card type **** **** **** [last 4]
 *      - Transaction ID: receipt ID
 *      - For service through: date
 *
 * 4. Spacing:
 *    - Clean, generous whitespace between sections
 *    - Row spacing: ~18-20pt between detail rows
 *    - Margins: ~50pt all sides
 *
 * Typography:
 * - "Receipt" label: ~24pt, regular weight
 * - Thank you message: ~10pt, regular
 * - Detail labels: ~10pt, bold
 * - Detail values: ~10pt, regular
 *
 * Alignment:
 * - Header: centered
 * - Thank you message: left-aligned
 * - Details: two-column with labels left, values right-aligned in their column
 *
 * Note: The template shows a simplified receipt. Our implementation includes:
 * - Line items from the invoice (not shown in template but required per spec)
 * - Company branding footer (required per spec)
 */

import PDFDocument from 'pdfkit';
import type { Receipt } from '@/models/receipt';
import type { Invoice } from '@/models/invoice';
import type { CompanyConfig } from '@/models/company';

/**
 * Generate a receipt PDF matching the template layout
 *
 * @param receipt - The receipt data with transaction details
 * @param invoice - The related invoice with line items
 * @param companyConfig - Company branding and contact information
 * @returns PDF as a Buffer
 */
export async function generateReceiptPDF(
  receipt: Receipt,
  invoice: Invoice,
  companyConfig: CompanyConfig
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Currency symbol derivation
      const currencySymbol = invoice.currency === 'PHP' ? '₱' : '$';

      // Helper: format currency amount
      const formatAmount = (amount: number): string => {
        return `${currencySymbol}${amount.toFixed(2)}`;
      };

      // Calculate total from invoice items
      const subtotal = invoice.invoiceItems.reduce(
        (sum, item) => sum + item.billingHistoryEntries.reduce((itemSum, entry) => itemSum + entry.amount, 0),
        0
      );
      const taxAmount = subtotal * invoice.taxRate;
      const total = subtotal + taxAmount;

      // ===== HEADER SECTION =====
      // "Receipt" label (centered, large)
      doc
        .fontSize(24)
        .font('Helvetica')
        .text('Receipt', 50, 80, { align: 'center', width: 512 });

      let yPos = 130;

      // ===== THANK YOU MESSAGE =====
      doc.fontSize(10).font('Helvetica');
      doc.text(
        `We received payment for your ${companyConfig.brandName} subscription. Thanks for your business!`,
        50,
        yPos,
        { width: 512 }
      );
      yPos += 20;

      doc.fillColor('blue');
      doc.text(`Questions? Visit ${companyConfig.companyUrl}`, 50, yPos, {
        width: 512,
        underline: true
      });
      doc.fillColor('black');
      yPos += 40;

      // ===== TRANSACTION DETAILS (two-column layout) =====
      const labelX = 50;
      const valueX = 250;

      // Date
      doc.font('Helvetica-Bold').text('Date', labelX, yPos);
      doc
        .font('Helvetica')
        .text(
          new Date(receipt.date).toLocaleString('en-US', {
            timeZoneName: 'short'
          }),
          valueX,
          yPos
        );
      yPos += 20;

      // Account billed
      doc.font('Helvetica-Bold').text('Account billed', labelX, yPos);
      doc.font('Helvetica').text(receipt.accountBilled, valueX, yPos);
      yPos += 20;

      // GitHub Plan (using brand name as service name)
      doc
        .font('Helvetica-Bold')
        .text(`${companyConfig.brandName} Plan`, labelX, yPos);
      doc.font('Helvetica').text('Pro', valueX, yPos); // Simplified - could be dynamic
      yPos += 20;

      // Total
      doc.font('Helvetica-Bold').text('Total', labelX, yPos);
      doc
        .font('Helvetica')
        .text(`${formatAmount(total)} ${invoice.currency}`, valueX, yPos);
      yPos += 20;

      // Charged to
      doc.font('Helvetica-Bold').text('Charged to', labelX, yPos);
      doc.font('Helvetica').text(receipt.chargedTo, valueX, yPos);
      yPos += 20;

      // Transaction ID
      doc.font('Helvetica-Bold').text('Transaction ID', labelX, yPos);
      doc.font('Helvetica').text(receipt.receiptID, valueX, yPos);
      yPos += 20;

      // For service through
      doc.font('Helvetica-Bold').text('For service through', labelX, yPos);
      doc
        .font('Helvetica')
        .text(new Date(invoice.dueDate).toLocaleDateString(), valueX, yPos);
      yPos += 40;

      // ===== LINE ITEMS SECTION =====
      doc.fontSize(12).font('Helvetica-Bold').text('Invoice Details', 50, yPos);
      yPos += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Reference Invoice: ${invoice.invoiceID}`, 50, yPos);
      yPos += 25;

      // Line items table (simplified)
      const colDescription = 50;
      const colQuantity = 320;
      const colRate = 400;
      const colAmount = 480;

      // Headers
      doc.font('Helvetica-Bold');
      doc.text('DESCRIPTION', colDescription, yPos, { width: 260 });
      doc.text('QTY', colQuantity, yPos, { width: 70, align: 'right' });
      doc.text('RATE', colRate, yPos, { width: 70, align: 'right' });
      doc.text('AMOUNT', colAmount, yPos, { width: 82, align: 'right' });
      yPos += 15;

      // Underline
      doc.moveTo(50, yPos).lineTo(562, yPos).stroke();
      yPos += 10;

      // Items
      doc.font('Helvetica');
      for (const item of invoice.invoiceItems) {
        for (const entry of item.billingHistoryEntries) {
          const amount = entry.amount;
          doc.text(`${item.description} (${entry.date})`, colDescription, yPos, { width: 260 });
          doc.text(entry.quantity.toString(), colQuantity, yPos, {
            width: 70,
            align: 'right'
          });
          doc.text(formatAmount(entry.rate), colRate, yPos, {
            width: 70,
            align: 'right'
          });
          doc.text(formatAmount(amount), colAmount, yPos, {
            width: 82,
            align: 'right'
          });
          yPos += 18;
        }
      }

      yPos += 10;

      // Total line
      doc.font('Helvetica-Bold');
      doc.text('TOTAL:', colRate, yPos, { width: 70, align: 'right' });
      doc.text(formatAmount(total), colAmount, yPos, {
        width: 82,
        align: 'right'
      });
      yPos += 40;

      // ===== COMPANY BRANDING FOOTER =====
      doc.fontSize(9).font('Helvetica');
      doc.text(companyConfig.brandName, 50, yPos, {
        align: 'center',
        width: 512
      });
      yPos += 12;
      doc.text(companyConfig.companyName, 50, yPos, {
        align: 'center',
        width: 512
      });
      yPos += 12;
      doc.fillColor('blue');
      doc.text(companyConfig.companyUrl, 50, yPos, {
        align: 'center',
        width: 512,
        underline: true
      });
      doc.fillColor('black');
      yPos += 12;
      doc.text(companyConfig.addressLine, 50, yPos, {
        align: 'center',
        width: 512
      });
      yPos += 12;
      doc.text(companyConfig.postalAddress, 50, yPos, {
        align: 'center',
        width: 512
      });
      yPos += 12;
      doc.text(companyConfig.country, 50, yPos, {
        align: 'center',
        width: 512
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Made with Bob
