---
name: quick-test-lint-fix
description: One-pass end-of-session skill for scoping a change, running the smallest useful lint/test checks, and allowing at most one repair-and-rerun cycle.
---

# Quick Test Lint Fix

## Purpose
Use this skill for end-of-session cleanup when the goal is to verify a small slice of work quickly. Keep the scope tight, prefer existing summaries or handoff notes, and avoid broad discovery unless a narrow check needs it.

## One-Pass Workflow
1. Scope the touched slice from the request, recent edits, or the closest handoff note.
2. Run the smallest useful lint or test checks for that slice. Restrict test families to **unit**, **schema**, **contract**, and **fixture** tests only.
	- Example tester command pattern: `npx jest --testPathPatterns=".*(unit|schema|contract|fixture)\\.test\\.(ts|tsx)$"`
3. If the check fails, make one repair pass only.
4. Rerun the same focused check once.
5. Stop after that rerun, whether it passes or fails.

## Repair Cap
- Allow exactly one repair-and-rerun cycle.
- Do not expand into a second iteration.
- Do not implement end-of-day mode.

## Guardrails
- Do not execute commands directly from the skill.
- Do not gather broad context unless the narrow slice is still unclear.
- Use file-reader or code-explorer only when needed to narrow the touched slice.
- Do not require system-wide checks.
- Do not require reports, commits, or follow-up workflow steps.
- Keep the skill concise and aligned with the repo's existing orchestrator/testing conventions.
