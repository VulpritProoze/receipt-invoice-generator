# ADR-016: Nested Invoice Structure

---

doc_id: DEC-016
title: Nested Invoice Structure
version: 1.0.0
status: accepted
created: 2026-05-23
updated: 2026-05-23
author: Bob
reviewers: none
tags: decision, invoice, data-model, billing-users
changelog:
  - version: 1.0.0
    date: 2026-05-23
    author: Bob
    note: Initial decision documenting Phase 2 invoice structure implementation

---

## Context

With the introduction of the Billing User system (see DEC-014), invoices are no longer generated from a flat list of invoice items. Instead, they are generated from `BillingHistory` entries — time-stamped transactions that link billing users to invoice item masters.

The system needs to decide how to structure invoice data when multiple billing history entries exist for the same service type. For example:

**Scenario:** A customer has 3 billing history entries for "Web Hosting":
- 2026-01-15: 1 unit @ $50
- 2026-02-15: 1 unit @ $50
- 2026-03-15: 1 unit @ $55 (price increased)

**Question:** How should these appear on the invoice?

**Options:**
1. **Flat list** — 3 separate line items, each with description "Web Hosting"
2. **Grouped with subtotals** — 1 line item "Web Hosting" with quantity 3 and subtotal $155
3. **Nested structure** — 1 line item "Web Hosting" containing 3 sub-entries with individual dates/rates

Additionally, the system must decide:
- **Snapshot vs. live references** — Should invoices store billing history data or reference it?
- **Amount calculation** — Should amounts be stored or calculated at render time?
- **Traceability** — How to maintain links to original billing history records?

## Decision

We implement a **nested JSON structure with snapshot data and render-time calculation**:

### 1. Nested Invoice Structure

**Data model:**

```typescript
interface InvoiceItemWithHistory {
  invoiceItemID: string;           // Groups entries by service type
  description: string;              // Canonical description from master
  billingHistoryEntries: BillingHistoryEntry[];  // Nested array
}

interface BillingHistoryEntry {
  billingHistoryID: string;         // Traceability to original record
  quantity: number;
  rate: number;
  date: string;                     // ISO date (YYYY-MM-DD)
  amount: number;                   // Calculated: quantity × rate
}
```

**Example invoice JSON:**

```json
{
  "invoiceID": "INV000000042",
  "billingUserID": "BU_ABC123",
  "invoiceItems": [
    {
      "invoiceItemID": "II_XYZ789",
      "description": "Web Hosting",
      "billingHistoryEntries": [
        {
          "billingHistoryID": "BH_001",
          "quantity": 1,
          "rate": 50.00,
          "date": "2026-01-15",
          "amount": 50.00
        },
        {
          "billingHistoryID": "BH_002",
          "quantity": 1,
          "rate": 50.00,
          "date": "2026-02-15",
          "amount": 50.00
        },
        {
          "billingHistoryID": "BH_003",
          "quantity": 1,
          "rate": 55.00,
          "date": "2026-03-15",
          "amount": 55.00
        }
      ]
    }
  ]
}
```

**Rationale:**
- **Clarity** — Groups related transactions under a single service heading
- **Detail preservation** — Shows individual dates and rates (important for auditing)
- **Flexibility** — Supports variable rates and quantities within one invoice
- **Readability** — Invoice PDF can show grouped items with expandable detail

### 2. Grouping by invoiceItemID

**Implementation:** `invoiceService.ts` groups billing history entries by `invoiceItemID` before building the invoice structure.

```typescript
const groupedByItem = new Map<string, BillingHistory[]>();
for (const entry of billingHistoryEntries) {
  const existing = groupedByItem.get(entry.invoiceItemID) || [];
  existing.push(entry);
  groupedByItem.set(entry.invoiceItemID, existing);
}
```

**Rationale:**
- **Logical grouping** — All "Web Hosting" entries appear together
- **Consistent ordering** — Items appear in a predictable order on the invoice
- **Subtotal calculation** — Easy to sum all entries for one service type
- **PDF rendering** — Natural structure for invoice layout (service → line items)

