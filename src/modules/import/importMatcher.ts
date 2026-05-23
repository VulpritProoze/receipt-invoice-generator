/**
 * Import Matcher
 * Handles matching CSV descriptions to invoice item masters
 * and creating missing items
 */

import { generateID } from '@/lib/idGenerator';
import * as invoiceItemMastersDB from '@/lib/db/invoiceItemMasters';
import { InvoiceItemMaster } from '@/models/invoice';

export interface ParsedImportRow {
  description: string;
  quantity: number;
  rate: number;
  date: string;
}

export interface MatchedItem {
  invoiceItemID: string;
  description: string;
  quantity: number;
  rate: number;
  date: string;
}

export interface UnmatchedItem {
  description: string;
  defaultRate?: number;
}

export interface MatchResult {
  matched: MatchedItem[];
  unmatched: UnmatchedItem[];
}

/**
 * Match parsed import rows to existing invoice item masters
 * Case-insensitive description matching
 */
export async function matchImportRowsToItems(
  companyID: string,
  rows: ParsedImportRow[]
): Promise<MatchResult> {
  // Fetch all invoice item masters for the company
  const allItems = await invoiceItemMastersDB.listInvoiceItemMasters(companyID);

  // Create a map for case-insensitive lookup
  const itemMap = new Map<string, InvoiceItemMaster>();
  for (const item of allItems) {
    itemMap.set(item.description.toLowerCase().trim(), item);
  }

  const matched: MatchedItem[] = [];
  const unmatchedDescriptions = new Set<string>();

  // Match each row
  for (const row of rows) {
    const normalizedDesc = row.description.toLowerCase().trim();
    const matchedItem = itemMap.get(normalizedDesc);

    if (matchedItem) {
      matched.push({
        invoiceItemID: matchedItem.invoiceItemID,
        description: matchedItem.description, // Use canonical description from master
        quantity: row.quantity,
        rate: row.rate,
        date: row.date,
      });
    } else {
      unmatchedDescriptions.add(row.description);
    }
  }

  // Build unmatched items list with unique descriptions
  const unmatched: UnmatchedItem[] = Array.from(unmatchedDescriptions).map((desc) => ({
    description: desc,
  }));

  return { matched, unmatched };
}

/**
 * Create missing invoice item masters
 * Called after user confirms they want to create the unmatched items
 */
export async function createMissingInvoiceItems(
  companyID: string,
  items: UnmatchedItem[]
): Promise<InvoiceItemMaster[]> {
  const created: InvoiceItemMaster[] = [];
  const createdAt = new Date().toISOString().split('T')[0];

  for (const item of items) {
    const invoiceItemID = generateID('II');
    
    const invoiceItemMaster: InvoiceItemMaster = {
      invoiceItemID,
      companyID,
      description: item.description,
      defaultRate: item.defaultRate || null,
      createdAt,
    };

    await invoiceItemMastersDB.createInvoiceItemMaster(invoiceItemMaster);
    created.push(invoiceItemMaster);
  }

  return created;
}

/**
 * Get suggestions for unmatched descriptions
 * Uses fuzzy matching to suggest similar existing items
 */
export async function getSuggestionsForUnmatched(
  companyID: string,
  unmatchedDescription: string
): Promise<string[]> {
  const allItems = await invoiceItemMastersDB.listInvoiceItemMasters(companyID);
  const normalized = unmatchedDescription.toLowerCase().trim();

  // Simple fuzzy matching: find items that contain or are contained by the search term
  const suggestions = allItems
    .filter((item) => {
      const itemDesc = item.description.toLowerCase().trim();
      return itemDesc.includes(normalized) || normalized.includes(itemDesc);
    })
    .map((item) => item.description)
    .slice(0, 5); // Limit to 5 suggestions

  return suggestions;
}

// Made with Bob