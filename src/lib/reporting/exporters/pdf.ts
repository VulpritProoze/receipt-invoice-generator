import PDFDocument from 'pdfkit';
import type { Invoice, Receipt } from '@/schemas';

/**
 * Export invoices to PDF format
 * 
 * @param invoices - Array of invoices to export
 * @returns Promise resolving to a Buffer containing PDF data
 */
export async function exportInvoicesToPDF(invoices: Invoice[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.fontSize(20).text('Invoices Report', { align: 'center' });
      doc.moveDown(2);

      invoices.forEach((invoice, index) => {
        // Calculate total
        const subtotal = invoice.invoiceItems.reduce(
          (sum, item) => sum + item.quantity * item.rate,
          0
        );
        const taxAmount = subtotal * invoice.taxRate;
        const total = subtotal + taxAmount;
        
        doc.fontSize(14).text(`Invoice ID: ${invoice.invoiceID}`, { underline: true });
        doc.fontSize(12).moveDown(0.5);
        doc.text(`Date: ${invoice.invoiceDate} | Due Date: ${invoice.dueDate || 'N/A'}`);
        doc.text(`Bill To: ${invoice.billTo}`);
        doc.text(`Currency: ${invoice.currency}`);
        doc.text(`Total: ${total.toFixed(2)} ${invoice.currency}`, { bold: true });
        
        doc.moveDown(1.5);
        
        // Add a page break if not the last item and we are near the bottom
        if (index < invoices.length - 1 && doc.y > 650) {
          doc.addPage();
        }
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Export receipts to PDF format
 * 
 * @param receipts - Array of receipts to export
 * @returns Promise resolving to a Buffer containing PDF data
 */
export async function exportReceiptsToPDF(receipts: Receipt[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.fontSize(20).text('Receipts Report', { align: 'center' });
      doc.moveDown(2);

      receipts.forEach((receipt, index) => {
        doc.fontSize(14).text(`Receipt ID: ${receipt.receiptID}`, { underline: true });
        doc.fontSize(12).moveDown(0.5);
        doc.text(`Date: ${receipt.date}`);
        doc.text(`Invoice ID: ${receipt.invoiceID || 'N/A'}`);
        doc.text(`Account Billed: ${receipt.accountBilled}`);
        doc.text(`Total: ${receipt.total.toFixed(2)}`, { bold: true });
        
        doc.moveDown(1.5);
        
        // Add a page break if not the last item and we are near the bottom
        if (index < receipts.length - 1 && doc.y > 650) {
          doc.addPage();
        }
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate PDF filename with timestamp
 * 
 * @param type - Report type (invoice or receipt)
 * @returns Filename string
 */
export function generatePDFFilename(type: 'invoice' | 'receipt'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${type}s-${timestamp}.pdf`;
}
