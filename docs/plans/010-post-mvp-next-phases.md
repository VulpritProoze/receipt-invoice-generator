# Post-MVP Next Phases

---
doc_id: PLAN-010
title: Post-MVP Next Phases
version: 1.0.0
status: active
created: 2026-05-22
updated: 2026-05-22
author: Docs Agent
reviewers: 
tags: plan, post-mvp
changelog:
  - version: 1.0.0
    date: 2026-05-22
    author: Docs Agent
    note: Initial creation
---

## Objective

Outline and execute the remaining next steps post-MVP for the BillGen application, specifically focusing on invoice management, receipt generation, enhanced reporting, and real authentication.

## Scope

### In Scope

- **Phase 12:** Invoice Editing and Deletion (Add Edit/Delete UI in `src/app/invoices/[id]/page.tsx`, create edit page, connect to existing PATCH/DELETE endpoints).
- **Phase 13:** Receipt Generation from Invoice Detail page.
- **Phase 14:** Enhanced Reporting (XLSX and PDF generation).
- **Phase 15:** Real Authentication (NextAuth.js or similar).

### Out of Scope

- Automated testing (explicitly skipped as per user request).
- Global linting.
- Production builds (`npm run build`).

## Milestones

| Milestone | Target Date | Owner | Status |
| --------- | ----------- | ----- | ------ |
| 1. Implement Invoice Editing & Deletion | TBD | refactor agent | Complete |
| 2. Implement Receipt Generation | TBD | refactor agent | Complete |
| 3. Implement Enhanced Reporting | TBD | refactor agent | Complete |
| 4. Implement Real Authentication | TBD | refactor agent | Complete |

## Status Note
Phase 15 (Real Authentication) has been completed as of 2026-05-22. A NextAuth.js CredentialsProvider was implemented, replacing the MVP stub auth, and routes are protected via middleware. All post-MVP milestones in this plan are now achieved.

**Additional Updates (Phases 7, 9, 11):**
- **Phase 7 (Report Generation):** ✅ Complete (fulfilled by Phase 14).
- **Phase 9 (Testing Setup):** ⏸️ Deferred per user request.
- **Phase 11 (Deployment Setup):** ✅ Complete via the `deployment.md` guide using the built-in Redis fallback.

## Dependencies

- Completion of MVP (already completed).

## Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Deferring testing may lead to undiscovered regressions | High | Medium | Rely on manual verification for post-MVP phases and isolate changes |

## Open Questions

- What specific authentication provider should be used for real authentication (e.g., NextAuth.js with specific OAuth providers)?
- Are there specific templating requirements for PDF and XLSX generation?
