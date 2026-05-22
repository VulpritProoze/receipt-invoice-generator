# AGENTS.md

## Project: BillGen

**Status**: Active development
**Last Updated**: 2026-05-22
**Active Agent**: Antigravity

---

## Phase Log

| Phase                   | Status         | Notes                                                                                                                                 |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Dependency Research | ✅ Complete    | Core package set researched and documented in ADRs                                                                                    |
| 1 — Project Scaffold    | ✅ Complete    | Base workspace structure, app shell, models, docs, and fixtures created                                                               |
| 2 — Agent Files & Hooks | ✅ Complete    | Created tester agent and updated orchestrator/test-lint-fix-iterate loop configuration                                                |
| 3 — Data Models         | ✅ Complete    | Zod schemas in src/models/ with TypeScript types derived via z.infer. All entities validated at runtime.                              |
| 4 — Database Layer      | ✅ Complete    | SQLite adapter layer with Redis fallback. USE_REDIS env var switches between local SQLite and production Redis. See PLAN-009.         |
| 5 — Core Modules        | ✅ Complete    | MVP delivered: Schema registry, auth provider stub, page scaffolds, CSV reporting. See REP-IMPLEMENT-MVP-HANDOFF.md                   |
| 6 — Import Module       | ✅ Complete    | Import UI page with file upload, validation, and sample CSV download implemented                                                      |
| 7 — Report Generation   | ✅ Complete    | Completed via Phase 14 (XLSX and PDF generated)                                                                                       |
| 8 — Onboarding Flow     | ✅ Complete    | Onboarding page with company profile form implemented                                                                                 |
| 9 — Testing Setup       | ⏸️ Deferred     | Explicitly deferred per user request                                                                                                  |
| 10 — Documentation      | ✅ Complete    | MVP documentation complete: DEC-012, mvp-quickstart.md, handoff report                                                                |
| 11 — Deployment Setup   | ✅ Complete    | Deployment guide created utilizing Redis fallback for production                                                                      |
| 12 — Invoice Edit/Del   | ✅ Complete    | Added Edit/Delete UI to invoice detail and created edit page.                                                                         |
| 13 — Receipt Generation | ✅ Complete    | Added Generate Receipt button on invoice detail page.                                                                                 |
| 14 — Enhanced Reporting | ✅ Complete    | Added XLSX and PDF generation formats to invoice and receipt lists.                                                                   |
| 15 — Real Auth          | ✅ Complete    | Single-tenant NextAuth.js credentials provider implemented and middleware added.                      |

---

## Recent Work (completed)

**Bug Fixes & Stabilizations (2026-05-22)**:
- API Parameter Decoupling — Fixed Receipt and Users APIs to securely fetch session users instead of requiring URL query strings.
- PDF Generation Resiliency — Fixed `pdfkit` webpack ENOENT bug by adding `pdfkit` to `serverExternalPackages` in `next.config.ts`.
- Auth Integration — Seeded `demo-user-001` in the database to fix missing user foreign key constraints and corrected NextAuth `session.user.id` mapping.
- Testing Strategy — Drafted an optimization plan separating cheap session-end checks from broader day-end verification to reduce test overhead.

**Post-MVP Implementation (2026-05-22)**:
- Real Authentication — Phase 15 complete. Implemented NextAuth.js with CredentialsProvider and protected routes with middleware.
- Invoice Editing & Deletion — Phase 12 complete. Added Edit/Delete UI to invoice detail and created `edit/page.tsx` connected to PATCH/DELETE endpoints.
- Receipt Generation — Phase 13 complete. Added "Generate Receipt" button to invoice detail page which posts directly to receipts API.
- Enhanced Reporting — Phase 14 complete. Implemented XLSX (xlsx-js-style) and PDF (pdfkit) generation for invoice and receipt lists; updated `/api/reports/generate` and list pages.
- Authentication Planning — DEC-013 created. Decided to proceed with a simple, single-tenant NextAuth.js credentials implementation.

**SQLite Database Implementation (2026-05-21)**:
- Database adapter layer — All `src/lib/db/` files now route to SQLite (default) or Redis based on `USE_REDIS` env var
- Environment configuration — Created `.env.example` and `.env.local` with database setup documentation
- SQLite-first development — Application now uses persistent SQLite database at `.dev/billgen.db` for local development
- Phase 3 & 4 complete — Data models and database layer fully implemented. See PLAN-009 for details.
- No mock data — All service modules already use real database operations through the adapter layer

