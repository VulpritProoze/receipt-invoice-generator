# Comprehensive Test Coverage Generation

---

doc_id: PLAN-013
title: Comprehensive Test Coverage Generation
version: 1.0.0
status: draft
created: 2026-05-23
updated: 2026-05-23
author: Bob (Plan mode)
reviewers: none
tags: plan, testing, coverage, quality
changelog:

- version: 1.0.0
  date: 2026-05-23
  author: Bob (Plan mode)
  note: Initial draft

---

## Objective

Generate comprehensive test coverage for all untested source files in the BillGen repository. After PLAN-012 removed integration and snapshot tests, the test suite now focuses on 5 test types: Unit, Schema, Contract, Fixture, and Security. This plan identifies all files lacking appropriate test coverage and establishes a systematic approach to achieve the coverage targets defined in the testing protocol.

## Scope

### In Scope

**Unit Tests (Missing Coverage):**
- [`src/lib/auth.ts`](src/lib/auth.ts) — 4 exported functions: `getCurrentUserId()`, `getCurrentUserEmail()`, `isAuthenticated()`, `requireAuth()`
- [`src/lib/db.sqlite.ts`](src/lib/db.sqlite.ts) — Database initialization and migration logic
- [`src/lib/reporting/exporters/csv.ts`](src/lib/reporting/exporters/csv.ts) — CSV export functions for invoices and receipts
- [`src/lib/reporting/exporters/pdf.ts`](src/lib/reporting/exporters/pdf.ts) — PDF export functions (with mocked PDFKit)
- [`src/lib/reporting/exporters/xlsx.ts`](src/lib/reporting/exporters/xlsx.ts) — XLSX export functions for invoices and receipts
- [`src/middleware/onboardingGuard.ts`](src/middleware/onboardingGuard.ts) — `requireOnboarding()` middleware utility
- [`src/schemas/index.ts`](src/schemas/index.ts) — Schema re-exports (if it contains logic beyond re-exports)
- [`src/schemas/invoice.schema.ts`](src/schemas/invoice.schema.ts) — Invoice-specific schemas
- [`src/schemas/receipt.schema.ts`](src/schemas/receipt.schema.ts) — Receipt-specific schemas

**Contract Tests (Missing Coverage):**
- [`src/app/api/invoices/route.ts`](src/app/api/invoices/route.ts) — POST and GET handlers
- [`src/app/api/invoices/[invoiceID]/route.ts`](src/app/api/invoices/[invoiceID]/route.ts) — GET, PATCH, DELETE handlers
- [`src/app/api/invoices/items/route.ts`](src/app/api/invoices/items/route.ts) — GET handler
- [`src/app/api/receipts/route.ts`](src/app/api/receipts/route.ts) — POST and GET handlers
- [`src/app/api/receipts/[receiptID]/route.ts`](src/app/api/receipts/[receiptID]/route.ts) — GET handler
- [`src/app/api/users/route.ts`](src/app/api/users/route.ts) — POST and GET handlers
- [`src/app/api/users/[userID]/route.ts`](src/app/api/users/[userID]/route.ts) — GET, PATCH, DELETE handlers
- [`src/app/api/reports/generate/route.ts`](src/app/api/reports/generate/route.ts) — POST handler for report generation
- [`src/app/api/auth/[...nextauth]/route.ts`](src/app/api/auth/[...nextauth]/route.ts) — NextAuth handlers (if testable)

**Security Tests (Missing Coverage):**
- Auth module security — Test that `requireAuth()` properly throws when unauthenticated
- Onboarding guard security — Test that `requireOnboarding()` properly redirects incomplete users
- API route authorization — Test that protected routes reject unauthenticated requests
- File upload security — Verify existing tests in [`src/modules/import/import.security.test.ts`](src/modules/import/import.security.test.ts) are comprehensive
- Credit card masking — Verify existing tests in security suite cover all edge cases
- Receipt generation without invoice — Verify existing security test coverage

**Schema Tests (Verify Coverage):**
- Existing schema tests in [`src/models/`](src/models/) cover the 4 core Zod schemas
- New schemas in [`src/schemas/`](src/schemas/) need schema tests if they contain validation logic beyond re-exports

### Out of Scope

- React component tests (removed per PLAN-012)
- Integration tests (removed per PLAN-012)
- Snapshot tests (removed per PLAN-012)
- End-to-end tests
- Visual regression tests
- Performance/load tests
- Modifying existing passing tests unless they are incomplete

## Analysis: Current Test Coverage Gaps

### Unit Test Gaps (9 files)

| File | Functions/Logic | Current Coverage | Priority |
|------|----------------|------------------|----------|
| `src/lib/auth.ts` | 4 auth functions | 0% | **High** — Core security boundary |
| `src/lib/db.sqlite.ts` | DB init, migrations | 0% | **High** — Data layer foundation |
| `src/lib/reporting/exporters/csv.ts` | 3 export functions | 0% | Medium — Business logic |
| `src/lib/reporting/exporters/pdf.ts` | 3 export functions | 0% | Medium — Business logic |
| `src/lib/reporting/exporters/xlsx.ts` | 3 export functions | 0% | Medium — Business logic |
| `src/middleware/onboardingGuard.ts` | 1 guard function | 0% | Medium — Route protection |
| `src/schemas/index.ts` | Re-exports only | N/A | Low — May not need tests |
| `src/schemas/invoice.schema.ts` | Schema definitions | 0% | Medium — Validation logic |
| `src/schemas/receipt.schema.ts` | Schema definitions | 0% | Medium — Validation logic |

