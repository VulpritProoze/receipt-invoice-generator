# Testing Strategy

---

doc_id: ARCH-006
title: Testing Strategy
version: 1.1.1
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

---

## Overview

The project uses a layered test strategy so pure logic, schemas, route handlers, and user-facing components are all covered without hitting real infrastructure.

## Test Types

- Unit: pure calculations, ID generation, masking, date normalization.
- Snapshot: React component structure and stable rendering output.
- Schema: Zod validation and TypeScript interface parity.
- Contract: route handler request/response shape.
- Fixture: CSV/XLSX parsing with static sample files.
- Integration: module-level flows with mocked Redis and mocked PDF generation.
- Security: guardrails such as masking and invalid input rejection.

## Execution Order

The suite starts with linting, runs the test families, and ends with linting again. Lint bookends the suite so any accidental regression introduced during test setup is caught before the phase can be marked complete.

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
- Maintain snapshot coverage for all user-facing components.
- Maintain 100% schema test coverage for all Zod schemas.

## Workflow Notes

- `/run-tests` is the primary suite runner and must always generate a report.
- `/test-fix-iterate` handles failure repair in small loops until the suite is green or the blocker is clear.
- The ESLint 10 flat-config migration has been completed, and all source-code lint violations have been resolved. Linting runs cleanly as a test suite bookend.
