# AGENTS.md

## Project: BillGen

**Status**: Bootstrapping
**Last Updated**: 2026-05-21
**Active Agent**: Copilot

---

## Phase Log

| Phase                   | Status         | Notes                                                                                                                                 |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Dependency Research | ✅ Complete    | Core package set researched and documented in ADRs                                                                                    |
| 1 — Project Scaffold    | ✅ Complete    | Base workspace structure, app shell, models, docs, and fixtures created                                                               |
| 2 — Agent Files & Hooks | ⬜ Not Started | Deferred per user request                                                                                                             |
| 3 — Data Models         | ⬜ Not Started |                                                                                                                                       |
| 4 — Database Layer      | ⬜ Not Started |                                                                                                                                       |
| 5 — Core Modules        | ⬜ Not Started |                                                                                                                                       |
| 6 — Import Module       | ⬜ Not Started |                                                                                                                                       |
| 7 — Report Generation   | ⬜ Not Started |                                                                                                                                       |
| 8 — Onboarding Flow     | ⬜ Not Started |                                                                                                                                       |
| 9 — Testing Setup       | 🟡 In Progress | Jest harness, setup file, schema tests, and initial report scaffold added; ESLint 10 flat-config migration still blocks lint bookends |
| 10 — Documentation      | ⬜ Not Started |                                                                                                                                       |
| 11 — Deployment Setup   | ⬜ Not Started |                                                                                                                                       |

---

## Open Questions / Blockers

- [ ] Confirm whether the app should remain single-tenant for the first bootstrap pass
- [x] Migrate ESLint 10 to flat config and restore lint execution against the existing repo rules so the test lint bookends can run. Zero errors and zero warnings achieved.

---

## Hand-off Notes

Scaffolded the core Next.js workspace, added typed models with Zod schemas, created ADRs and getting-started docs, and generated import fixtures including a real XLSX workbook. Template image files still could not be copied into the repo because the environment did not expose them as workspace files.

---

## Session Log

### Session: 2026-05-20T09:57:56.5937615+08:00

**Agent**: Copilot
**Session focus**: Split the scaffold into atomic commits and added a reusable commit-report workflow.
**Files changed**:

