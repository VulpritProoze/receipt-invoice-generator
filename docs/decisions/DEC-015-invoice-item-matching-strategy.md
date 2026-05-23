# ADR-015: Invoice Item Matching Strategy

---

doc_id: DEC-015
title: Invoice Item Matching Strategy
version: 1.0.0
status: accepted
created: 2026-05-23
updated: 2026-05-23
author: Bob
reviewers: none
tags: decision, import, matching, billing-users
changelog:
  - version: 1.0.0
    date: 2026-05-23
    author: Bob
    note: Initial decision documenting Phase 2 import matching implementation

---

## Context

With the introduction of the Billing User system (see DEC-014), the CSV/XLSX import flow fundamentally changed. Previously, imported rows became `InvoiceItem` records directly. Now, imports must:

1. Match imported descriptions to existing `InvoiceItemMaster` records (the catalog of billable services)
2. Create `BillingHistory` entries linking billing users to matched items
3. Handle cases where imported descriptions don't match any existing catalog items

The system needs a strategy for:
- **Matching logic** — How to determine if an imported description matches a catalog item
- **Unmatched handling** — What to do when no match is found
- **User confirmation** — Whether to auto-create missing items or require user approval
- **Fuzzy matching** — Whether to suggest similar items for unmatched descriptions

Without a clear matching strategy, users would face:
- Manual item creation for every unique description (tedious)
- Inconsistent service descriptions across invoices (data quality issues)
- No way to standardize billing items (reporting problems)

## Decision

We implement a **case-insensitive exact match with user-confirmed creation** strategy:

### 1. Case-Insensitive Description Matching

**Implementation:** `importMatcher.ts` normalizes descriptions to lowercase and trims whitespace before comparison.

```typescript
const normalizedDesc = row.description.toLowerCase().trim();
const matchedItem = itemMap.get(normalizedDesc);
```

**Rationale:**
- Handles common input variations ("Web Hosting" vs "web hosting" vs "WEB HOSTING")
- Simple, predictable behavior — users understand exact matching
- No false positives from overly aggressive fuzzy matching
- Fast lookup using Map data structure

### 2. Unmatched Item Handling Flow

**When an imported description has no match:**

1. The description is collected in an `unmatched` array
2. Import process pauses and returns both `matched` and `unmatched` results
3. UI displays unmatched items to the user
4. User reviews and confirms whether to create new catalog items
5. Only after confirmation: `createMissingInvoiceItems()` is called
6. Import completes with all items now matched

**Rationale:**
- **User control** — Prevents accidental catalog pollution from typos or one-off items
- **Data quality** — User can correct typos before they become catalog entries
- **Intentionality** — User explicitly decides which services belong in the catalog
- **Audit trail** — Clear record of when and why catalog items were created

### 3. Fuzzy Matching Suggestions

**Implementation:** `getSuggestionsForUnmatched()` provides up to 5 similar items using substring matching.

```typescript
const suggestions = allItems
  .filter((item) => {
    const itemDesc = item.description.toLowerCase().trim();
    return itemDesc.includes(normalized) || normalized.includes(itemDesc);
  })
  .map((item) => item.description)
  .slice(0, 5);
```

**Rationale:**
- **Typo detection** — Helps user spot "Web Hsoting" when "Web Hosting" exists
- **Variant awareness** — Shows "Monthly Hosting" when user imports "Hosting - Monthly"
- **Simple algorithm** — Substring matching is fast and understandable
- **Limited results** — 5 suggestions prevent overwhelming the user
- **Non-blocking** — Suggestions are advisory; user can still create new item

### 4. Default Rate Handling

**Unmatched items can optionally include a default rate:**

```typescript
export interface UnmatchedItem {
  description: string;
  defaultRate?: number;
}
```

**Rationale:**
- **Convenience** — If CSV includes rate, it can become the default for future invoices
- **Optional** — Not required; user can set rates per-transaction
- **Flexibility** — Supports both fixed-rate services and variable-rate services

## Alternatives Considered

### Alternative 1: Fuzzy Matching with Auto-Creation

| Aspect | Pros | Cons | Reason Rejected |
|--------|------|------|-----------------|
| Auto-create items with >80% similarity match | Seamless import, no user intervention | False positives ("Hosting" matches "Ghost Hosting"), catalog pollution, no user control | Too risky — one typo creates permanent catalog entry |

