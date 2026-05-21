/**
 * Import service layer for billing history
 * Orchestrates file parsing and database storage
 * See DEC-006 for parser library choices
 */

import { parseCSVWithDetails } from './csvParser';
import { parseXLSXWithDetails } from './xlsxParser';
import type { InvoiceItem } from '@/models/invoice';
import { createInvoiceItem } from '@/lib/db/invoices';

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Imports billing history from CSV or XLSX file
 * Parses file, validates items, and stores in database
 * See security rule: user isolation must be maintained
 *
 * @param userID - User ID to associate imported items with
 * @param fileContent - File content as string (CSV) or Buffer (XLSX)
 * @param fileType - File type: 'csv' or 'xlsx'
 * @returns ImportResult with counts and error messages
 * @throws Error if file parsing fails completely
 */
export async function importBillingHistory(
  userID: string,
  fileContent: string | Buffer,
  fileType: 'csv' | 'xlsx'
): Promise<ImportResult> {
  // Validate userID
  if (!userID || userID.trim().length === 0) {
    throw new Error('User ID is required for import');
  }

  let items: InvoiceItem[];
  let skipped: number;
  let errors: string[];

  try {
    // Parse file based on type
    if (fileType === 'csv') {
      if (typeof fileContent !== 'string') {
        throw new Error('CSV file content must be a string');
      }
      const result = await parseCSVWithDetails(fileContent);
      items = result.items;
      skipped = result.skipped;
      errors = result.errors;
    } else if (fileType === 'xlsx') {
      if (!Buffer.isBuffer(fileContent)) {
        throw new Error('XLSX file content must be a Buffer');
      }
      const result = await parseXLSXWithDetails(fileContent);
      items = result.items;
      skipped = result.skipped;
      errors = result.errors;
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // If no items were parsed, return early
    if (items.length === 0) {
      return {
        imported: 0,
        skipped,
        errors: errors.length > 0 ? errors : ['No valid items found in file']
      };
    }

    // Store items in database
    let imported = 0;
    const storageErrors: string[] = [];

    for (const item of items) {
      try {
        await createInvoiceItem(userID, item);
        imported++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown storage error';
        storageErrors.push(
          `Failed to store item ${item.itemID}: ${errorMessage}`
        );
        skipped++;
      }
    }

    // Combine parsing and storage errors
    const allErrors = [...errors, ...storageErrors];

    // Log import summary (server-side only)
    if (typeof console !== 'undefined') {
      if (allErrors.length > 0) {
        console.warn(
          `Import complete with errors for user ${userID}: ${imported} imported, ${skipped} skipped`
        );
        console.warn(`Import errors (first 5):`, allErrors.slice(0, 5));
      }
    }

    return {
      imported,
      skipped,
      errors: allErrors
    };
  } catch (error) {
    // Handle file-level parsing errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Import failed: ${errorMessage}`, { cause: error });
  }
}

/**
 * Validates import file before processing
 * Checks file type and basic structure without storing
 * Used for preview/validation endpoints
 *
 * @param fileContent - File content as string (CSV) or Buffer (XLSX)
 * @param fileType - File type: 'csv' or 'xlsx'
 * @returns Object with valid item count and error messages
 */
export async function validateImportFile(
  fileContent: string | Buffer,
  fileType: 'csv' | 'xlsx'
): Promise<{ validItems: number; errors: string[] }> {
  try {
    let items: InvoiceItem[];
    let errors: string[] = [];

    if (fileType === 'csv') {
      if (typeof fileContent !== 'string') {
        throw new Error('CSV file content must be a string');
      }
      const result = await parseCSVWithDetails(fileContent);
      items = result.items;
      errors = result.errors;
    } else if (fileType === 'xlsx') {
      if (!Buffer.isBuffer(fileContent)) {
        throw new Error('XLSX file content must be a Buffer');
      }
      const result = await parseXLSXWithDetails(fileContent);
      items = result.items;
      errors = result.errors;
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    return {
      validItems: items.length,
      errors
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      validItems: 0,
      errors: [errorMessage]
    };
  }
}

// Made with Bob
