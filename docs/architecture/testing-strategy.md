# Testing Strategy

---

doc_id: ARCH-006
title: Testing Strategy
version: 1.2.1
status: draft
created: 2026-05-20
updated: 2026-05-21
author: Copilot
reviewers: none
tags: architecture, testing, jest, zod
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial draft
- version: 1.1.0
  date: 2026-05-20
  author: Copilot
  note: Documented the initial Jest harness, schema tests, and test report directory
- version: 1.1.1
  date: 2026-05-21
  author: docs
  note: Updated ESLint status to reflect the completed flat-config migration and cleanup.
- version: 1.2.0
  date: 2026-05-21
  author: Copilot
  note: Added a tiered verification cadence and linked the agentic-first optimization plan.
- version: 1.2.1
  date: 2026-05-21
  author: Copilot
  note: Added a direct reference to the two-tier testing cadence decision record.

---

## Overview

The project uses a layered test strategy so pure logic, schemas, route handlers, and user-facing components are all covered without hitting real infrastructure.

## Test Types

- Unit: pure calculations, ID generation, masking, date normalization.
- Schema: Zod validation and TypeScript interface parity.
- Contract: route handler request/response shape.
- Fixture: CSV/XLSX parsing with static sample files.
- Security: guardrails such as masking and invalid input rejection.

## Execution Order

The verification workflow should be tiered instead of treated as one large loop.

- End-of-session checks should only touch the changed scope, run the cheapest relevant lint and test targets, and stop after one repair pass if the slice is still failing.
- End-of-day checks can widen to nearby integration, contract, and security slices for the same feature area, but still stay scoped to the affected modules.
- Deep repair loops should be reserved for the smallest failing slice, not used as the default path for every session.

The old lint-bookend pattern is still useful for repair work, but it should not be the default shape of every agentic test run because it increases latency and token usage without improving signal for clean slices.

## Mock Patterns

- Redis must be mocked through `src/lib/__mocks__/redis.ts`.
- PDF generation should be mocked in tests that are not explicitly verifying rendering output.
- No test should reach live Upstash infrastructure.

## Current Harness

- Jest is configured at the repository root in `jest.config.ts` with a dedicated setup file at `jest.setup.ts`.
- The first real test slice lives in `src/models/*.schema.test.ts` and covers the four Zod-backed data models.
- Test reports are written to `docs/reports/test-reports/` using the shared report template.

## Zod Strategy

Zod schemas are the runtime validation layer and the canonical source for schema tests. Every schema must have coverage for valid input and representative invalid permutations.

## Fixture Organization

Import fixtures live under `src/modules/import/__fixtures__/` and should be named by scenario, not by test order.

## Coverage Targets

- Aim for above 80% line coverage on `src/lib/` and `src/modules/`.
- Maintain 100% schema test coverage for all Zod schemas.

## Workflow Notes

- `/run-tests` remains the primary runner for broader verification, but it should not be the only way to validate a change.
- The current `test-lint-fix-iterate` workflow is too expensive as a universal entry point and should be treated as a repair path after the cheapest scoped checks fail.
- The workflow-specific optimization plan lives in [docs/plans/agentic-test-workflow-optimization.md](../plans/agentic-test-workflow-optimization.md).
- The cadence decision itself is captured in [DEC-009: Two-Tier Testing Cadence](../decisions/DEC-009-two-tier-testing-cadence.md).
- The ESLint 10 flat-config migration has been completed, and all source-code lint violations have been resolved. Linting runs cleanly as a test suite bookend.

## Suggested Cadence

### End of Session

- Run only the tests and lint targets that map to the changed files or the owning module.
- Prefer one focused unit or schema suite over many broad suites.
- If the scoped checks fail, repair the smallest slice and rerun only that slice once before escalating.
- Skip broad coverage or full-suite sweeps unless the change touches shared infrastructure.

### End of Day

- Run the scoped module tests plus one adjacent contract or security layer for the same feature area.
- Include a single report only when the day-end run is meant to certify a slice or hand it off.
- If the infrastructure is unstable, record the failure mode first and avoid repeated reruns until the harness issue is isolated.

### Repair Path

- Use the agentic workflow only after a scoped check fails.
- Keep the failure context narrow: pass the exact file, test, and log fragment needed to diagnose the problem.
- Stop after two repeated failures on the same slice and escalate the blocker instead of continuing the loop.
