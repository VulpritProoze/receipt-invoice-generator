# NPM Dependency Fix

---

doc_id: PLAN-002
title: NPM Dependency Fix
version: 1.1.0
status: approved
created: 2026-05-21
updated: 2026-05-21
author: Copilot
reviewers: none
tags: plan, npm, dependencies, eslint, postcss, xlsx
changelog:

- version: 1.0.0
  date: 2026-05-21
  author: Copilot
  note: Initial documentation of dependency fixes
- version: 1.1.0
  date: 2026-05-21
  author: docs
  note: Updated linting milestones and open questions to reflect completed codebase refactoring.

---

## Objective

Document the resolution of npm install peer dependency issues, including package overrides and security patches.

## Scope

### In Scope

- Resolving peer dependency conflicts for ESLint v10 with Next.js and its plugins.
- Patching `postcss` vulnerability.
- Replacing `xlsx` with a secure alternative to address prototype pollution and ReDoS vulnerabilities.

### Out of Scope

- Fixing the source-code linting errors caused by the new ESLint flat config.

## Resolutions

### ESLint Peer Dependencies

We used `package.json` `overrides` to force the following packages to accept `eslint@10.4.0`:
- `eslint-plugin-import`
- `eslint-plugin-react`
- `eslint-plugin-jsx-a11y`
- `eslint-config-next`

### PostCSS Vulnerability

Added a `postcss` override for Next.js to patch a known vulnerability in earlier versions of `postcss`.

### XLSX Security Issues

Replaced the `xlsx` package with `xlsx-js-style` to patch prototype pollution and ReDoS vulnerabilities present in the original package.

## Current State

- `npm install` and `npm audit` now run cleanly with zero vulnerabilities and conflicts.
- All 43 source-code linting errors caused by the new ESLint flat config have been successfully fixed under a dedicated refactor phase. `npm run lint` now passes with zero errors and zero warnings (see `docs/reports/refactor-report.md`).

## Milestones

| Milestone | Target Date | Owner | Status |
| --------- | ----------- | ----- | ------ |
| Resolve dependency conflicts | 2026-05-21 | Copilot | Complete |
| Fix security vulnerabilities | 2026-05-21 | Copilot | Complete |
| Run cleanly without audit errors | 2026-05-21 | Copilot | Complete |
| Address linting errors | 2026-05-21 | Refactor Agent | Complete |

## Dependencies

- npm overrides feature (npm v8+)
- Next.js 15
- ESLint 10

## Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Lint rules mismatching old code | High | Medium | Defer lint fixing to a dedicated session, preserving build capability for now |

## Open Questions

- **Resolved**: The 43 linting errors in the source code have been fully addressed and resolved in the subsequent refactor session.
