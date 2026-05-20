# MVP Plan

---
doc_id: PLAN-001
title: MVP Plan
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: plan, mvp, billgen
changelog:
  - version: 1.0.0
    date: 2026-05-20
    author: Copilot
    note: Initial
---

## Objective
Ship a narrow but complete billing workflow: onboarding, user records, import, invoice generation, receipt generation, and deployment.

## Scope
### In Scope
- App scaffold and layout.
- Model and schema definitions.
- Redis persistence.
- CSV/XLSX import.
- Invoice and receipt workflows.
- Testing and documentation.

### Out of Scope
- Advanced analytics.
- Multi-organization tenancy.
- External payment processor integration.

## Milestones
| Milestone | Target Date | Owner | Status |
|-----------|-------------|-------|--------|
| Scaffold and docs | TBD | Copilot | In progress |
| Models and validation | TBD | Copilot | Not started |
| Core modules | TBD | Copilot | Not started |
| Test suite | TBD | Copilot | Not started |
| Deployment readiness | TBD | Copilot | Not started |

## Dependencies
- Next.js App Router.
- Upstash Redis.
- Tailwind CSS.
- Zod.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Template mismatch | High | High | Wait for uploaded template images before rendering PDFs |
| Data drift | Medium | High | Co-locate schemas with models and test them |

## Open Questions
- Should the first release support multiple users within a single account boundary only?