# AGENTS.md

## Project: BillGen

**Status**: Active development
**Last Updated**: 2026-05-21
**Active Agent**: Bob (Code Mode)

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
| 7 — Report Generation   | 🟡 In Progress | CSV export implemented; XLSX and PDF generation deferred to post-MVP                                                                  |
| 8 — Onboarding Flow     | ✅ Complete    | Onboarding page with company profile form implemented                                                                                 |
| 9 — Testing Setup       | 🟡 In Progress | Jest harness, setup file, schema tests, and initial report scaffold added; ESLint 10 flat-config migration still blocks lint bookends |
| 10 — Documentation      | ✅ Complete    | MVP documentation complete: DEC-012, mvp-quickstart.md, handoff report                                                                |
| 11 — Deployment Setup   | ⬜ Not Started |                                                                                                                                       |

---

## Recent Work (completed)

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

**Database Layer Complete (2026-05-21)**: Phase 3 (Data Models) and Phase 4 (Database Layer) are now complete. The application uses SQLite by default for local development with automatic database initialization at `.dev/billgen.db`. All data persists across restarts. Redis support is available for production by setting `USE_REDIS=true`. See `docs/plans/009-sqlite-database-implementation.md` for complete implementation details.

**MVP Complete (2026-05-21)**: All five MVP tasks (T1-T5) have been implemented successfully. The application now has centralized validation, pluggable authentication scaffolding, navigable UI pages, CSV report generation, and comprehensive documentation. See `docs/reports/refactor-reports/REP-IMPLEMENT-MVP-HANDOFF.md` for complete implementation details.

**Known limitations**: Demo authentication only, no automated tests run, CSV reports only (XLSX/PDF deferred).

**Previous work**: Scaffolded the core Next.js workspace, added typed models with Zod schemas, created ADRs and getting-started docs, and generated import fixtures including a real XLSX workbook.

---

## Remaining Next Steps

**Post-MVP priorities**:
- Add automated tests for all MVP features (schema tests, API contract tests, component snapshots)
- Implement real authentication (NextAuth.js or similar)
- Enhance reporting with XLSX and PDF generation
- Add invoice editing and deletion functionality
- Add receipt generation from invoice detail page

---

## Open Questions / Blockers

- [ ] Confirm whether the app should remain single-tenant for the first bootstrap pass
- [x] Migrate ESLint 10 to flat config and restore lint execution against the existing repo rules so the test lint bookends can run. Zero errors and zero warnings achieved.

---

## Session Logs

Session logs are saved as individual files in `docs/reports/session-logs/unresolved/` when a session completes. The `session-resolver` skill is run to merge/resolve these logs into the primary documentation, rules, and core `AGENTS.md` instructions, after which the log file is moved to `docs/reports/session-logs/resolved/`.
