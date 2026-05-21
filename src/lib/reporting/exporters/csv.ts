import type { Invoice, Receipt } from '@/schemas';

/**
 * Export invoices to CSV format
 * 
 * @param invoices - Array of invoices to export
 * @returns CSV string with headers and data rows
 * 
 * @example
 * ```typescript
 * const csv = exportInvoicesToCSV(invoices);
 * // Returns: "Invoice ID,Date,Bill To,Currency,Total\nINV000000001,..."
 * ```
 */
export function exportInvoicesToCSV(invoices: Invoice[]): string {
  const headers = ['Invoice ID', 'Date', 'Bill To', 'Currency', 'Due Date', 'Total'];
  
  const rows = invoices.map((invoice) => {
    // Calculate total
    const subtotal = invoice.invoiceItems.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const taxAmount = subtotal * invoice.taxRate;
    const total = subtotal + taxAmount;
    
    return [
      invoice.invoiceID,
      invoice.invoiceDate,
      invoice.billTo,
      invoice.currency,
      invoice.dueDate,
      total.toFixed(2)
    ];
  });
  
  // Build CSV
  const csvLines = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
  ];
  
  return csvLines.join('\n');
}

/**
 * Export receipts to CSV format
 * 
 * @param receipts - Array of receipts to export
 * @returns CSV string with headers and data rows
 * 
 * @example
 * ```typescript
 * const csv = exportReceiptsToCSV(receipts);
 * // Returns: "Receipt ID,Date,Invoice ID,Total\nCH_A3K9MXQP2T7VWRJN,..."
 * ```
 */
export function exportReceiptsToCSV(receipts: Receipt[]): string {
  const headers = ['Receipt ID', 'Date', 'Invoice ID', 'Account Billed', 'Total'];
  
  const rows = receipts.map((receipt) => [
    receipt.receiptID,
    receipt.date,
    receipt.invoiceID,
    receipt.accountBilled,
    receipt.total.toFixed(2)
  ]);
  
  // Build CSV
  const csvLines = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
  ];
  
  return csvLines.join('\n');
}

/**
 * Generate CSV filename with timestamp
 * 
 * @param type - Report type (invoice or receipt)
 * @returns Filename string
 */
export function generateCSVFilename(type: 'invoice' | 'receipt'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${type}s-${timestamp}.csv`;
}

// Made with Bob
