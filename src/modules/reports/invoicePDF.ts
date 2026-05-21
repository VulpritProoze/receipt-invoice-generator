/**
 * Invoice PDF Generator
 *
 * TEMPLATE ANALYSIS (docs/templates/invoice-template.png):
 *
 * Page Structure:
 * 1. Header Section (top):
 *    - Company brand name (large, bold) - top left
 *    - "INVOICE" label (large, bold) - centered below brand
 *    - Horizontal rule separator
 *
 * 2. Company & Invoice Info Section:
 *    - Left column: Company details
 *      - Company legal name
 *      - Support contact link (blue, underlined)
 *      - Full address (street, city, state, zip)
 *    - Right column: Invoice metadata (right-aligned)
 *      - Invoice # with value
 *      - Invoice Date with value
 *      - Terms with value
 *      - Due Date with value
 *      - Currency indicator
 *
 * 3. Bill To Section:
 *    - "BILL TO" label (bold)
 *    - Customer name
 *    - Address line
 *    - City/municipality
 *    - Province/postal code
 *    - Country
 *    - VAT ID (if applicable)
 *
 * 4. Line Items Table:
 *    - Column headers: QUANTITY | DESCRIPTION | RATE | AMOUNT
 *    - QUANTITY: right-aligned, numeric
 *    - DESCRIPTION: left-aligned, may span multiple lines
 *    - RATE: right-aligned, with currency symbol
 *    - AMOUNT: right-aligned, with currency symbol (calculated: quantity × rate)
 *    - Rows have subtle borders/spacing
 *
 * 5. Totals Section (right-aligned):
 *    - SUBTOTAL: sum of all amounts
 *    - TAX: label with percentage, calculated amount
 *    - INVOICE TOTAL: bold, final amount
 *
 * 6. Footer:
 *    - Small text note about VAT/reverse charge (if applicable)
 *
 * Typography:
 * - Brand name: ~20pt, bold
 * - "INVOICE" label: ~18pt, bold
 * - Section headers: ~12pt, bold
 * - Body text: ~10pt, regular
 * - Table headers: ~10pt, bold, uppercase
 * - Totals: ~11pt, INVOICE TOTAL is bold
 *
 * Spacing:
 * - Generous whitespace between sections (~20-30pt)
 * - Table rows: ~15pt height
 * - Margins: ~50pt all sides
 *
 * Alignment:
 * - Company info: left-aligned
 * - Invoice metadata: right-aligned
 * - Table: QUANTITY and amounts right-aligned, DESCRIPTION left-aligned
 * - Totals section: right-aligned
 */

import PDFDocument from 'pdfkit';
import type { Invoice } from '@/models/invoice';
import type { CompanyConfig } from '@/models/company';

/**
 * Generate an invoice PDF matching the template layout
 *
 * @param invoice - The invoice data with line items
 * @param companyConfig - Company branding and contact information
 * @returns PDF as a Buffer
 */
