/**
 * CSV parser for billing history import
 * Parses CSV files into InvoiceItem arrays with validation
 * See DEC-006 for library choice (papaparse)
 */

import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { invoiceItemSchema, type InvoiceItem } from '@/models/invoice';

interface CSVRow {
  Description: string;
  Quantity: string;
  Rate: string;
  Date: string;
}

interface ParseResult {
  items: InvoiceItem[];
  skipped: number;
  errors: string[];
}

/**
 * Parses CSV file content into validated InvoiceItem array
 * Skips invalid rows and logs reasons
 * See security rule: parsers must be tolerant but not silent
 *
 * @param fileContent - CSV file content as string
 * @returns Promise resolving to array of valid InvoiceItem objects
 * @throws Error if file is completely invalid (no valid rows, missing columns)
 */
export async function parseCSV(fileContent: string): Promise<InvoiceItem[]> {
  const result = await parseCSVWithDetails(fileContent);

  // If no items were parsed and there were errors, throw
  if (result.items.length === 0 && result.errors.length > 0) {
    throw new Error(
      `CSV parsing failed: ${result.errors.slice(0, 3).join('; ')}`
    );
  }

  return result.items;
}

/**
 * Parses CSV with detailed results including skipped rows and errors
 * Used internally and by tests to verify error handling
 *
 * @param fileContent - CSV file content as string
 * @returns ParseResult with items, skipped count, and error messages
 */
export async function parseCSVWithDetails(
  fileContent: string
): Promise<ParseResult> {
  const items: InvoiceItem[] = [];
  const errors: string[] = [];
  let skipped = 0;

  // Handle empty file
  if (!fileContent || fileContent.trim().length === 0) {
    return { items: [], skipped: 0, errors: ['File is empty'] };
  }

  // Parse CSV using papaparse
  const parseResult = Papa.parse<CSVRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim()
  });

  // Check for parsing errors
  if (parseResult.errors.length > 0) {
    const criticalErrors = parseResult.errors.filter(
      (err: Papa.ParseError) =>
        err.type === 'Delimiter' || err.type === 'FieldMismatch'
    );
    if (criticalErrors.length > 0) {
      errors.push(
        ...criticalErrors.map(
          (err: Papa.ParseError) => `Row ${err.row}: ${err.message}`
        )
      );
    }
  }

  // Validate required columns exist
  const requiredColumns = ['Description', 'Quantity', 'Rate', 'Date'];
  const headers = parseResult.meta.fields || [];
  const missingColumns = requiredColumns.filter(
    (col) => !headers.includes(col)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `CSV missing required columns: ${missingColumns.join(', ')}`
    );
  }

  // Process each row
  parseResult.data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because: 0-indexed + header row

    try {
      // Convert CSV row to InvoiceItem format
      const quantity = parseFloat(row.Quantity);
      const rate = parseFloat(row.Rate);

      // Basic validation before Zod
      if (!row.Description || isNaN(quantity) || isNaN(rate) || !row.Date) {
        errors.push(`Row ${rowNumber}: Missing or invalid required fields`);
        skipped++;
        return;
      }

      // Create item with generated ID
      const item = {
        itemID: uuidv4(),
        description: row.Description.trim(),
        quantity: Math.floor(quantity), // Convert to integer
        rate: rate,
        date: row.Date.trim()
      };

      // Validate against Zod schema
      const validationResult = invoiceItemSchema.safeParse(item);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join('; ');
        errors.push(`Row ${rowNumber}: ${errorMessages}`);
        skipped++;
        return;
      }

      items.push(validationResult.data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Row ${rowNumber}: ${errorMessage}`);
      skipped++;
    }
  });

  // Log skipped rows for debugging (server-side only)
  if (skipped > 0 && typeof console !== 'undefined') {
    console.warn(
      `CSV import: ${skipped} rows skipped. First 5 errors:`,
      errors.slice(0, 5)
    );
  }

  return { items, skipped, errors };
}

// Made with Bob
