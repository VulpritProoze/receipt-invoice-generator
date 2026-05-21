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
| 2 — Agent Files & Hooks | ✅ Complete    | Created tester agent and updated orchestrator/test-lint-fix-iterate loop configuration                                                |
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

## Session Logs

Session logs are saved as individual files in `docs/reports/session-logs/unresolved/` when a session completes. The `session-resolver` skill is run to merge/resolve these logs into the primary documentation, rules, and core `AGENTS.md` instructions, after which the log file is moved to `docs/reports/session-logs/resolved/`.
