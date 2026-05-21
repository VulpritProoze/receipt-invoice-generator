# Test Report: ESLint Lint Fix Verification

---

doc_id: REP-TEST-002
title: ESLint Lint Fix Verification
version: 1.0.0
status: final
created: 2026-05-21
updated: 2026-05-21
author: Copilot
reviewers: none
tags: report, test, automated
changelog:

- version: 1.0.0
  date: 2026-05-21
  author: Copilot
  note: Post-lint-fix test run verification

---

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run timestamp  | 2026-05-21T03:22:00Z                    |
| Triggered by   | lint fix validation                     |
| Git branch     | main                                    |
| Git commit     | 1c2fd64                                 |
| Node version   | v24.14.0                                |
| Total duration | 27.124 s                                |

## Summary

| Test Type         | Total | Passed | Failed | Skipped | Duration |
| ----------------- | ----- | ------ | ------ | ------- | -------- |
| Linting (initial) | —     | ✅     | —      | —       | —        |
| Unit              | 200   | 185    | 15     | 0       | —        |
| Snapshot          | 0     | 0      | 0      | 0       | —        |
| Schema            | 10    | 10     | 0      | 0       | —        |
| Contract          | 40    | 22     | 18     | 0       | —        |
| Fixture           | 0     | 0      | 0      | 0       | —        |
| Integration       | 60    | 46     | 14     | 0       | —        |
| Security          | 59    | 39     | 20     | 0       | —        |
| Linting (final)   | —     | ✅     | —      | —       | —        |
| **Total**         | 369   | 302    | 67     | 0       | 27.124 s |

**Overall result**: ❌ FAIL (due to pre-existing environmental config issues)

## Failed Tests

### Environmental/Configuration Failures

- **File**: Multiple files (e.g. `src/modules/users/userService.ts`, `src/modules/reports/invoicePDF.ts`, `src/app/api/reports/receipt/[receiptID]/route.ts`)
- **Type**: unit / contract / integration / security
- **Error**:
  - `ReferenceError: TextEncoder is not defined`
  - `ReferenceError: Request is not defined`
  - `SyntaxError: Unexpected token 'export'` (for ES Modules inside `node_modules/uuid`)
- **Root cause**: Pre-existing Node/Jest environment issues where browser-like global properties (`Request`, `TextEncoder`) are not polyfilled or mock-injected in the Jest test environment, and ES Module packages like `uuid` are not correctly compiled or mapped by Jest.
- **Resolution**: Pending configuration fixes in `jest.config.ts` or `jest.setup.ts`. These errors are pre-existing and are not related to the linting syntax fixes applied in this session.

## Coverage Summary

| Area                        | Line Coverage    | Branch Coverage | Target Met? |
| --------------------------- | ---------------- | --------------- | ----------- |
| `src/lib/`                  | N/A              | N/A             | N/A         |
| `src/modules/`              | N/A              | N/A             | N/A         |
| `src/models/` (Zod schemas) | 100%             | 100%            | ✅          |
| Components (snapshot)       | 0/0 components   | —               | N/A         |

## Notes

- Initial and final linting bookends passed with zero warnings and zero errors.
- Pre-existing configuration issues block complete execution of unit and contract tests in the Jest command line runner due to missing `TextEncoder` and `Request` polyfills in the Node test environment.
