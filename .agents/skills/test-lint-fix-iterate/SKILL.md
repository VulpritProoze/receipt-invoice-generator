---
name: test-lint-fix-iterate
user-invocable: true
description: 'Use when you need a controlled lint -> format -> test -> test-fix loop until BillGen is green or a blocker is clear. Run lint first, then format, then tests, then fix the highest-priority failure slice, and repeat with a hard cycle cap.'
---

# Test Lint Fix Iterate

Use this skill when lint, formatting, and tests may all need repair and you want a controlled loop that converges or stops with a clear blocker.

## When to Use

Use this skill when:
- A change affects both lint and test state.
- The suite is not green and you want one workflow to iterate safely.
- You need a bounded repair loop instead of ad hoc back-and-forth.
- You want the repo's standard lint, format, test, and test-fix skills chained in a single repair pass.

## Workflow

1. Run lint first.
   - Execute `npx eslint src/ --max-warnings 0`.
   - Fix lint errors before treating test failures as final signal.

2. Run format second.
   - Execute the repo's formatting workflow on the touched files or scope.
   - Apply Prettier first, then ESLint `--fix`, then verify the result.
   - Treat formatting issues as part of the repair chain, not as an afterthought.

3. Run the tests.
   - Execute `npm test` or the narrowest relevant Jest scope.
   - Preserve the actual failure output for the report and the next repair decision.

4. Fix the highest-priority failure slice.
   - Prefer the smallest slice that explains the current failure.
   - Resolve lint, then format, then test, then shared setup issues in that order.
   - Use the `test-fix` skill for the repair step so the narrowest proving check is always rerun.

5. Repeat the loop.
   - Re-run lint.
   - Re-run format on the touched files or scope.
   - Re-run the relevant tests.
   - Fix the next failure slice.
   - Continue until the selected scope is clean.

6. Stop with a hard cap.
   - Cap the loop at 5 cycles unless a new, materially different hypothesis appears.
   - If the same failure repeats twice, stop and surface the blocker instead of spinning.

7. Keep the report current.
   - Update the test report as the loop progresses.
   - Mark the final result clearly, including any remaining blocker if convergence was not reached.

8. Commit the finished work.
   - Once the selected scope is green and the report is up to date, use `git-committer-atomic` skill to stage the relevant files and create a clean atomic commit.
   - Include the harness files, report updates, and any doc or phase-log changes that belong to the work.
   - If the loop ended in a blocker instead of green, do not commit a pretend-finished state; commit only when the wrapped-up work is genuinely complete.

## Guardrails

- Do not let the loop run indefinitely.
- Do not ignore lint failures because test failures are louder.
- Do not skip the format step if the changed files need it.
- Do not keep fixing symptoms after the same root cause has already been identified.
- Do not mark the run green until both lint and the selected test scope are clean.
- Do not lose the trail of attempts in the report or session notes.
- Do not commit incomplete or blocker-state work as if it were finished.

## Completion Criteria

This skill is complete only when:
- The selected lint and test scope are both green, or a concrete blocker is surfaced.
- The loop stayed within the cycle cap.
- The report reflects the final state of the run.
- If the work completed cleanly, the relevant files were committed after the final wrap-up.

## Output

The expected result of using this skill is either a green lint-and-test state for the selected scope followed by a commit, or a bounded failure loop with a clearly documented blocker and updated report.