### Contract Test Gaps (9 route files)

| Route | Handlers | Current Coverage | Priority |
|-------|----------|------------------|----------|
| `/api/invoices` | POST, GET | 0% | **High** — Core CRUD |
| `/api/invoices/[invoiceID]` | GET, PATCH, DELETE | 0% | **High** — Core CRUD |
| `/api/invoices/items` | GET | 0% | Medium — Data retrieval |
| `/api/receipts` | POST, GET | 0% | **High** — Core CRUD |
| `/api/receipts/[receiptID]` | GET | 0% | Medium — Data retrieval |
| `/api/users` | POST, GET | 0% | **High** — User management |
| `/api/users/[userID]` | GET, PATCH, DELETE | 0% | Medium — User management |
| `/api/reports/generate` | POST | 0% | Medium — Report generation |
| `/api/auth/[...nextauth]` | NextAuth handlers | 0% | Low — Third-party library |

### Security Test Gaps (4 areas)

| Security Concern | Current Coverage | Priority |
|------------------|------------------|----------|
| Auth boundary enforcement | Partial (core.security.test.ts exists) | **High** |
| Onboarding guard enforcement | 0% | Medium |
| API route authorization | 0% | **High** |
| File upload validation | Exists (import.security.test.ts) | Low — Verify completeness |

## Milestones

| Milestone | Target Date | Owner | Status |
|-----------|-------------|-------|--------|
| M1: High-priority unit tests (auth, db.sqlite) | TBD | Code mode | Pending |
| M2: High-priority contract tests (invoices, receipts, users) | TBD | Code mode | Pending |
| M3: High-priority security tests (auth, API authorization) | TBD | Code mode | Pending |
| M4: Medium-priority unit tests (exporters, middleware, schemas) | TBD | Code mode | Pending |
| M5: Medium-priority contract tests (remaining routes) | TBD | Code mode | Pending |
| M6: Coverage verification and test report | TBD | Code mode | Pending |

## Implementation Strategy

### Phase 1: High-Priority Unit Tests

**Files:**
1. `src/lib/auth.unit.test.ts` — Test all 4 auth functions
   - `getCurrentUserId()`: authenticated session, unauthenticated, admin fallback
   - `getCurrentUserEmail()`: authenticated, unauthenticated
   - `isAuthenticated()`: true/false cases
   - `requireAuth()`: success case, throws when unauthenticated

2. `src/lib/db.sqlite.unit.test.ts` — Test database initialization
   - Database file creation in `.dev/` directory
   - Migration execution (table creation)
   - Proxy behavior (lazy initialization)
   - Error handling when USE_REDIS=true

**Mocking strategy:**
- Mock `getServerSession` from `next-auth` to return controlled session objects
- Use in-memory SQLite database (`:memory:`) for db.sqlite tests
- Mock file system operations where necessary

### Phase 2: High-Priority Contract Tests

**Files:**
1. `src/app/api/invoices/route.contract.test.ts`
   - POST: valid invoice creation, validation errors, missing fields
   - GET: list invoices for user, empty list, pagination (if implemented)

2. `src/app/api/invoices/[invoiceID]/route.contract.test.ts`
   - GET: retrieve existing invoice, 404 for non-existent
   - PATCH: update invoice, validation errors
   - DELETE: delete invoice, 404 for non-existent

3. `src/app/api/receipts/route.contract.test.ts`
   - POST: create receipt from invoice, create standalone receipt, validation errors
   - GET: list receipts for user

4. `src/app/api/users/route.contract.test.ts`
   - POST: create user, duplicate email error, missing fields
   - GET: retrieve current user profile

**Mocking strategy:**
- Mock Redis/SQLite database layer via existing `src/lib/__mocks__/redis.ts`
- Mock `getCurrentUserId()` to return controlled user IDs
- Use `NextRequest` and `NextResponse` directly (no HTTP server)

### Phase 3: High-Priority Security Tests

**Files:**
1. `src/lib/auth.security.test.ts`
   - `requireAuth()` throws when session is null
   - `requireAuth()` succeeds when session exists
   - No auth bypass via malformed session objects

