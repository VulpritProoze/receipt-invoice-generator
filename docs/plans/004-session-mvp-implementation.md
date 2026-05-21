# Session Plan: MVP Implementation

---

doc_id: PLAN-SESSION-MVP-001
version: 1.0.0
status: draft
created: 2026-05-21
updated: 2026-05-21
author: Orchestrator2
reviewers: none
tags: plan, mvp, session, implementation
changelog:
  - version: 1.0.0
    date: 2026-05-21
    author: Orchestrator2
    note: Initial comprehensive session plan for MVP implementation

---

## Overview

This plan provides a detailed, step-by-step breakdown of the MVP implementation tasks from [`docs/plans/implement-mvp.md`](implement-mvp.md). It translates the high-level tasks (T1-T5) into concrete implementation steps with clear mode assignments, file operations, and verification criteria.

## Current State Analysis

### Completed Work
- ✅ Phase 0-2: Dependency research, project scaffold, agent files
- ✅ API validation fixes with explicit null/undefined checks
- ✅ Site shell: Nav, Footer, Providers (demo user context)
- ✅ UI primitives: Button, Container components
- ✅ Zod schemas exist in [`src/models/`](../../src/models/) for Invoice, Receipt, User, Company

### Current Issues
1. **Validation duplication**: Routes have manual field checks (lines 16-46 in [`invoices/route.ts`](../../src/app/api/invoices/route.ts)) instead of using Zod schemas
2. **Demo provider**: [`src/app/providers.tsx`](../../src/app/providers.tsx) exposes hardcoded demo user, not pluggable
3. **Missing pages**: No client-facing pages for invoices, receipts, or users
4. **No reporting**: No export/download endpoints for reports

## Task Breakdown

### T1: Centralize Input Validation (Priority: HIGH)

**Goal**: Replace manual field validation in API routes with centralized Zod schema validation

**Mode**: Code mode

**Steps**:

1. **Create schema registry** (new file)
   - File: `src/schemas/index.ts`
   - Export all schemas from models with request/response variants
   - Create request DTOs (without generated fields like `invoiceID`, `createdAt`)
   
2. **Create invoice request schema** (new file)
   - File: `src/schemas/invoice.schema.ts`
   - Define `invoiceCreateRequestSchema` (omits `invoiceID`, `createdAt`)
   - Define `invoiceUpdateRequestSchema` (partial fields)
   - Export both schemas

3. **Create receipt request schema** (new file)
   - File: `src/schemas/receipt.schema.ts`
   - Define `receiptCreateRequestSchema` (omits `receiptID`, `createdAt`)
   - Export schema

4. **Update invoices route** (edit)
   - File: `src/app/api/invoices/route.ts`
   - Remove manual validation (lines 16-54)
   - Import and use `invoiceCreateRequestSchema.safeParse(body)`
   - Return structured Zod errors on validation failure

5. **Update receipts route** (edit)
   - File: `src/app/api/receipts/route.ts`
   - Import and use `receiptCreateRequestSchema.safeParse(body)`
   - Maintain invoice existence check logic

**Acceptance Criteria**:
- ✅ All manual `requiredFields` checks removed from routes
- ✅ Routes use `schema.safeParse()` for validation
- ✅ Error responses include structured Zod error details
- ✅ No changes to external API contracts (same fields required)

**Verification**:
- Manual: Test with curl/Postman - valid payload returns 201, invalid returns 400 with details
- Code review: Confirm no manual field checks remain

---

### T2: Replace Demo Provider with Auth Stub (Priority: MEDIUM)

**Goal**: Create pluggable authentication provider that can be swapped for real auth later

**Mode**: Code mode

**Steps**:

1. **Create auth provider interface** (new file)
   - File: `src/providers/auth-provider.tsx`
   - Define `AuthUser` type: `{ id: string; name: string; email: string }`
   - Define `AuthContextType`: `{ user: AuthUser | null; isAuthenticated: boolean; login: () => Promise<void>; logout: () => Promise<void> }`
   - Create `AuthProvider` component with demo implementation
   - Export `useAuth()` hook

2. **Create auth utility** (new file)
   - File: `src/lib/auth.ts`
   - Implement `getCurrentUserId()` - returns demo user ID for now
   - Add comment: "// TODO: Replace with real session/JWT validation"

3. **Update root layout** (edit)
   - File: `src/app/layout.tsx`
   - Replace `<Providers>` with `<AuthProvider>`
   - Keep existing layout structure

4. **Deprecate demo context** (edit)
   - File: `src/app/providers.tsx`
   - Add deprecation comment at top
   - Keep file for backward compatibility during transition

**Acceptance Criteria**:
- ✅ `AuthProvider` exposes clear interface (getUser, isAuthenticated, login, logout)
- ✅ App renders with mock authenticated user
- ✅ Nav component can access user via `useAuth()`
- ✅ No breaking changes to existing components

