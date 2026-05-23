# Code Exploration: BillGen Billing User UI — Phase 4 Scope

---

doc_id: CODE-EXPLORATION-BILLGEN-PHASE4-UI-2026-05-23
title: BillGen Phase 4 UI Exploration Summary
version: 1.0.0
status: approved
created: 2026-05-23
updated: 2026-05-23
author: research-subagent
reviewers: none
tags: code-exploration, billgen, billing-users, billing-history, invoice-item-masters, phase4, ui, import
changelog:
  - version: 1.0.0
    date: 2026-05-23
    author: research-subagent
    note: Scoped exploration for Phase 4 UI planning — covers app pages, API routes, DB adapters, service modules, and import flow for the billing user system

---

## Summary

Focused exploration of the BillGen codebase layer relevant to Phase 4 (UI for billing user management and scoped import), confirming that all backend infrastructure through Phase 3 is complete and identifying the exact gap: zero UI pages exist under `src/app/billing-users/`.

---

## Codebase Overview

- **Repository:** `receipt-invoice-generator`
- **Root Path:** `D:\User Folder\Magus Files\RRA Personal Folder\HelloWorld\Web Dev\receipt-invoice-generator\receipt-invoice-generator`
- **Primary Language(s):** TypeScript, TSX (Next.js 14 App Router)
- **Total Files (scoped):** ~40 files examined across `src/app/`, `src/modules/`, `src/lib/db/`, `src/models/`, `src/schemas/`, `src/components/`
- **Total Lines of Code (scoped):** ~3,000 lines across examined files

---

## Modules / Packages

| Module / Package | Description | Key Files |
| ---------------- | ----------- | --------- |
| `src/app/billing-users/` | **Does not exist yet** — no UI pages for billing users | *(to be created in Phase 4)* |
| `src/app/api/billing-users/` | API routes for billing user CRUD and history | `route.ts`, `[id]/route.ts`, `[id]/history/route.ts` |
| `src/app/api/import/` | File import API (CSV/XLSX); currently uses `userID` — needs fix to `billingUserID` | `route.ts`, `sample/route.ts`, `create-items/route.ts` |
| `src/app/api/invoices/` | Invoice CRUD; `/api/invoices` POST now accepts `billingHistoryIDs[]` | `route.ts`, `[invoiceID]/route.ts`, `items/route.ts` |
| `src/app/api/invoice-items/` | Invoice Item Master CRUD (catalog of billable services) | `route.ts`, `[id]/route.ts` |
| `src/modules/billingUsers/` | Service layer: `createBillingUser`, `getBillingUser`, `updateBillingUser`, `deleteBillingUser` (cascade check), `listBillingUsers` | `billingUserService.ts` |
| `src/modules/billingHistory/` | Service layer: `createBillingHistory`, `getBillingHistoryForUser`, `getUnbilledHistory`, `markAsBilled` (double-billing guard) | `billingHistoryService.ts` |
| `src/modules/import/` | Full import pipeline: parse → match descriptions to catalog → create billing_history; accepts `billingUserID` as first param | `importService.ts`, `importMatcher.ts`, `csvParser.ts`, `xlsxParser.ts`, `fileValidator.ts` |
| `src/modules/invoices/` | Invoice generation service; builds nested JSON from billing history entries grouped by `invoiceItemID` | `invoiceService.ts` |
| `src/lib/db/billingUsers.ts` | DB router (SQLite default / Redis stub) for billing_users table | `billingUsers.ts`, `sqlite/billingUsers.ts` |
| `src/lib/db/billingHistory.ts` | DB router for billing_history table; supports filters: `startDate`, `endDate`, `billedStatus`, `invoiceItemID` | `billingHistory.ts`, `sqlite/billingHistory.ts` |
| `src/lib/db/invoiceItemMasters.ts` | DB router for invoice_item_masters table; case-insensitive description lookup | `invoiceItemMasters.ts`, `sqlite/invoiceItemMasters.ts` |
| `src/models/billingUser.ts` | Zod schema + TypeScript type for BillingUser entity | `billingUser.ts` |
| `src/models/invoice.ts` | Zod schemas: `invoiceItemMasterSchema`, `invoiceSchema`, `invoiceItemWithHistorySchema`, `billingHistoryEntrySchema` | `invoice.ts` |
| `src/schemas/invoice.schema.ts` | Request validation schemas: `invoiceCreateRequestSchema` (uses `billingUserID` + `billingHistoryIDs[]`) | `invoice.schema.ts` |
| `src/components/Nav.tsx` | Site nav — needs update: add "Clients" → `/billing-users`, remove "Import" link | `Nav.tsx` |
| `src/app/import/page.tsx` | Existing standalone import page — uses old `userID` param; will become orphaned after Phase 4 nav update | `page.tsx` |
| `src/app/invoices/new/page.tsx` | Existing invoice creation page — uses old flat "Bill To" form; will be replaced by `/billing-users/[id]/invoices/new` in Phase 5 | `page.tsx` |

