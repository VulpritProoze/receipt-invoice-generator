# AGENTS.md

## Project: BillGen

**Status**: Active development
**Last Updated**: 2026-05-21
**Active Agent**: Copilot

---

## Phase Log

| Phase                   | Status         | Notes                                                                                                                                 |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Dependency Research | ✅ Complete    | Core package set researched and documented in ADRs                                                                                    |
| 1 — Project Scaffold    | ✅ Complete    | Base workspace structure, app shell, models, docs, and fixtures created                                                               |
| 2 — Agent Files & Hooks | ✅ Complete    | Created tester agent and updated orchestrator/test-lint-fix-iterate loop configuration                                                |
| 3 — Data Models         | ⬜ Not Started |                                                                                                                                       |
| 4 — Database Layer      | ⬜ Not Started |                                                                                                                                       |
| 5 — Core Modules        | ✅ Complete    | MVP delivered: Schema registry, auth provider stub, page scaffolds, CSV reporting. See REP-IMPLEMENT-MVP-HANDOFF.md                   |
| 6 — Import Module       | ⬜ Not Started |                                                                                                                                       |
| 7 — Report Generation   | 🟡 In Progress | CSV export implemented; XLSX and PDF generation deferred to post-MVP                                                                  |
| 8 — Onboarding Flow     | ⬜ Not Started |                                                                                                                                       |
| 9 — Testing Setup       | 🟡 In Progress | Jest harness, setup file, schema tests, and initial report scaffold added; ESLint 10 flat-config migration still blocks lint bookends |
| 10 — Documentation      | ✅ Complete    | MVP documentation complete: DEC-012, mvp-quickstart.md, handoff report                                                                |
| 11 — Deployment Setup   | ⬜ Not Started |                                                                                                                                       |

---

## Recent Work (completed)

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

**MVP Complete (2026-05-21)**: All five MVP tasks (T1-T5) have been implemented successfully. The application now has centralized validation, pluggable authentication scaffolding, navigable UI pages, CSV report generation, and comprehensive documentation. See `docs/reports/refactor-reports/REP-IMPLEMENT-MVP-HANDOFF.md` for complete implementation details.

**Known limitations**: Demo authentication only, no automated tests run, CSV reports only (XLSX/PDF deferred), no invoice creation UI, placeholder user management page.

**Previous work**: Scaffolded the core Next.js workspace, added typed models with Zod schemas, created ADRs and getting-started docs, and generated import fixtures including a real XLSX workbook.

---

## Remaining Next Steps

**Post-MVP priorities**:
- Add automated tests for all MVP features (schema tests, API contract tests, component snapshots)
- Implement real authentication (NextAuth.js or similar)
- Add invoice creation UI with date range filter and multi-select
- Enhance reporting with XLSX and PDF generation
- Implement user management functionality
- Add data persistence layer (currently in-memory unless Redis configured)

---

## Open Questions / Blockers

- [ ] Confirm whether the app should remain single-tenant for the first bootstrap pass
- [x] Migrate ESLint 10 to flat config and restore lint execution against the existing repo rules so the test lint bookends can run. Zero errors and zero warnings achieved.

---

## Session Logs

Session logs are saved as individual files in `docs/reports/session-logs/unresolved/` when a session completes. The `session-resolver` skill is run to merge/resolve these logs into the primary documentation, rules, and core `AGENTS.md` instructions, after which the log file is moved to `docs/reports/session-logs/resolved/`.
