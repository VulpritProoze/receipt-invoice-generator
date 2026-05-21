/**
 * XLSX parser for billing history import
 * Parses Excel files into InvoiceItem arrays with validation
 * See DEC-006 for library choice (xlsx)
 */

import * as XLSX from 'xlsx-js-style';
import { v4 as uuidv4 } from 'uuid';
import { invoiceItemSchema, type InvoiceItem } from '@/models/invoice';

interface XLSXRow {
  Description: string;
  Quantity: number;
  Rate: number;
  Date: string;
}

interface ParseResult {
  items: InvoiceItem[];
  skipped: number;
  errors: string[];
}

/**
 * Parses XLSX file buffer into validated InvoiceItem array
 * Reads first sheet only, skips invalid rows and logs reasons
 * See security rule: parsers must be tolerant but not silent
 *
 * @param fileBuffer - XLSX file content as Buffer
 * @returns Promise resolving to array of valid InvoiceItem objects
 * @throws Error if file is completely invalid (no valid rows, missing columns, corrupted)
 */
export async function parseXLSX(fileBuffer: Buffer): Promise<InvoiceItem[]> {
  const result = await parseXLSXWithDetails(fileBuffer);

  // If no items were parsed and there were errors, throw
  if (result.items.length === 0 && result.errors.length > 0) {
    throw new Error(
      `XLSX parsing failed: ${result.errors.slice(0, 3).join('; ')}`
    );
  }

  return result.items;
}

/**
 * Parses XLSX with detailed results including skipped rows and errors
 * Used internally and by tests to verify error handling
 *
 * @param fileBuffer - XLSX file content as Buffer
 * @returns ParseResult with items, skipped count, and error messages
 */
export async function parseXLSXWithDetails(
  fileBuffer: Buffer
): Promise<ParseResult> {
  const items: InvoiceItem[] = [];
  const errors: string[] = [];
  let skipped = 0;

  // Handle empty buffer
  if (!fileBuffer || fileBuffer.length === 0) {
    return { items: [], skipped: 0, errors: ['File is empty'] };
  }

  try {
    // Parse XLSX file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Check if workbook has sheets
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Workbook contains no sheets');
    }

    // Read first sheet only
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json<XLSXRow>(worksheet, {
      header: ['Description', 'Quantity', 'Rate', 'Date'],
      defval: ''
    });

    // Check if sheet is empty
    if (jsonData.length === 0) {
      return { items: [], skipped: 0, errors: ['Sheet is empty'] };
    }

    // First row should be headers - validate and skip it
    const headerRow = jsonData[0];
    const requiredColumns = ['Description', 'Quantity', 'Rate', 'Date'];
    const hasValidHeaders = requiredColumns.every(
      (col) =>
        headerRow[col as keyof XLSXRow] &&
        String(headerRow[col as keyof XLSXRow])
          .toLowerCase()
          .includes(col.toLowerCase())
    );

    if (!hasValidHeaders) {
      throw new Error(
        `XLSX missing required columns: ${requiredColumns.join(', ')}`
      );
    }

    // Process data rows (skip header row at index 0)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 1; // +1 for 1-based row numbering in Excel

      try {
        // Skip completely empty rows
        if (!row.Description && !row.Quantity && !row.Rate && !row.Date) {
          continue;
        }

        // Convert and validate data types
        const quantity = Number(row.Quantity);
        const rate = Number(row.Rate);
        const description = String(row.Description || '').trim();
        const date = String(row.Date || '').trim();

        // Basic validation before Zod
        if (!description || isNaN(quantity) || isNaN(rate) || !date) {
          errors.push(`Row ${rowNumber}: Missing or invalid required fields`);
          skipped++;
          continue;
        }

        // Handle Excel date serial numbers
        let formattedDate = date;
        if (/^\d+(\.\d+)?$/.test(date)) {
          // Excel serial date number
          const excelDate = XLSX.SSF.parse_date_code(Number(date));
          if (excelDate) {
            formattedDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
          }
        }

        // Create item with generated ID
        const item = {
          itemID: uuidv4(),
          description,
          quantity: Math.floor(quantity), // Convert to integer
          rate,
          date: formattedDate
        };

        // Validate against Zod schema
        const validationResult = invoiceItemSchema.safeParse(item);

        if (!validationResult.success) {
          const errorMessages = validationResult.error.issues
            .map((err) => `${err.path.join('.')}: ${err.message}`)
            .join('; ');
          errors.push(`Row ${rowNumber}: ${errorMessages}`);
          skipped++;
          continue;
        }

        items.push(validationResult.data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${rowNumber}: ${errorMessage}`);
        skipped++;
      }
    }
  } catch (error) {
    // Handle file-level errors (corrupted file, invalid format)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    if (
      errorMessage.includes('Unsupported file') ||
      errorMessage.includes('Invalid')
    ) {
      throw new Error(`Invalid or corrupted XLSX file: ${errorMessage}`, {
        cause: error
      });
    }
    throw error;
  }

  // Log skipped rows for debugging (server-side only)
  if (skipped > 0 && typeof console !== 'undefined') {
    console.warn(
      `XLSX import: ${skipped} rows skipped. First 5 errors:`,
      errors.slice(0, 5)
    );
  }

  return { items, skipped, errors };
}