---

## Key Findings

- **Architecture:** Next.js 14 App Router with server-side API routes (`route.ts`) and client-side page components (`'use client'`). Data layer is SQLite via better-sqlite3 with a Redis fallback router. Auth is NextAuth.js CredentialsProvider (single-tenant). Services in `src/modules/` wrap DB adapters and add business logic.

- **Main Entry Points:**
  - Client pages: `src/app/[route]/page.tsx`
  - API handlers: `src/app/api/[route]/route.ts`
  - DB adapters: `src/lib/db/*.ts` (router) → `src/lib/db/sqlite/*.ts` (implementation)
  - Services: `src/modules/[domain]/[domain]Service.ts`
  - Auth entry: `src/app/api/auth/[...nextauth]/route.ts`

- **Common Patterns / Conventions:**
  - All client pages use `useSession()` from `next-auth/react` for auth guard
  - API routes use `getCurrentUserId()` (server-side) — no `userID` query params on new routes
  - DB adapters use `billingUserSchema.parse(row)` on every read (runtime validation)
  - `fetch-merge-validate-write` pattern for all PATCH operations
  - Zod schemas in `src/models/` define the canonical entity shape; `src/schemas/` defines request/response shapes
  - camelCase aliases in all SQLite SELECTs (`billing_user_id as billingUserID`)
  - All SQLite tables have snake_case column names

- **Potential Pain Points / Technical Debt:**
  1. **`/api/import/route.ts` uses `userID`** — must be changed to `billingUserID` before new import pages can work; this is the only broken contract between Phase 3 backend and Phase 4 UI.
  2. **`/invoices/new/page.tsx` uses old flat "Bill To" form** — still functional but will conflict with the new billing-user-scoped workflow once Phase 5 is implemented.
  3. **`/api/invoices?userID=` query param** — the invoice list route filters by `userID` (auth user), not `billingUserID`; client-side filtering by `billingUserID` is the workaround until the API is updated.
  4. **Receipts have no `billingUserID` field** — filtering receipts by client requires fetching invoices first to get the relevant `invoiceID` set, then filtering receipts. An extra fetch round-trip.
  5. **Old `/import` page remains reachable by URL** — it will be de-linked from nav but not deleted; a "deprecated" notice or redirect should be considered.

---

## Data Model Shapes (Phase 4 Reference)

### BillingUser
```typescript
{
  billingUserID: string;   // PK
  companyID:     string;
  name:          string;   // max 200
  addressLine:   string;   // max 200
  cityAddress:   string;   // max 100
  postalAddress: string;   // max 50
  country:       string;   // max 100
  createdAt:     string;   // YYYY-MM-DD
}
```

### BillingHistory
```typescript
{
  billingHistoryID: string;
  billingUserID:    string;   // FK → billing_users
  invoiceItemID:    string;   // FK → invoice_item_masters
  quantity:         number;   // integer ≥ 1
  rate:             number;   // ≥ 0.01
  date:             string;   // YYYY-MM-DD
  billedStatus:     'unbilled' | 'billed';
  invoiceID:        string | null;   // null = unbilled
  createdAt:        string;
}
```

### InvoiceItemMaster
```typescript
{
  invoiceItemID: string;
  companyID:     string;
  description:   string;   // max 500; case-insensitive match during import
  defaultRate:   number | null;   // ≥ 0.01
  createdAt:     string;
}
```

