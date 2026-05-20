# AGENTS.md

## Project: BillGen

**Status**: Bootstrapping
**Last Updated**: 2026-05-20
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
- [ ] Migrate ESLint 10 to flat config or otherwise restore lint execution against the existing repo rules so the test lint bookends can run. Current `.eslintrc.json` is not recognized by the installed ESLint binary.

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