### 3. Snapshot Approach (Not Live References)

**Decision:** Invoice stores a **snapshot** of billing history data at invoice creation time.

**What is stored:**
- `billingHistoryID` — Reference for traceability
- `quantity`, `rate`, `date`, `amount` — Snapshot values

**What is NOT stored:**
- Live references that would fetch current billing history data
- Pointers to external records that could change

**Rationale:**
- **Immutability** — Invoices are legal documents; they must not change after creation
- **Auditability** — Invoice shows exactly what was billed, even if billing history is later corrected
- **Performance** — No need to join billing history table when displaying invoices
- **Data integrity** — Invoice remains valid even if billing history records are deleted

**Trade-off accepted:** If billing history is corrected after invoice creation, the invoice does not auto-update. This is intentional — invoices are point-in-time snapshots.

### 4. Amount Calculation at Render Time

**Decision:** The `amount` field in `BillingHistoryEntry` is calculated during invoice creation and stored in the snapshot. However, **Subtotal, Tax Amount, and Invoice Total are NEVER stored** — they are calculated at render time.

**Implementation:** `calculateInvoiceTotals()` in `invoiceService.ts`:

```typescript
export function calculateInvoiceTotals(invoice: Invoice): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = invoice.invoiceItems.reduce((sum, item) => {
    const itemTotal = item.billingHistoryEntries.reduce((itemSum, entry) => {
      return itemSum + entry.amount;
    }, 0);
    return sum + itemTotal;
  }, 0);

  const taxAmount = subtotal * invoice.taxRate;
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.max(0, subtotal),
    taxAmount: Math.max(0, taxAmount),
    total: Math.max(0, total)
  };
}
```

**Rationale:**
- **Single source of truth** — Totals are derived from line items, not stored separately
- **Consistency** — Impossible for stored total to drift from line item sum
- **Tax rate changes** — If tax rate is corrected, totals recalculate automatically
- **Security** — Guards against negative totals (see `Math.max(0, ...)`)

**Why store `amount` but not `subtotal`?**
- `amount` is a line-level calculation (quantity × rate) — part of the snapshot
- `subtotal`, `taxAmount`, `total` are document-level aggregations — derived from snapshot

## Alternatives Considered

### Alternative 1: Flat List with Repeated Descriptions

| Aspect | Pros | Cons | Reason Rejected |
|--------|------|------|-----------------|
| Each billing history entry becomes a separate invoice line | Simple data structure, easy to implement | Cluttered invoice (3 "Web Hosting" lines), poor readability, no logical grouping | Poor UX — invoices look unprofessional with repeated descriptions |

### Alternative 2: Grouped with Aggregated Totals Only

| Aspect | Pros | Cons | Reason Rejected |
|--------|------|------|-----------------|
| One line per service: "Web Hosting: 3 units @ $155 total" | Clean invoice, simple structure | Loses date detail, can't show variable rates, poor auditability | Insufficient detail — businesses need to see individual transaction dates |

### Alternative 3: Live References to Billing History

| Aspect | Pros | Cons | Reason Rejected |
|--------|------|------|-----------------|
| Invoice stores only `billingHistoryID` array, fetches data on render | Always current, no data duplication | Invoices change if billing history changes, performance overhead, breaks immutability | Violates legal document requirements — invoices must be immutable |

### Alternative 4: Store All Calculated Values

| Aspect | Pros | Cons | Reason Rejected |
|--------|------|------|-----------------|
| Store `amount`, `subtotal`, `taxAmount`, `total` in invoice | Fast rendering, no calculation needed | Data duplication, sync problems if tax rate changes, harder to maintain | Creates single source of truth violations — stored totals can drift from line items |

## Consequences

### Positive

- **Professional invoices** — Grouped items with detail look like real business invoices
- **Audit trail** — Every line item traces back to a billing history record via `billingHistoryID`
- **Immutability** — Invoices are point-in-time snapshots that don't change
- **Flexibility** — Supports variable rates, quantities, and dates within one service type
- **Correctness** — Totals always match line items (calculated, not stored)
- **Performance** — No joins needed to display invoices (snapshot is self-contained)

