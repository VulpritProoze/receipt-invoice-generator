# ADR-009: Two-Tier Testing Cadence

---

doc_id: DEC-009
title: Two-Tier Testing Cadence
version: 1.0.0
status: accepted
created: 2026-05-21
updated: 2026-05-21
author: Copilot
reviewers: none
tags: decision, testing, workflow, orchestration
changelog:

- version: 1.0.0
  date: 2026-05-21
  author: Copilot
  note: Initial decision documenting the agentic-first two-tier verification cadence

---

## Context

The previous `test-lint-fix-iterate` workflow was too slow and token-heavy to serve as the default verification path. It also assumed a monolithic repair loop, which made clean changes pay for failure handling that they did not need.

The repository now needs a cheaper cadence that still catches regressions before handoff while keeping repair behavior available when a scoped check actually fails.

## Decision

Use a two-tier verification cadence:

- End-of-session checks run only the scoped lint and tests that map to the changed files or owning module.
- End-of-day checks broaden to adjacent verification for the same feature area when a larger handoff needs confidence.
- Repair mode is entered only after a scoped failure, not as the default path for every run.

## Alternatives Considered

| Option | Pros | Cons | Reason Rejected |
| ------ | ---- | ---- | --------------- |
| Keep the old loop unchanged | Familiar and already documented. | Slow, token-heavy, and too broad for clean slices. | It keeps the same inefficiency that triggered this change. |
| Keep the loop but narrow it | Lower cost than the current default. | Still centered on a repair-first model and still mixes verification with recovery. | It improves the edges but does not fix the workflow shape. |
| Adopt a two-tier cadence | Cheap for session-end checks and stronger for end-of-day handoff checks. | Requires a clearer mapping from change scope to verification targets. | Selected. It matches the repository's actual testing needs. |

## Consequences

### Positive

- Clean changes no longer pay for broad repair-loop overhead.
- Session-end verification stays cheap enough to run routinely.
- End-of-day verification still gives a broader signal before handoff.
- Repair behavior remains available without becoming the default control flow.

### Negative

- The workflow now depends more heavily on correct scope-to-test mapping.
- End-of-day checks require more discipline than the old one-size-fits-all loop.

### Risks

- Scoped checks can miss regressions outside the touched slice if the module map is wrong.
- Harness instability can still block the cadence even when the workflow itself is correct.
- Repair mode may still be overused if scope detection is too coarse.

## References

- [Plan: Agentic-First Test Workflow Optimization](../plans/agentic-test-workflow-optimization.md)
- [Testing Strategy](../architecture/testing-strategy.md)