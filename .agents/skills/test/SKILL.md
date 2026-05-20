---
name: test
user-invocable: true
description: 'Use when running BillGen tests and producing a complete test report. Run the lint bookends, execute the relevant Jest scope, and write a report under docs/reports/test-reports/ using the project template.'
---

# Test

Use this skill to run BillGen's test suite in a predictable way and produce a report that the next agent can trust.

## When to Use

Use this skill when you want to:
- Run the full suite.
- Run a focused subset of tests.
- Generate or update a test report after a test run.
- Confirm the repository is still lint-clean around the test pass.

## Workflow

1. Determine the test scope.
   - Default to the full suite unless the user explicitly asks for a narrower scope.
   - Use the smallest relevant Jest target when you are verifying a specific module, test file, or regression.

2. Run the initial lint bookend.
   - Execute `npx eslint src/ --max-warnings 0` before the tests.
   - If lint fails, resolve that first or hand off to the lint workflow.

3. Run the tests.
   - Use the repo's test runner: `npm test`.
   - Include coverage data when possible so the report can include coverage metrics.
   - If a narrower Jest scope is needed, use the smallest command that still proves the behavior under test.

4. Capture the outcome.
   - Record passing and failing test counts, the names of failures, and the main error messages.
   - Preserve the actual failure text rather than paraphrasing it away.

5. Run the final lint bookend.
   - Execute `npx eslint src/ --max-warnings 0` again after the tests.
   - Treat any new lint issue as a real regression introduced during the test pass or its setup.

6. Write the test report.
   - Create or update a report in `docs/reports/test-reports/`.
   - Use `docs/templates/test-report-template.md` as the structure source.
   - Assign the next `REP-TEST-NNN` identifier.
   - Fill in run metadata, summary, failed tests, coverage summary, and notes.

## Report Rules

- The report should reflect the actual run, not the intended outcome.
- Leave no placeholder text behind in the finished report.
- If a section cannot be completed, mark it `[Pending: reason]` and surface the gap.
- If no tests failed, leave the failed-tests section empty rather than inventing entries.

## Guardrails

- Do not skip the lint bookends.
- Do not use a different report structure than the project template.
- Do not hide test failures by narrowing the scope so much that the bug is no longer exercised.
- Do not alter expectations just to make a failing test green unless the behavior change is intentional and documented.
- Do not ignore fixture or mock drift; fix the fixture or mock when it is the cause.

## Completion Criteria

This skill is complete only when:
- The selected test scope has run.
- The initial and final lint bookends both passed.
- A test report exists in `docs/reports/test-reports/` and matches the project template.
- The report includes the real run metadata and outcome.

## Output

The expected result of using this skill is a successful test run, or a clearly documented failing run, plus a complete test report under `docs/reports/test-reports/`.