### Invoice (nested structure per DEC-016)
```typescript
{
  invoiceID:     string;   // /^INV\d{9}$/
  billingUserID: string;
  invoiceDate:   string;
  terms:         string;
  dueDate:       string;
  currency:      'PHP' | 'USD';
  taxRate:       number;   // 0–1
  invoiceItems:  InvoiceItemWithHistory[];   // JSON-serialized in DB
  createdAt:     string;
}

interface InvoiceItemWithHistory {
  invoiceItemID: string;
  description:   string;
  billingHistoryEntries: BillingHistoryEntry[];
}

interface BillingHistoryEntry {
  billingHistoryID: string;
  quantity: number;
  rate:     number;
  date:     string;
  amount:   number;   // quantity × rate, stored as snapshot
}
```

---

## API Route Map (Phase 4 Relevant)

| Route | Methods | Used By |
| ----- | ------- | ------- |
| `/api/billing-users` | GET, POST | Billing users list page |
| `/api/billing-users/[id]` | GET, PATCH, DELETE | Billing user detail + list (edit/delete) |
| `/api/billing-users/[id]/history` | GET | Detail page billing history tab; invoice wizard step 2 |
| `/api/import` | POST | Scoped import page *(route needs `userID`→`billingUserID` fix)* |
| `/api/import/sample` | GET | Scoped import page (sample CSV download) |
| `/api/import/create-items` | POST | Scoped import page (unmatched items flow) |
| `/api/invoice-items` | GET | Invoice wizard step 1 (item catalog) |
| `/api/invoices` | GET, POST | Invoice wizard submit; detail page invoices tab (filter client-side) |
| `/api/receipts` | GET | Detail page receipts tab (filter client-side via invoice set) |

---

## Files Added / Modified / Removed (Phase 4 Plan)

| Change Type | File Path | Reason |
| ----------- | --------- | ------ |
| Added | `src/app/billing-users/page.tsx` | Billing users list page with CRUD |
| Added | `src/app/billing-users/[id]/page.tsx` | Billing user detail (tabbed: history, invoices, receipts) |
| Added | `src/app/billing-users/[id]/import/page.tsx` | Scoped import per billing user |
| Added | `src/app/billing-users/[id]/invoices/new/page.tsx` | Multi-step invoice generation wizard |
| Modified | `src/app/api/import/route.ts` | Fix `userID` → `billingUserID` parameter |
| Modified | `src/components/Nav.tsx` | Add "Clients" link; remove "Import" link |
| Modified | `docs/decisions/DEC-014-billing-user-architecture.md` | Mark Phase 3 complete; Phase 4 in-progress |

---

## Recommendations for Future Work

- **Phase 5**: Replace `/invoices/new/page.tsx` flat "Bill To" form with the billing-user-scoped wizard flow defined in DEC-016.
- **Receipts API filter**: Add `billingUserID` query param to `GET /api/receipts` to avoid the double-fetch workaround in the billing user detail receipts tab.
- **Old `/import` page**: Add a redirect from `/import` → `/billing-users` or show a deprecation banner, since it's now unreachable from the nav but still accessible by URL.
- **`/api/invoices` filter**: Add server-side `billingUserID` filter to `GET /api/invoices` instead of client-side filtering, for performance at scale.
- **Phase 6**: Automated data migration script to convert existing flat invoices to the billing-user-scoped format (extract unique bill-to combinations as `BillingUser` records).

---

## Next Steps

1. Verify Phase 4 implementation: run `npx tsc --noEmit` and `npx eslint src/app/billing-users/ src/components/Nav.tsx src/app/api/import/route.ts` for zero errors.
2. Manual smoke test: create a billing user → import CSV → generate invoice → verify redirect to `/invoices/[id]`.
3. Begin Phase 5 planning: update `/invoices/new/page.tsx` to replace the legacy "Bill To" form with the billing-user selector + billing-history multi-step flow (per DEC-016).

---

*Derived from the research subagent survey conducted 2026-05-23 in support of DEC-014 Phase 4 orchestration. Cross-reference: [exploration-billgen-2026-05-23.md](file:///D:/User%20Folder/Magus%20Files/RRA%20Personal%20Folder/HelloWorld/Web%20Dev/receipt-invoice-generator/receipt-invoice-generator/.agents/code-exploration/exploration-billgen-2026-05-23.md) for the full system overview.*
