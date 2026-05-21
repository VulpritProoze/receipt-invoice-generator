# Plan: Complete client core features

---

doc_id: PLAN-CLIENT-CORE-FEAT-001
title: Complete client core features
version: 1.0.0
status: draft
created: 2026-05-21
updated: 2026-05-21
author: update-docs
reviewers: Copilot
tags: plan, client, ui, api
changelog:

- version: 1.0.0
  date: 2026-05-21
  author: update-docs
  note: Initial plan outlining verification and next milestones

---

## Objective

Summarize recent client-side and API stabilization work, verify changes, and define the next milestones required to reach a minimal viable client experience (invoices, receipts, user management).

## Scope

### In Scope

- Formalize verification steps for API validation fixes and site shell additions.
- Add tests and CI checks to prevent regressions.
- Plan migration of explicit validation checks to centralized Zod schemas.
- Add page scaffolds for invoices, receipts, and users.

### Out of Scope

- Backend database schema redesign
- Production-grade authentication integration (a stub provider will be used until auth is available)

## Milestones

| Milestone | Target Date | Owner | Status |
| --------- | ----------- | ----- | ------ |
| Stabilize API validation across routes | 2026-05-28 | backend/client lead | In progress |
| Centralize Zod schemas and replace ad-hoc checks | 2026-06-04 | backend/client lead | Planned |
| Add auth provider and integrate Providers | 2026-06-11 | frontend lead | Planned |
| Create page scaffolds for invoices/receipts/users | 2026-06-04 | frontend lead | Planned |
| Add integration tests for layout and basic flows | 2026-06-11 | qa | Planned |

## Dependencies

- Zod schema consolidation (code changes)
- Auth provider design and dependency
- Test harness and CI availability

## Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Inconsistent validation across routes | High | High | Centralize schemas and add automated schema-based tests |
| Auth integration slipping | Medium | Medium | Maintain demo Providers and add feature flags to gate auth-dependent features |

## Open Questions

- Who will own the central schema registry and where will it live within the repo? (src/lib/schemas or src/schemas suggested)
- What authentication mechanism should be prioritized for the first pass (JWT, NextAuth, or external provider)?

## Verification & Tests Run

- Unit tests: Nav and Footer component tests were added and executed (see refactor report).
- Manual verification: RootLayout inspected to confirm Nav and Footer render, Providers supplies demo user context.
- API manual checks: explicit undefined/null/blank checks were added to invoices/receipts/users routes; manual payloads were tested to confirm invalid inputs are rejected before business logic.


## Next Milestones (short term)

1. Create a set of shared Zod schemas and a small test suite that validates sample payloads against them.
2. Implement auth provider stub replacement with a pluggable auth interface.
3. Scaffold invoices/receipts/users pages with basic routing and placeholder UIs connected to existing providers.
4. Add integration tests for basic create/read flows for invoices and receipts.
