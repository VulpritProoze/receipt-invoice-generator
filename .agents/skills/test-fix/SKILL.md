---
name: test-fix
user-invocable: true
description: 'Use when tests are already failing and you need the smallest reliable fix. Read the failure output, isolate the root cause, repair the source or test setup, rerun the narrowest proving check, and update the test report.'
---

# Test Fix

Use this skill when a test run has already failed and you need to repair the failure without widening the scope unnecessarily.

## When to Use

Use this skill when:

- A test report shows failures.
- Jest output is already available.
- You need to fix a failing test, fixture, mock, or source behavior with minimal change.

## Workflow

1. Read the failure evidence first.
   - Inspect the test output, failure stack trace, and any existing report.
   - Identify the failing test family and the specific file or fixture involved.

2. Reproduce the smallest failure.
   - Run the narrowest Jest command that still shows the problem.
   - Prefer a single test file or a focused pattern over the whole suite.

3. Classify the failure.
   - Source bug: fix the production code.
   - Test setup bug: fix the test file, fixture, or mock.
   - Environment or blocker: surface it clearly instead of guessing.

4. Make the smallest credible fix.
   - Change one slice at a time so the cause of the improvement is visible.
   - Keep repo patterns intact, especially the mocked Redis and PDF behaviors described in the testing docs.

5. Re-run the narrow check.
   - Confirm the original failure is gone.
   - If the fix touched broader code paths, run the adjacent tests that are most likely to be affected.

6. Update the test report.
   - If a report already exists, update the failure status and resolution notes.
   - If the failure was resolved during the session, make sure the report reflects the final state, not the earlier intermediate state.

## Guardrails

- Do not change expectations just to make a test pass unless the behavior change is intentional.
- Do not broaden the test scope until the smallest failing case is understood.
- Do not assume a failure is in application code when the fixture or mock is more likely.
- Do not keep looping on the same failure without a new hypothesis.
- Do not leave the report stale after the fix.

## Completion Criteria

This skill is complete only when:

- The failing test has been reproduced and understood.
- The minimal fix has been applied.
- The narrow proving test passes again.
- The report reflects the resolution or the remaining blocker.

## Output

The expected result of using this skill is a localized test repair, a passing proving check, and an updated test report that records the fix.
