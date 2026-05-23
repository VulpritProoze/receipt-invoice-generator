/**
 * Import service layer for billing history
 * Orchestrates file parsing and database storage
 * See DEC-006 for parser library choices
 */

import { parseCSVWithDetails } from './csvParser';
import { parseXLSXWithDetails } from './xlsxParser';
import type { InvoiceItem } from '@/models/invoice';
import { getBillingUser } from '@/modules/billingUsers/billingUserService';
import { createBillingHistory } from '@/modules/billingHistory/billingHistoryService';
import { matchImportRowsToItems, type UnmatchedItem } from './importMatcher';

export interface ImportResult {
  imported: number;
  skipped: number;
  unmatched?: UnmatchedItem[];
  errors: string[];
}

/**
 * Imports billing history from CSV or XLSX file
 * Parses file, validates items, matches to catalog, and stores in database
 * See security rule: user isolation must be maintained
 *
 * @param billingUserID - Billing User ID to associate imported items with
 * @param fileContent - File content as string (CSV) or Buffer (XLSX)
 * @param fileType - File type: 'csv' or 'xlsx'
 * @returns ImportResult with counts, optional unmatched items, and error messages
 * @throws Error if file parsing fails completely
 */
export async function importBillingHistory(
  billingUserID: string,
  fileContent: string | Buffer,
  fileType: 'csv' | 'xlsx'
): Promise<ImportResult> {
  // Validate billingUserID
  if (!billingUserID || billingUserID.trim().length === 0) {
    throw new Error('Billing User ID is required for import');
  }

  // Look up billing user to get companyID
  const billingUser = await getBillingUser(billingUserID);
  if (!billingUser) {
    throw new Error(`Billing user ${billingUserID} not found`);
  }
  const companyID = billingUser.companyID;

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

    // Match descriptions to invoice item masters
    const matchResult = await matchImportRowsToItems(companyID, items);

    // If unmatched items exist, abort the import
    if (matchResult.unmatched && matchResult.unmatched.length > 0) {
      return {
        imported: 0,
        skipped: items.length,
        unmatched: matchResult.unmatched,
        errors: [...errors, 'Unmatched items found. Please create them first.']
      };
    }

    // Store billing history entries
    let imported = 0;
    const storageErrors: string[] = [];

    for (const matched of matchResult.matched) {
      try {
        await createBillingHistory(billingUserID, matched.invoiceItemID, {
          quantity: matched.quantity,
          rate: matched.rate,
          date: matched.date
        });
        imported++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown storage error';
        storageErrors.push(
          `Failed to store item ${matched.description}: ${errorMessage}`
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
          `Import complete with errors for billing user ${billingUserID}: ${imported} imported, ${skipped} skipped`
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