**Post-MVP UI Implementation (2026-05-21)**:
- Invoice creation UI — Full form with date range filter, multi-select with Shift+Click, real-time totals calculation
- Import module UI — File upload page with validation, error display, success feedback, and sample CSV download
- User management enhancement — Full CRUD interface with form, table display, and current user info
- API endpoints — Added `/api/invoices/items` for fetching invoice items and `/api/import/sample` for sample CSV

**MVP Implementation (2026-05-21)**:
- Schema registry created — Centralized Zod validation in `src/schemas/` replacing manual field checks in API routes
- Auth provider stub — Pluggable `AuthProvider` with `useAuth()` hook; server-side `getCurrentUserId()` helper added
- Page scaffolds — Invoice list/detail, receipt list, and user management pages with Table component
- CSV reporting — Export endpoint at `/api/reports/generate` with invoice and receipt exporters
- Documentation — DEC-012 ADR, MVP quickstart guide, and handoff report completed

**Previous work**:
- API validation fix — explicit undefined / null / blank checks applied to invoices, receipts, and users routes
- Site shell added — Nav, Footer, and Providers implemented; RootLayout updated
- UI primitives created — Button and Container components

---

## Hand-off Notes

**Authentication & PDF Fixes (2026-05-22)**: The NextAuth configuration has been fixed to map `id` onto the session object via JWT callbacks, securely falling back to legacy single-tenant users when necessary. The `users` SQLite table was seeded with `demo-user-001` to resolve foreign key lookups during receipt generation. The `pdfkit` webpack bug was resolved using `serverExternalPackages`. **A dev server restart is required for the pdfkit fix to take effect**. The API GET handlers for receipts and users were decoupled from strict query parameters.

**Testing Strategy Optimization (2026-05-21)**: The `test-lint-fix-iterate` workflow is currently slow and token-heavy. A new draft plan separates cheap session-end checks from broader day-end verification so the repair loop is only used after a scoped failure. See `docs/plans/agentic-test-workflow-optimization.md`.

**Database Layer Complete (2026-05-21)**: Phase 3 (Data Models) and Phase 4 (Database Layer) are now complete. The application uses SQLite by default for local development with automatic database initialization at `.dev/billgen.db`. All data persists across restarts. Redis support is available for production by setting `USE_REDIS=true`. See `docs/plans/009-sqlite-database-implementation.md` for complete implementation details.

**MVP Complete (2026-05-21)**: All five MVP tasks (T1-T5) have been implemented successfully. The application now has centralized validation, pluggable authentication scaffolding, navigable UI pages, CSV report generation, and comprehensive documentation. See `docs/reports/refactor-reports/REP-IMPLEMENT-MVP-HANDOFF.md` for complete implementation details.

**Known limitations**: Demo authentication only, no automated tests run, CSV reports only (XLSX/PDF deferred).

**Previous work**: Scaffolded the core Next.js workspace, added typed models with Zod schemas, created ADRs and getting-started docs, and generated import fixtures including a real XLSX workbook.

---

## Remaining Next Steps

**Post-MVP priorities**:
- Add automated tests for all MVP and Post-MVP features (schema tests, API contract tests, component snapshots). Test deferred per latest instructions.
- Run full repository ESLint and fix remaining issues.

---

## Open Questions / Blockers

- [x] Confirm whether the app should remain single-tenant for the first bootstrap pass — YES, single-tenant confirmed.
- [x] Migrate ESLint 10 to flat config and restore lint execution against the existing repo rules so the test lint bookends can run. Zero errors and zero warnings achieved.
- [ ] Confirm whether the workflow skill should be rewritten to match the actual toolchain in this workspace.
- [ ] Decide whether the end-of-session gate should be report-free by default.
- [ ] Determine the smallest reliable harness-health smoke check before broader verification.

---

## Session Logs

Session logs are saved as individual files in `docs/reports/session-logs/unresolved/` when a session completes. The `session-resolver` skill is run to merge/resolve these logs into the primary documentation, rules, and core `AGENTS.md` instructions, after which the log file is moved to `docs/reports/session-logs/resolved/`.