**Verification**:
- Manual: Start dev server, confirm Nav shows user name
- Manual: Check browser console for no errors

---

### T3: Add Page Scaffolds (Priority: HIGH)

**Goal**: Create navigable client pages for core features

**Mode**: Code mode

**Steps**:

1. **Create Table component** (new file)
   - File: `src/components/ui/Table.tsx`
   - Props: `columns: { key: string; label: string }[]`, `data: any[]`, `onRowClick?: (row: any) => void`
   - Render responsive table with headers and rows
   - Use existing Button component for actions

2. **Create invoices list page** (new file)
   - File: `src/app/invoices/page.tsx`
   - Fetch invoices from `/api/invoices?userID=xxx`
   - Display in Table component
   - Columns: Invoice ID, Date, Bill To, Total, Actions
   - "Create Invoice" button → links to `/invoices/new`

3. **Create invoice detail page** (new file)
   - File: `src/app/invoices/[id]/page.tsx`
   - Fetch single invoice from `/api/invoices/[id]`
   - Display invoice details in structured layout
   - "Generate PDF" button → calls `/api/reports/invoice/[id]`
   - "Back to Invoices" link

4. **Create receipts list page** (new file)
   - File: `src/app/receipts/page.tsx`
   - Fetch receipts from `/api/receipts`
   - Display in Table component
   - Columns: Receipt ID, Date, Invoice ID, Total, Actions
   - "View Receipt" button per row

5. **Create users page** (new file)
   - File: `src/app/users/page.tsx`
   - Placeholder page with heading "User Management"
   - Message: "User management features coming soon"
   - Use Container component for layout

6. **Update Nav component** (edit)
   - File: `src/components/Nav.tsx`
   - Add links to `/invoices`, `/receipts`, `/users`
   - Highlight active route

**Acceptance Criteria**:
- ✅ Each page renders without runtime errors
- ✅ Nav links navigate to correct pages
- ✅ Table component is reusable across pages
- ✅ Pages use existing UI primitives (Button, Container)

**Verification**:
- Manual: Navigate to each page via Nav
- Manual: Check browser console for errors
- Visual: Confirm layout matches site shell (Nav + content + Footer)

---

### T4: Reporting/Export Scaffolding (Priority: MEDIUM)

**Goal**: Add placeholder report generation endpoints

**Mode**: Code mode

**Steps**:

1. **Create CSV exporter** (new file)
   - File: `src/lib/reporting/exporters/csv.ts`
   - Function: `exportInvoicesToCSV(invoices: Invoice[]): string`
   - Returns CSV string with headers: Invoice ID, Date, Bill To, Total
   - Function: `exportReceiptsToCSV(receipts: Receipt[]): string`

2. **Create reports API route** (new file)
   - File: `src/app/api/reports/generate/route.ts`
   - GET endpoint with query params: `type` (invoice|receipt), `userID`
   - Fetch data, call appropriate exporter
   - Return with headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="report.csv"`

3. **Create refactor report** (new file)
   - File: `docs/reports/refactor-reports/REP-REPORT-GENERATION-SCAFFOLD.md`
   - Document: exporter interface, how to add new formats (XLSX, PDF)
   - List files created and their purpose

**Acceptance Criteria**:
- ✅ API endpoint returns valid CSV with correct headers
- ✅ CSV contains sample data when tested
- ✅ Documentation explains extension points

**Verification**:
- Manual: `curl http://localhost:3000/api/reports/generate?type=invoice&userID=demo-user-001`
- Manual: Verify CSV downloads with correct filename
- Code review: Confirm exporter interface is extensible

---

### T5: Documentation and ADRs (Priority: HIGH)

**Goal**: Document architectural decisions and provide developer onboarding

**Mode**: Docs mode (or Code mode for doc files)

**Steps**:

1. **Create validation ADR** (new file)
   - File: `docs/decisions/DEC-012-centralize-validation.md`
   - Title: "Centralize API Input Validation with Schema Registry"
   - Context: Manual validation in routes is error-prone and duplicates schema logic
   - Decision: Create `src/schemas/` with request DTOs derived from Zod models
   - Consequences: Single source of truth, better error messages, easier maintenance
   - Status: accepted

2. **Create MVP quickstart guide** (new file)
   - File: `docs/getting-started/mvp-quickstart.md`
   - Sections:
     - Prerequisites (Node.js, npm)
     - Installation (`npm install`)
     - Environment setup (copy `.env.example` to `.env.local`)
     - Running dev server (`npm run dev`)
     - Accessing pages (list URLs)
     - Testing endpoints (curl examples)

3. **Create handoff report** (new file)
   - File: `docs/reports/refactor-reports/REP-IMPLEMENT-MVP-HANDOFF.md`
   - Summary of T1-T5 completion
   - Files created/modified (full list)
   - Known limitations (no real auth, placeholder reports)
   - Next steps (add tests, implement real auth, enhance UI)

