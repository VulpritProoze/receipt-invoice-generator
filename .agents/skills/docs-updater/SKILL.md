---
name: docs-updater
user-invocable: false
description: 'Run at session end to evaluate the final diff, update any docs that drifted from the code or configuration, and save a session log to the unresolved session logs directory.'
---

# Docs Updater

Run this skill at the close of every Copilot agent session. Its job is to close documentation gaps created during the session and record exactly what happened.

## Purpose

Documentation drifts when source files change, packages are added, env vars appear, or decisions are made without their docs being updated. This skill evaluates the final session state, updates the necessary docs, and saves the outcome as a session log file under `docs/reports/session-logs/unresolved/SES-[timestamp].md` so it can be resolved later.

## When to Invoke

- Mandatory: automatically at session end through the `session-end` hook.
- Optional: mid-session after a large batch of changes if you want to sync docs before moving on.

## Pre-Condition: Establish the Session Diff

Before deciding what to update, determine what changed this session.

- Check `git status`.
- Check `git diff --name-only HEAD`.
- If the diff cannot be established, do not guess. Record the uncertainty in the session log file as an open item: `Session diff unavailable — manual documentation review recommended before marking this session complete.`

## Decision Flow

Work through the seven questions in order. Answer yes or no from the session diff, then act on each yes before moving on.

1. Source changes in `src/`
   - If files in `src/` changed, verify the relevant architecture docs still describe the current module behavior.
   - Update architecture docs when function signatures, data shapes, extracted utilities, dependencies, route behavior, or error handling changed.
   - If `src/models/` changed, also update `docs/architecture/data-models.md`.

2. Package changes in `package.json`
   - If packages were added, removed, or changed, check `docs/decisions/` for a matching ADR.
    - If no ADR exists, use `generate-adr` to create one in `proposed` status and add a review item to the session log file open items.
   - If an existing ADR is still current but version-sensitive, update the research findings and bump the ADR version.

3. Model and schema changes
   - If TypeScript interfaces or Zod schemas in `src/models/` changed, update `docs/architecture/data-models.md` with the current constraints and field behavior.
   - Verify any other architecture docs that reference those models are still accurate.

4. Environment variable changes
   - If env vars were added, removed, or renamed, update `docs/getting-started/env-setup.md`.
   - Document the variable name, purpose, source, and whether it is required or optional.

5. Test activity
   - If tests ran or test files changed, confirm a report exists in `docs/reports/test-reports/` when a test run occurred.
    - If a test run occurred without a report, treat that as a blocker and note it in the session log file.
    - If test files changed, update `docs/architecture/testing-strategy.md` when the test setup or coverage strategy changed.

6. Phase log changes
    - If a phase was completed or moved, verify the underlying conditions actually hold in the workspace (and note the phase state change in the session log file).
    - If a phase is not truly complete, note it in the session log file to be resolved/corrected in the phase log later.
    - Add a hand-off note to the session log file when the session closes with work for the next agent.

7. Deployment, setup, or onboarding changes
   - If setup, onboarding, deployment, or import expectations changed, update the relevant getting-started or architecture docs.
   - Keep the guide current for first-time users and deployment readers.

## What to Update

Use the appropriate doc workflow when a gap is found:

- `generate-doc` for normal docs updates.
- `generate-adr` for dependency or decision changes.
- `docs/reports/test-reports/` updates only when a test run produced a report that needs metadata completion.

When updating docs:

- Increment the version appropriately.
- Update `updated` to today.
- Append to the changelog instead of rewriting history.
- Keep status accurate.

## Session Log Entry

Save a new session log entry as a file under `docs/reports/session-logs/unresolved/SES-[timestamp].md`. Do not edit or delete prior logs.

The entry should include:

- Session timestamp.
- Agent name.
- Session focus.
- Files changed this session.
- Docs updated.
- Phase log changes.
- ADRs created or updated.
- Test run or no test run.
- Open items added.
- Notes for the next agent.

If all seven questions were no, include this explicit statement in the session log notes:
`No documentation updates required this session. Evaluated: source changes, package changes, model changes, env var changes, test activity, phase status changes, and deployment changes. None detected.`

## Completion Criteria

This skill is complete only when all of the following are true:

- The final session diff was evaluated, or the inability to determine it was recorded as an open item.
- Every yes answer resulted in a concrete doc update or blocker note.
- Any required ADRs were created or updated.
- The session log file was saved to `docs/reports/session-logs/unresolved/SES-[timestamp].md`.
- All docs changed this session have their version, updated date, and changelog updated.
- No dependency added this session is missing an ADR.

## Do Nots

- Do not skip the evaluation because the session was short.
- Do not assume the diff is empty if it cannot be checked.
- Do not update docs speculatively.
- Do not pad the session log with empty statements.
- Do not edit or delete previous session log files.
- Do not mark the session clean if a test run happened without a report.
- Do not treat future plans as completed work.

## Output

The expected result of using this skill is an up-to-date documentation set and a truthful session log that reflects the exact state of the workspace at session end.
