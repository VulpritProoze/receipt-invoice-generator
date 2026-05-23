import XLSX from 'xlsx-js-style';
import type { Invoice, Receipt } from '@/schemas';

/**
 * Export invoices to XLSX format
 * 
 * @param invoices - Array of invoices to export
 * @returns Buffer containing XLSX data
 */
export function exportInvoicesToXLSX(invoices: Invoice[]): Buffer {
  const headers = ['Invoice ID', 'Date', 'Billing User ID', 'Currency', 'Due Date', 'Total'];
  
  const rows = invoices.map((invoice) => {
    // Calculate total
    const subtotal = invoice.invoiceItems.reduce(
      (sum, item) => sum + item.billingHistoryEntries.reduce((itemSum, entry) => itemSum + entry.amount, 0),
      0
    );
    const taxAmount = subtotal * invoice.taxRate;
    const total = subtotal + taxAmount;
    
    return [
      invoice.invoiceID,
      invoice.invoiceDate,
      invoice.billingUserID,
      invoice.currency,
      invoice.dueDate,
      parseFloat(total.toFixed(2))
    ];
  });
  
  // Style header row
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "E0E0E0" } }
  };

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Apply styles to headers
  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ c: i, r: 0 });
    if (!ws[cellRef]) continue;
    ws[cellRef].s = headerStyle;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Export receipts to XLSX format
 * 
 * @param receipts - Array of receipts to export
 * @returns Buffer containing XLSX data
 */
export function exportReceiptsToXLSX(receipts: Receipt[]): Buffer {
  const headers = ['Receipt ID', 'Date', 'Invoice ID', 'Account Billed', 'Total'];
  
  const rows = receipts.map((receipt) => [
    receipt.receiptID,
    receipt.date,
    receipt.invoiceID,
    receipt.accountBilled,
    parseFloat(receipt.total.toFixed(2))
  ]);
  
  // Style header row
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "E0E0E0" } }
  };

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Apply styles to headers
  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ c: i, r: 0 });
    if (!ws[cellRef]) continue;
    ws[cellRef].s = headerStyle;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Receipts');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate XLSX filename with timestamp
 * 
 * @param type - Report type (invoice or receipt)
 * @returns Filename string
 */
export function generateXLSXFilename(type: 'invoice' | 'receipt'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${type}s-${timestamp}.xlsx`;
}