4. **Update AGENTS.md** (edit)
   - File: `AGENTS.md`
   - Update Phase 5 (Core Modules) status to ✅ Complete
   - Add notes: "Schema registry implemented, auth provider stub added, page scaffolds complete"
   - Update "Recent Work" section with T1-T5 summary
   - Update "Remaining Next Steps" to reflect post-MVP work

**Acceptance Criteria**:
- ✅ ADR explains validation decision with clear rationale
- ✅ Quickstart guide allows new developer to run app locally
- ✅ Handoff report documents all changes
- ✅ AGENTS.md reflects current project state

**Verification**:
- Manual: Follow quickstart guide on fresh clone
- Review: Confirm ADR follows template structure
- Review: Verify AGENTS.md phase log is accurate

---

## Execution Order

Execute tasks in this sequence to minimize dependencies:

1. **T1** (Centralize validation) - Foundation for clean API layer
2. **T3** (Page scaffolds) - Can proceed in parallel with T2
3. **T2** (Auth provider) - Integrates with pages from T3
4. **T4** (Reporting) - Independent, can be done anytime
5. **T5** (Documentation) - Final step after all code complete

## Mode Assignments

| Task | Primary Mode | Fallback Mode |
|------|-------------|---------------|
| T1 | Code | Small Edits (if < 3 files) |
| T2 | Code | Small Edits |
| T3 | Code | Advanced (if complex UI) |
| T4 | Code | Small Edits |
| T5 | Docs | Code (for doc files) |

## File Summary

### Files to Create (15 total)

1. `src/schemas/index.ts`
2. `src/schemas/invoice.schema.ts`
3. `src/schemas/receipt.schema.ts`
4. `src/providers/auth-provider.tsx`
5. `src/lib/auth.ts`
6. `src/components/ui/Table.tsx`
7. `src/app/invoices/page.tsx`
8. `src/app/invoices/[id]/page.tsx`
9. `src/app/receipts/page.tsx`
10. `src/app/users/page.tsx`
11. `src/lib/reporting/exporters/csv.ts`
12. `src/app/api/reports/generate/route.ts`
13. `docs/decisions/DEC-012-centralize-validation.md`
14. `docs/getting-started/mvp-quickstart.md`
15. `docs/reports/refactor-reports/REP-IMPLEMENT-MVP-HANDOFF.md`

### Files to Edit (5 total)

1. `src/app/api/invoices/route.ts` - Replace manual validation
2. `src/app/api/receipts/route.ts` - Replace manual validation
3. `src/app/layout.tsx` - Wire AuthProvider
4. `src/app/providers.tsx` - Add deprecation notice
5. `src/components/Nav.tsx` - Add navigation links
6. `AGENTS.md` - Update phase log and recent work

## Testing Policy for MVP

**Per original plan**: No automated tests created or run during MVP implementation. All verification is manual:

- ✅ Dev server runs without errors
- ✅ Pages render and are navigable
- ✅ API endpoints respond correctly to curl/Postman
- ✅ Documentation is readable and actionable

Automated testing will be added in post-MVP phase.

## Success Criteria

MVP is complete when:

1. ✅ All 15 new files created and 5 files edited
2. ✅ Schema registry implemented and used by API routes
3. ✅ Auth provider stub wired to app layout
4. ✅ Core pages (invoices, receipts, users) accessible via Nav
5. ✅ Report generation endpoint returns valid CSV
6. ✅ Documentation (ADR, quickstart, handoff) complete
7. ✅ AGENTS.md updated to reflect current state
8. ✅ Manual verification confirms all features work

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Schema changes break existing API consumers | Maintain exact same request/response shapes during migration |
| Auth provider too tightly coupled to demo implementation | Use interface-based design, document swap points |
| Pages fail to render due to missing data | Add loading states and error boundaries |
| CSV export fails on large datasets | Document known limitations, add pagination in post-MVP |

## Next Session Handoff

After completing this plan:

1. Create session log in `docs/reports/session-logs/unresolved/`
2. Run `session-resolver` skill to merge into main docs
3. Update AGENTS.md with completion status
4. Tag commit: `mvp-v1.0.0`
5. Next phase: Add automated tests for T1-T4 implementations

---

## Appendix: Command Reference

```bash
# Start dev server
npm run dev

# Test invoice creation
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"userID":"demo-user-001","invoiceDate":"2026-05-21",...}'

# Test report generation
curl http://localhost:3000/api/reports/generate?type=invoice&userID=demo-user-001 \
  -o report.csv

# Access pages
open http://localhost:3000/invoices
open http://localhost:3000/receipts
open http://localhost:3000/users
```

---

**Plan Status**: Ready for execution
**Estimated Effort**: 4-6 hours across all tasks
**Dependencies**: None (all tasks can start immediately)