### Alternative 2: Manual Item Creation Before Import

| Aspect | Pros | Cons | Reason Rejected |
|--------|------|------|-----------------|
| Require all catalog items exist before import | Perfect data quality, no surprises | Tedious for new users, blocks import workflow, poor UX | Violates "import first, organize later" mental model |

### Alternative 3: Tag-Based Matching

| Aspect | Pros | Cons | Reason Rejected |
|--------|------|------|-----------------|
| Match by tags/categories instead of description | Flexible, handles variants | Requires tagging infrastructure, complex UI, users must learn tagging system | Over-engineered for MVP scope |

### Alternative 4: Levenshtein Distance Fuzzy Matching

| Aspect | Pros | Cons | Reason Rejected |
|--------|------|------|-----------------|
| Use edit distance algorithm for matching | More sophisticated, handles typos better | Slower, harder to explain, requires threshold tuning, still needs user confirmation | Substring matching is "good enough" for Phase 2 |

## Consequences

### Positive

- **Predictable behavior** — Users understand exact matching; no "magic" matching surprises
- **Data quality** — User confirmation prevents catalog pollution from typos
- **Fast performance** — Map-based lookup is O(1); substring suggestions are O(n) but acceptable for small catalogs
- **Extensible** — Can upgrade to Levenshtein or ML-based matching later without breaking API
- **User-friendly** — Suggestions help users spot mistakes without forcing decisions

### Negative

- **Extra step** — Import requires user confirmation for unmatched items (not fully automated)
- **Case sensitivity edge cases** — "Web Hosting" and "WEB HOSTING" match, but "Web-Hosting" doesn't match "Web Hosting" (hyphen vs space)
- **Limited fuzzy logic** — Substring matching misses some typos ("Hsoting" won't suggest "Hosting")
- **No learning** — System doesn't learn from user corrections (e.g., if user always maps "Hosting" to "Web Hosting")

### Risks

**Risk 1: Catalog bloat from similar items**
- **Scenario:** User creates "Web Hosting", "Website Hosting", "Hosting - Web" as separate items
- **Mitigation:** Suggestions show similar items; user can choose to reuse existing item
- **Future:** Add catalog management UI with merge/rename capabilities

**Risk 2: Import blocked by unmatched items**
- **Scenario:** Large CSV with many unmatched items requires extensive user review
- **Mitigation:** Batch creation UI allows confirming all at once; suggestions speed up review
- **Future:** Add "remember this mapping" feature for recurring imports

**Risk 3: Substring matching false positives**
- **Scenario:** "Hosting" suggests "Ghost Hosting" and "Hosting Fee" (too broad)
- **Mitigation:** Limit to 5 suggestions; user makes final decision
- **Future:** Rank suggestions by relevance (exact substring match > partial match)

## Implementation Notes

### Files Modified

- `src/modules/import/importMatcher.ts` — Core matching logic
- `src/modules/import/importService.ts` — Orchestrates matching and creation
- `src/lib/db/invoiceItemMasters.ts` — Database operations for catalog items

### Testing Coverage

- Unit tests: `importMatcher.unit.test.ts` (to be created in Phase 2 testing)
- Fixture tests: `import.fixture.test.ts` (existing, covers end-to-end import)
- Security tests: `import.security.test.ts` (existing, validates file handling)

### API Contract

**Match endpoint** (future):
```typescript
POST /api/import/match
Body: { companyID, rows: ParsedImportRow[] }
Response: { matched: MatchedItem[], unmatched: UnmatchedItem[] }
```

**Create missing items endpoint** (future):
```typescript
POST /api/invoice-items/batch
Body: { companyID, items: UnmatchedItem[] }
Response: { created: InvoiceItemMaster[] }
```

## References

- Parent ADR: DEC-014 (Billing User System Architecture)
- Implementation: `src/modules/import/importMatcher.ts`
- Plan: `docs/plans/014-billing-user-system-refactor.md` (sections 4.3-4.4)
- Related: DEC-016 (Nested Invoice Structure)

## Status

**Accepted** — Implemented in Phase 2 service layer. Matching logic is functional and tested via fixture tests. UI integration pending in Phase 4.