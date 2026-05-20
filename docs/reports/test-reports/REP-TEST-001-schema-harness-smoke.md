# Test Report: Schema Harness Smoke

---

doc_id: REP-TEST-001
title: Schema Harness Smoke
version: 1.0.0
status: final
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: report, test, schema, jest
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial test report for the first Jest harness slice

---

## Run Metadata

| Field          | Value                            |
| -------------- | -------------------------------- |
| Run timestamp  | 2026-05-20T00:00:00Z             |
| Triggered by   | manual implementation validation |
| Git branch     | master                           |
| Git commit     | daf0034                          |
| Node version   | v24.14.0                         |
| Total duration | 6.829 s                          |

## Summary

| Test Type         | Total   | Passed | Failed | Skipped | Duration |
| ----------------- | ------- | ------ | ------ | ------- | -------- |
| Linting (initial) | blocked | —      | —      | —       | —        |
| Unit              | 0       | 0      | 0      | 0       | —        |
| Snapshot          | 0       | 0      | 0      | 0       | —        |
| Schema            | 10      | 10     | 0      | 0       | 6.829 s  |
| Contract          | 0       | 0      | 0      | 0       | —        |
| Fixture           | 0       | 0      | 0      | 0       | —        |
| Integration       | 0       | 0      | 0      | 0       | —        |
| Security          | 0       | 0      | 0      | 0       | —        |
| Linting (final)   | blocked | —      | —      | —       | —        |
| **Total**         | 10      | 10     | 0      | 0       | 6.829 s  |

**Overall result**: ⚠ PARTIAL

## Failed Tests

_(Leave empty if all tests passed)_

## Coverage Summary

| Area                        | Line Coverage  | Branch Coverage | Target Met? |
| --------------------------- | -------------- | --------------- | ----------- |
| `src/lib/`                  | N/A            | N/A             | N/A         |
| `src/modules/`              | N/A            | N/A             | N/A         |
| `src/models/` (Zod schemas) | 100%           | 100%            | ✅          |
| Components (snapshot)       | 0/0 components | —               | N/A         |

## Notes

- Focused schema-harness smoke run only; this was not a full-suite `/run-tests` execution.
- All four schema test files passed: company, invoice, receipt, and user.
- ESLint lint bookends could not run in this session because ESLint 10 on the current workspace requires a flat-config migration and the repo still only has `.eslintrc.json`.
- The test harness itself is in place with `jest.config.ts`, `jest.setup.ts`, and initial schema tests under `src/models/`.