### Negative

- **Data duplication** — Billing history data is copied into invoice (acceptable for immutability)
- **No auto-correction** — If billing history is corrected, invoice doesn't update (intentional)
- **Complex structure** — Nested JSON is harder to query than flat tables
- **Calculation overhead** — Totals must be recalculated every time invoice is displayed (minimal cost)

### Risks

**Risk 1: Billing history deleted after invoice creation**
- **Scenario:** User deletes billing history record; invoice still references it via `billingHistoryID`
- **Mitigation:** Invoice has snapshot data; `billingHistoryID` is for traceability only
- **Impact:** Low — invoice remains valid and displayable

**Risk 2: Tax rate changed after invoice creation**
- **Scenario:** User realizes tax rate was wrong, updates invoice; totals recalculate
- **Mitigation:** `calculateInvoiceTotals()` uses current `invoice.taxRate` from stored invoice
- **Impact:** Acceptable — invoice can be edited before sending to customer

**Risk 3: Negative amounts from bad data**
- **Scenario:** Billing history has negative quantity or rate (should be prevented by schema)
- **Mitigation:** `Math.max(0, total)` guards against negative totals; schema validation prevents negative inputs
- **Impact:** Low — defense in depth protects against edge cases

**Risk 4: Large invoices with many entries**
- **Scenario:** Invoice with 100+ billing history entries across 20+ service types
- **Mitigation:** Nested structure groups entries; calculation is O(n) but fast for reasonable sizes
- **Impact:** Low — typical invoices have <50 line items

## Implementation Notes

### Files Modified

- `src/models/invoice.ts` — Added `InvoiceItemWithHistory` and `BillingHistoryEntry` types
- `src/modules/invoices/invoiceService.ts` — Implemented grouping and calculation logic
- `src/lib/db/invoices.ts` — Stores nested JSON structure
- `src/lib/db/billingHistory.ts` — Added `markBillingHistoryAsBilled()` to link entries to invoices

### Database Schema

**invoices table:**
```sql
CREATE TABLE invoices (
  invoice_id TEXT PRIMARY KEY,
  billing_user_id TEXT NOT NULL,
  invoice_items TEXT NOT NULL,  -- JSON: InvoiceItemWithHistory[]
  -- ... other fields
  FOREIGN KEY (billing_user_id) REFERENCES billing_users(billing_user_id)
);
```

**billing_history table:**
```sql
CREATE TABLE billing_history (
  billing_history_id TEXT PRIMARY KEY,
  billing_user_id TEXT NOT NULL,
  invoice_item_id TEXT NOT NULL,
  invoice_id TEXT,  -- NULL = unbilled, non-NULL = billed
  -- ... other fields
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
);
```

### Testing Coverage

- Unit tests: `invoiceService.unit.test.ts` — Tests `calculateInvoiceTotals()` and grouping logic
- Schema tests: `invoice.schema.test.ts` — Validates nested structure against Zod schema
- Security tests: `core.security.test.ts` — Guards against negative totals

### PDF Rendering

**Invoice PDF structure:**
```
Invoice #INV000000042

Service: Web Hosting
  2026-01-15  1 × $50.00 = $50.00
  2026-02-15  1 × $50.00 = $50.00
  2026-03-15  1 × $55.00 = $55.00
                Subtotal: $155.00

Service: Domain Registration
  2026-01-20  1 × $15.00 = $15.00
                Subtotal: $15.00

                Subtotal: $170.00
           Tax (12.0%): $20.40
                 Total: $190.40
```

## References

- Parent ADR: DEC-014 (Billing User System Architecture)
- Related ADR: DEC-015 (Invoice Item Matching Strategy)
- Implementation: `src/modules/invoices/invoiceService.ts`
- Plan: `docs/plans/014-billing-user-system-refactor.md` (sections 4.3-4.4)
- Security: `src/modules/core.security.test.ts` (negative total guard)

## Status

**Accepted** — Implemented in Phase 2 service layer. Nested structure is functional and tested. Invoice creation with grouped billing history entries is working. PDF rendering pending in Phase 4.