2. `src/app/api/authorization.security.test.ts` (new consolidated file)
   - Protected routes reject requests without valid session
   - Routes properly validate user ownership of resources
   - No cross-user data leakage (user A cannot access user B's invoices)

**Mocking strategy:**
- Mock `getServerSession` to return null for unauthenticated tests
- Mock database to contain data for multiple users
- Verify route handlers check user ownership before returning data

### Phase 4: Medium-Priority Unit Tests

**Files:**
1. `src/lib/reporting/exporters/csv.unit.test.ts`
   - `exportInvoicesToCSV()`: valid invoices, empty array, special characters in fields
   - `exportReceiptsToCSV()`: valid receipts, empty array
   - `generateCSVFilename()`: correct format with timestamp

2. `src/lib/reporting/exporters/pdf.unit.test.ts`
   - `exportInvoicesToPDF()`: returns Buffer, handles empty array
   - `exportReceiptsToPDF()`: returns Buffer, handles empty array
   - Mock PDFKit to avoid actual PDF generation

3. `src/lib/reporting/exporters/xlsx.unit.test.ts`
   - `exportInvoicesToXLSX()`: returns Buffer, correct headers, styling applied
   - `exportReceiptsToXLSX()`: returns Buffer, correct headers
   - `generateXLSXFilename()`: correct format

4. `src/middleware/onboardingGuard.unit.test.ts`
   - `requireOnboarding()`: returns redirect when incomplete
   - `requireOnboarding()`: returns empty object when complete

5. `src/schemas/invoice.schema.test.ts` (if not covered by models/)
   - Validate invoice creation request schema
   - Test all validation rules

6. `src/schemas/receipt.schema.test.ts` (if not covered by models/)
   - Validate receipt creation request schema
   - Test all validation rules

**Mocking strategy:**
- Mock PDFKit's `PDFDocument` to return controlled Buffer
- Mock XLSX library if necessary (or use real library with small datasets)
- Mock `checkOnboardingStatus()` for onboarding guard tests

### Phase 5: Medium-Priority Contract Tests

**Files:**
1. `src/app/api/invoices/items/route.contract.test.ts`
   - GET: retrieve invoice items with date filtering

2. `src/app/api/receipts/[receiptID]/route.contract.test.ts`
   - GET: retrieve existing receipt, 404 for non-existent

3. `src/app/api/users/[userID]/route.contract.test.ts`
   - GET: retrieve user by ID, 404 for non-existent
   - PATCH: update user, validation errors
   - DELETE: delete user

4. `src/app/api/reports/generate/route.contract.test.ts`
   - POST: generate CSV report, generate XLSX report, generate PDF report
   - Validation errors for invalid format parameter

### Phase 6: Coverage Verification

**Actions:**
1. Run full test suite via `/run-tests` skill
2. Generate test report in `docs/reports/test-reports/`
3. Verify coverage targets:
   - `src/lib/`: ≥90% line coverage, ≥80% branch coverage
   - `src/modules/`: ≥80% line coverage, ≥70% branch coverage
   - `src/models/` and `src/schemas/`: 100% coverage
   - `src/app/api/`: ≥80% line coverage, ≥70% branch coverage
4. Document any remaining gaps with justification
5. Update `AGENTS.md` with test coverage status

## Dependencies

- Existing test infrastructure (Jest, testing-library)
- Existing mock patterns (`src/lib/__mocks__/redis.ts`)
- Testing protocol rules (`.bob/rules/testing-protocol.md`)
- Coverage targets defined in testing strategy

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Auth mocking complexity | Medium | Medium | Use simple session object mocks; avoid testing NextAuth internals |
| PDF generation test brittleness | Medium | Low | Mock PDFKit entirely; verify Buffer output only, not PDF content |
| Database test isolation | Low | High | Use in-memory SQLite for unit tests; reset between test cases |
| Time required for 30+ test files | High | Medium | Prioritize high-impact tests first; implement in phases |
| Test maintenance burden | Medium | Medium | Follow strict naming conventions; keep tests focused and minimal |

## Open Questions

- Should NextAuth route handlers be tested, or are they considered third-party library code?
  - **Recommendation**: Skip — NextAuth is well-tested upstream; focus on our auth utility wrappers
- Should we test the proxy behavior in `db.sqlite.ts`, or only the migration logic?
  - **Recommendation**: Test both — proxy ensures lazy init; migrations ensure schema correctness
- Should schema tests in `src/schemas/` duplicate coverage from `src/models/`?
  - **Recommendation**: Only if schemas contain additional validation logic not in models
- What is the target completion date for all 6 milestones?
  - **Recommendation**: Defer to user — depends on available development time

## Success Criteria

1. All high-priority unit tests (Phase 1) pass with ≥90% coverage of target files
2. All high-priority contract tests (Phase 2) pass with ≥80% coverage of target routes
3. All high-priority security tests (Phase 3) pass and verify auth boundaries
4. Medium-priority tests (Phases 4-5) achieve target coverage thresholds
5. Full test suite runs in <60 seconds (maintain fast feedback loop)
6. Test report documents coverage metrics and any justified gaps
7. Zero ESLint errors in all new test files
8. All tests follow naming convention: `[source-file].[test-type].test.ts`

## Notes

- This plan assumes the simplified 5-test-type suite from PLAN-012 (Unit, Schema, Contract, Fixture, Security)
- Integration and snapshot tests are explicitly out of scope per PLAN-012
- All tests must use the mocking patterns defined in `.bob/rules/testing-protocol.md`
- Test files must be co-located with source files (not in separate `__tests__/` directories)
- Each test file should be independently runnable via `jest --testPathPattern`
- Security tests are critical for a financial application — prioritize auth and authorization coverage