- `package.json`, `package-lock.json`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `.gitignore`, `.eslintrc.json`, `.prettierrc`, `jest.config.ts`, `jest.setup.ts`, `next-env.d.ts` — project tooling and test harness
- `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, starter assets under `public/` and `src/app/favicon.ico` — app shell cleanup
- `src/lib/`, `src/models/`, `src/modules/import/__fixtures__/`, `src/components/.gitkeep`, `src/modules/invoices/.gitkeep`, `src/modules/receipts/.gitkeep`, `src/modules/users/.gitkeep`, `src/onboarding/.gitkeep` — domain models and runtime helpers
- `src/models/*.schema.test.ts`, `docs/reports/test-reports/REP-TEST-001-schema-harness-smoke.md` — schema coverage and smoke report
- `.agents/rules/`, `.agents/skills/`, `docs/architecture/`, `docs/decisions/`, `docs/getting-started/`, `docs/plans/`, `docs/templates/` — repository instructions and project documentation
- `docs/templates/commit-report-template.md`, `docs/reports/commit-reports/REP-COMMIT-001-atomic-commit-report.md` — reusable commit-report workflow and session report
  **Docs updated**:
- `docs/templates/commit-report-template.md` — new reusable commit-report template
- `docs/reports/commit-reports/REP-COMMIT-001-atomic-commit-report.md` — session commit report
  **Phase log changes**: Cleared the report-generation note about missing template images; no phase status changes were otherwise required.
  **ADRs created or updated**: None
  **Test run or no test run**: No test run this session
  **Open items added**: None
  **Notes**: Five atomic commits were created for the existing scaffold, and a commit-report workflow now exists under `docs/reports/commit-reports/` for future sessions.

  ### Session: 2026-05-20T10:12:41.1127205+08:00

  **Agent**: Copilot
  **Session focus**: Updated the atomic commit workflow to require a commit report document before the final report.
  **Files changed**:
  - `.agents/skills/git-committer-atomic/SKILL.md` — added a commit-report document phase under `docs/reports/commit-reports/`
    **Docs updated**:
  - None — this session only changed agent workflow guidance; no `docs/` content needed a content update beyond the required session log append.
    **Phase log changes**: None
    **ADRs created or updated**: None
    **Test run or no test run**: No test run this session
    **Open items added**: None
    **Notes**: No documentation updates required this session. Evaluated: source changes, package changes, model changes, env var changes, test activity, phase status changes, and deployment changes. None detected.

### Session: 2026-05-21T11:06:55+08:00

**Agent**: Antigravity (Orchestrator)
**Session focus**: Resolve major npm install dependency conflicts, update vulnerable packages, and restore lint test execution.
**Files changed**:
- `package.json` — Added ESLint and PostCSS overrides, replaced `xlsx` with `xlsx-js-style`.
- `src/modules/import/xlsxParser.ts` — Updated imports to use `xlsx-js-style`.
- `src/modules/import/xlsxParser.unit.test.ts` — Updated imports to use `xlsx-js-style`.
**Docs updated**:
- `docs/plans/npm-dependency-fix.md` — Documented the fixes.
**Phase log changes**: None
**ADRs created or updated**: Pending ADR for `xlsx-js-style` migration.
**Test run or no test run**: Ran `npm install`, `npm audit`, and `npm run lint`.
**Open items added**: 
- `npm run lint` now executes with the new flat config but uncovers 43 pre-existing source-code violations that need fixing.
**Notes**: Dependency issues blocking the workspace have been fully cleared.

### Session: 2026-05-21T11:23:00+08:00

**Agent**: Refactor Agent
**Session focus**: Refactored the codebase to resolve all 43 ESLint violations in `src/`.
**Files changed**:
- `src/app/api/import/route.contract.test.ts`
- `src/app/api/import/route.ts`
- `src/app/api/invoices/route.ts`
- `src/app/api/onboarding/route.contract.test.ts`
- `src/app/api/receipts/route.ts`
- `src/app/api/users/route.ts`
- `src/lib/db/company.ts`
- `src/lib/db/invoices.ts`
- `src/lib/db/receipts.ts`
- `src/lib/db/users.ts`
- `src/lib/idGenerator.ts`
- `src/lib/maskCreditCard.unit.test.ts`
- `src/models/company.schema.test.ts`
- `src/models/user.schema.test.ts`
- `src/modules/core.security.test.ts`
- `src/modules/import/import.integration.test.ts`
- `src/modules/import/importService.ts`
- `src/modules/import/importService.unit.test.ts`
- `src/modules/import/xlsxParser.ts`
- `src/modules/invoices/invoiceService.ts`
- `src/modules/invoices/invoiceService.unit.test.ts`
**Docs updated**:
- `docs/reports/refactor-report.md` — Created refactor report documenting the changes.
- `docs/reports/test-reports/REP-TEST-002-eslint-lint-fix-verify.md` — Created test report documenting the post-lint-fix test run verification.
**Phase log changes**: None.
**ADRs created or updated**: None.
**Test run or no test run**: Ran `npm test` and `npx eslint src/ --max-warnings 0`.
**Open items added**:
- Fix Jest environment polyfills (missing `TextEncoder`, `Request` globals) to allow the full test suite to execute successfully.
**Notes**: ESLint check now passes with zero errors and zero warnings. Existing environment configuration issues in Jest still cause unit and contract tests to fail in the console runner, unrelated to the refactored code.

### Session: 2026-05-21T12:44:53+08:00

**Agent**: Antigravity (Orchestrator)
**Session focus**: Create refactor report template and update agent/skill configurations.
**Files changed**:
- `.github/agents/orchestrator.agent.md` — Updated orchestrator instructions to check for refactor template compliance.
- `.agents/agents/orchestrator.md` — Synced orchestrator prompt changes.
- `.agents/skills/orchestrator/SKILL.md` — Updated step-by-step orchestrator skill instructions.
- `.github/agents/refactor.agent.md` — Updated refactor agent instructions to mandate using `refactor-report-template.md`.
- `.agents/agents/refactor.md` — Synced refactor prompt changes.
**Docs updated**:
- `docs/templates/refactor-report-template.md` — New template file for refactoring sessions.
- `docs/reports/refactor-report.md` — Created refactor report documenting these config updates.
**Phase log changes**: None.
**ADRs created or updated**: None.
**Test run or no test run**: No test run this session.
**Open items added**: None.
**Notes**: Standardized future refactoring documentation by introducing a mandated refactor report template across orchestrator and refactor agent instructions.

