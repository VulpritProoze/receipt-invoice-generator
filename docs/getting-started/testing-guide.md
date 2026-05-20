# Testing Guide

---
doc_id: GS-005
title: Testing Guide
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: getting-started, testing
changelog:
  - version: 1.0.0
    date: 2026-05-20
    author: Copilot
    note: Initial
---

## Prerequisites
- Node.js 24.x or newer.
- Jest installed through project dependencies.

## Running the Suite
```bash
npm test
```
or via the `/run-tests` workflow when available in the agent layer.

## Running One Test Type
```bash
npx jest --testPathPattern="\.unit\.test\."
```

## Reading Reports
Test runs produce reports in `docs/reports/test-reports/`.

## Updating Snapshots
Use `--updateSnapshot` only when the UI change is intentional and reviewed.

## Adding a New Test
Create the test next to the source file using the `[filename].[test-type].test.ts(x)` pattern and place fixture data in `src/modules/import/__fixtures__/` when needed.

## Zod Schema Pattern
Keep the schema beside the interface, test a valid object, and then test invalid permutations for each required field.

## Debugging
- Read the Jest failure output first.
- Re-run with `--verbose` if needed.
- Check mock setup before chasing application logic.