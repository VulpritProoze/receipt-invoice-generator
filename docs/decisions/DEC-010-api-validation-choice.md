# DEC-API-VALIDATION-001: API validation approach

---

doc_id: DEC-API-VALIDATION-001
title: API validation approach — explicit checks now, migrate to Zod later
version: 1.0.0
status: proposed
created: 2026-05-21
updated: 2026-05-21
author: update-docs
reviewers: Copilot
tags: decision, api, validation
changelog:

- version: 1.0.0
  date: 2026-05-21
  author: update-docs
  note: Initial decision record

---

## Context

Several API routes (invoices, receipts, users) were observed to accept malformed or missing fields which caused downstream errors. A quick stabilization was required to prevent invalid payloads from reaching business logic during ongoing development.

## Decision

We implemented explicit undefined / null / blank checks directly in the affected routes as an immediate mitigation. This ensures the endpoints reject clearly invalid payloads while work proceeds to centralize validation.

Planned next step: migrate these explicit checks into a centralized schema layer using Zod (or equivalent) so that validation is consistent, reusable, and testable across server and client boundaries.

## Alternatives Considered

| Option | Pros | Cons | Reason Rejected |
| ------ | ---- | ---- | --------------- |
| Add full Zod schemas and refactor immediately | Provides long-term consistency; fewer duplicate checks | Larger immediate change, risk of blocking other work | Deferred to allow progress; planned as next milestone |
| Continue without checks and handle errors downstream | No immediate work | Continued risk of runtime errors and wasted dev time | Rejected due to high risk |

## Consequences

### Positive

- Immediate reduction of invalid payloads reaching business logic
- Faster developer feedback on input errors during integration

### Negative

- Temporary duplication of validation logic across routes
- Requires later migration which must be scheduled and executed carefully

## Risks

- Migration to Zod may require coordination across multiple modules and could introduce regressions if not covered by tests.

## References

- Refactor report: docs/reports/refactor-reports/REP-REFACTOR-001-site-shell.md

