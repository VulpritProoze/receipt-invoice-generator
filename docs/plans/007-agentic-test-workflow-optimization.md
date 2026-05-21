# Plan: Agentic-First Test Workflow Optimization

---

doc_id: PLAN-005
title: Agentic-First Test Workflow Optimization
version: 1.1.0
status: in progress
created: 2026-05-21
updated: 2026-05-21
author: Copilot
reviewers: none
tags: plan, testing, workflow, orchestration, jest, lint
changelog:

- version: 1.0.0
  date: 2026-05-21
  author: Copilot
  note: Initial brainstorming plan for a cheaper two-tier agentic testing workflow
- version: 1.1.0
  date: 2026-05-21
  author: Copilot
  note: Converted the draft into an implementation-tracking plan after the workflow skill rewrite landed; harness stabilization remains open

---

## Objective

Track the rollout of the agentic-first testing workflow so the default verification path stays narrow, cheap, and easy to trust.

The workflow skill rewrite is complete. The remaining work is harness stabilization so the scoped checks can run reliably without falling back to the repair loop as the default path.

## Scope

### In Scope

- A lightweight end-of-session gate for changed-file verification
- A broader end-of-day gate for feature-slice verification
- A clearer mapping from changed files to test targets
- A smaller failure context handed to repair agents
- A workflow skill that matches the available tools in this workspace
- A decision on when reports are required and when they are skipped

### Out of Scope

- Rewriting the product test suite from scratch
- Adding new infrastructure that the current repo does not need
- Full-suite runs on every session end
- Broad, always-on agent orchestration for clean changes

## Current Workflow

### Tier 1: End of Session

Use this when a coding session is about to close and the goal is to keep momentum without burning tokens.

- Identify the smallest owning module for the changed files.
- Run the cheapest lint target for that scope.
- Run only the unit, schema, or contract tests that directly cover the touched slice.
- Stop after one repair loop if the slice fails again.
- Avoid generating a full report unless the session is meant to hand off a validated slice.

### Tier 2: End of Day

Use this when the day is ending and the goal is to certify a feature area, not just a local edit.

- Run the session-end checks first.
- Expand to nearby integration tests and any adjacent security or contract coverage.
- Produce a report for the day-end verification run.
- Capture the failure pattern if the harness is unstable instead of rerunning the same broken path repeatedly.

### Repair Mode

Only enter repair mode after a scoped check fails.

- Pass the exact failing file, command, and log fragment to the repair agent.
- Keep the fix surface to one file when possible.
- Re-run the same scoped check immediately after the fix.
- Escalate after the same failure repeats twice.

## Milestones

| Milestone | Target Date | Owner | Status |
| --------- | ----------- | ----- | ------ |
| Audit current test commands, scopes, and failure patterns | 2026-05-21 | Copilot | Complete |
| Refine the workflow skill to use supported tools and narrower prompts | 2026-05-21 | Copilot | Complete |
| Document the final cadence in the testing strategy | 2026-05-21 | Copilot | Complete |
| Stabilize the harness so the chosen gates are actually executable | 2026-05-21 | Copilot | In progress |

## Dependencies

- A working Jest harness and setup file
- Stable ESLint commands for scoped paths
- Accurate module-to-test mapping
- The ability to pass concise logs and files into repair agents
- A workflow instruction set that matches the available tools in this workspace

## Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| The workflow skill references unsupported tools or stale orchestration assumptions | High | High | Rewrite the workflow around the tools that actually exist in this environment and keep the prompt narrower |
| The test harness still has environment issues that hide real failures | Medium | High | Treat harness failures as infrastructure blockers and isolate them before chasing product bugs |
| Scoped checks miss regressions outside the touched slice | Medium | Medium | Add the end-of-day tier so adjacent coverage still runs before handoff |
| Repair loops keep retrying the same failure | Medium | Medium | Cap the repeat count and surface the blocker early |

## Open Questions

No design questions remain open. The remaining work is implementation verification and harness stabilization.

## Next Steps

1. Stabilize the Jest and ESLint harness so the session-end and day-end gates execute reliably.
2. Re-run the scoped verification paths against the changed-module map and confirm repair mode stays secondary.
3. Close the plan once the harness no longer blocks the documented cadence.