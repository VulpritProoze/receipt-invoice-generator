# Remove Integration and Snapshot Tests

---

doc_id: PLAN-012
title: Remove Integration and Snapshot Tests
version: 1.1.0
status: approved
created: 2026-05-22
updated: 2026-05-23
author: Antigravity
reviewers: User
tags: plan, testing, architecture
changelog:

- version: 1.1.0
  date: 2026-05-23
  author: Bob (Code mode)
  note: Plan executed - all integration and snapshot tests removed, documentation updated
- version: 1.0.0
  date: 2026-05-22
  author: Antigravity
  note: Initial draft

---

## Objective

Remove all stateful integration tests and brittle React component snapshot tests. Since migrating the database layer to SQLite in Phase 4, the integration tests (which were originally written for a Redis-first mock architecture) have been failing with unique constraint errors and false negatives. 

Removing these tests and focusing purely on Schema, Unit, and Contract tests will significantly reduce test suite maintenance and complexity while preserving robust validation appropriate for an MVP.

## Scope

### In Scope

- Deleting all existing `*.integration.test.ts` files across the repository (`src/lib/db/database.integration.test.ts`, `src/modules/import/import.integration.test.ts`, `src/modules/reports/reports.integration.test.ts`, `src/modules/core.integration.test.ts`, `src/onboarding/onboarding.integration.test.ts`).
- Deleting all existing `.test.tsx` React component snapshot tests (`src/components/Footer.test.tsx`, `src/components/Nav.test.tsx`, `src/app/onboarding/OnboardingForm.test.tsx`).
- Updating `.agents/rules/testing-protocol.md` and `.bob/rules/testing-protocol.md` to formally remove integration and snapshot coverage targets, execution order steps, naming rules, and mock patterns.
- Updating `docs/architecture/testing-strategy.md` to remove integration and snapshot test references.
- Modifying `.agents/skills/test-generator/SKILL.md`, `test-lint-fix-iterate/SKILL.md`, and `test-lint-fix/SKILL.md` to stop generating or expecting integration and snapshot tests.

### Out of Scope

- Modifying existing Unit, Schema, or Contract tests.
- Removing or modifying Fixture tests.
- Changing production logic or application code.

## Milestones

| Milestone                    | Target Date | Owner            | Status   |
| ---------------------------- | ----------- | ---------------- | -------- |
| Delete existing test files   | 2026-05-23  | Bob (Code mode)  | Complete |
| Update Architecture Docs     | 2026-05-23  | Bob (Code mode)  | Complete |
| Update Agent Rule Protocols  | 2026-05-23  | Bob (Code mode)  | Complete |
| Update AI Skill Definitions  | 2026-05-23  | Bob (Code mode)  | Complete |

## Dependencies

- None

## Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Missed regression | Low | Medium | Rely heavily on comprehensive Zod schema tests and unit tests to catch core logical errors before they reach UI/network boundaries. |
| Undetected UI breakage | Medium | Low | React snapshot tests are notoriously brittle; manual UI testing or visual regression testing in the future provides a better ROI. |

## Open Questions

- Should we completely remove the heavy `test-lint-fix-iterate` workflow and rely solely on `quick-test-lint-fix` now that the testing surface is much smaller? -> User answer: *YES*