export async function generateInvoicePDF(
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

      // ===== HEADER SECTION =====
      // Company brand name (top left, large, bold)
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(companyConfig.brandName, 50, 50);

      // "INVOICE" label (centered, large, bold)
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('INVOICE', 50, 80, { align: 'center', width: 512 });

      // Horizontal rule
      doc.moveTo(50, 110).lineTo(562, 110).stroke();

      // ===== COMPANY & INVOICE INFO SECTION =====
      let yPos = 130;

      // Left column: Company details
      doc.fontSize(10).font('Helvetica');
      doc.text(companyConfig.companyName, 50, yPos);
      yPos += 15;

      // Support contact (blue, underlined - simulate with regular text)
      doc
        .fillColor('blue')
        .text(companyConfig.companyUrl, 50, yPos, { underline: true });
      doc.fillColor('black');
      yPos += 15;

      // Company address
      doc.text(companyConfig.addressLine, 50, yPos);
      yPos += 12;
      doc.text(companyConfig.postalAddress, 50, yPos);
      yPos += 12;
      doc.text(companyConfig.country, 50, yPos);

      // Right column: Invoice metadata (right-aligned)
      let rightYPos = 130;
      const rightX = 400;

      doc
        .font('Helvetica-Bold')
        .text('Invoice #', rightX, rightYPos, { width: 80 });
      doc
        .font('Helvetica')
        .text(invoice.invoiceID, rightX + 85, rightYPos, { width: 77 });
      rightYPos += 15;

      doc
        .font('Helvetica-Bold')
        .text('Invoice Date', rightX, rightYPos, { width: 80 });
      doc
        .font('Helvetica')
        .text(
          new Date(invoice.invoiceDate).toLocaleDateString(),
          rightX + 85,
          rightYPos,
          {
            width: 77
          }
        );
      rightYPos += 15;

      doc
        .font('Helvetica-Bold')
        .text('Terms', rightX, rightYPos, { width: 80 });
      doc
        .font('Helvetica')
        .text(invoice.terms, rightX + 85, rightYPos, { width: 77 });
      rightYPos += 15;

      doc
        .font('Helvetica-Bold')
        .text('Due Date', rightX, rightYPos, { width: 80 });
      doc
        .font('Helvetica')
        .text(
          new Date(invoice.dueDate).toLocaleDateString(),
          rightX + 85,
          rightYPos,
          {
            width: 77
          }
        );
      rightYPos += 15;

      doc
        .font('Helvetica-Bold')
        .text('Currency', rightX, rightYPos, { width: 80 });
      doc
        .font('Helvetica')
        .text(invoice.currency, rightX + 85, rightYPos, { width: 77 });

      // ===== BILL TO SECTION =====
      yPos = Math.max(yPos, rightYPos) + 30;

      doc.fontSize(12).font('Helvetica-Bold').text('BILL TO', 50, yPos);
      yPos += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(invoice.billTo, 50, yPos);
      yPos += 15;
      doc.text(invoice.billToAddressLine, 50, yPos);
      yPos += 12;
      doc.text(invoice.billToCityAddress, 50, yPos);
      yPos += 12;
      doc.text(invoice.billToPostalAddress, 50, yPos);
      yPos += 12;
      doc.text(invoice.billToCountry, 50, yPos);
      yPos += 25;

      // ===== LINE ITEMS TABLE =====
      const tableTop = yPos;
      const colQuantity = 50;
      const colDescription = 120;
      const colRate = 380;
      const colAmount = 480;

      // Table headers
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('QUANTITY', colQuantity, tableTop, {
        width: 60,
        align: 'right'
      });
      doc.text('DESCRIPTION', colDescription, tableTop, { width: 250 });
      doc.text('RATE', colRate, tableTop, { width: 90, align: 'right' });
      doc.text('AMOUNT', colAmount, tableTop, { width: 82, align: 'right' });

      // Header underline
      yPos = tableTop + 15;
      doc.moveTo(50, yPos).lineTo(562, yPos).stroke();

      yPos += 10;

      // Table rows
      doc.font('Helvetica');
      let subtotal = 0;

      for (const item of invoice.invoiceItems) {
        const amount = item.quantity * item.rate;
        subtotal += amount;

        doc.text(item.quantity.toString(), colQuantity, yPos, {
          width: 60,
          align: 'right'
        });
        doc.text(item.description, colDescription, yPos, { width: 250 });
        doc.text(formatAmount(item.rate), colRate, yPos, {
          width: 90,
          align: 'right'
        });
        doc.text(formatAmount(amount), colAmount, yPos, {
          width: 82,
          align: 'right'
        });

        yPos += 20;
      }

      // ===== TOTALS SECTION =====
      yPos += 20;

      // Subtotal
      doc
        .font('Helvetica-Bold')
        .text('SUBTOTAL:', colRate, yPos, { width: 90, align: 'right' });
      doc
        .font('Helvetica')
        .text(formatAmount(subtotal), colAmount, yPos, {
          width: 82,
          align: 'right'
        });
      yPos += 18;

      // Tax
      const taxAmount = subtotal * invoice.taxRate;
      const taxLabel = `TAX (${(invoice.taxRate * 100).toFixed(0)}%):`;
      doc
        .font('Helvetica-Bold')
        .text(taxLabel, colRate, yPos, { width: 90, align: 'right' });
      doc
        .font('Helvetica')
        .text(formatAmount(taxAmount), colAmount, yPos, {
          width: 82,
          align: 'right'
        });
      yPos += 18;

      // Invoice Total
      const invoiceTotal = subtotal + taxAmount;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('INVOICE TOTAL:', colRate, yPos, { width: 90, align: 'right' });
      doc.text(formatAmount(invoiceTotal), colAmount, yPos, {
        width: 82,
        align: 'right'
      });

      // ===== FOOTER =====
      yPos += 40;
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          'If applicable, customer should account for the respective VAT reverse charge.',
          50,
          yPos,
          { width: 512, align: 'left' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Made with Bob
