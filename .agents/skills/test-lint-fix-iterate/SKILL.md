---
name: test-lint-fix-iterate
description: Orchestrator-led loop that runs verification (lints and tests) using the tester subagent, and delegates fixes to small-implementations or refactor agents, iterating until the scoped modules are clean or capped at 5 cycles.
---
# Test Lint Fix Iterate Skill

You are acting as the Orchestrator. Your job is to orchestrate a controlled loop of: modular linting -> formatting -> modular testing -> repairing code -> verification. You think, plan, and delegate — never writing or editing code, and never running the verification commands directly. You delegate verification to the `tester` agent, and delegate fixes to either `small-implementations` or `refactor` agents.

## Step 1: Define Subagents

Before planning or delegating, you must ensure the specialized subagents are defined for this conversation.

1. Use the `view_file` tool to read the subagent definitions located in your workspace under `.agents/agents/`:
   - `.agents/agents/code-explorer.md`
   - `.agents/agents/file-reader.md`
   - `.agents/agents/tester.md`
   - `.agents/agents/small-implementations.md`
   - `.agents/agents/refactor.md`

2. Use the `define_subagent` tool to register each of these subagents. For each subagent:
   - **name**: Use the name from the file (e.g., `code-explorer`, `file-reader`, `tester`).
   - **description**: Summarize their purpose based on their file's frontmatter description.
   - **system_prompt**: Provide the entire content of the corresponding `.md` file as their system prompt.
   - **enable_write_tools**: Set to `true` for `tester`, `small-implementations`, and `refactor`. Set to `false` for `code-explorer` and `file-reader`.

## Step 2: Determine Target Scope & Gather Context

1. Identify which core module, component, or file range has changed or needs repair.
2. Determine the exact path(s) to pass to `tester` for linting.
3. Identify the specific unit/integration test files to target for testing.
4. **Never run system-wide checks** (e.g., `npm test` or `npx eslint src/` on the entire repo) unless explicitly told, to save tokens.
5. **Gather Context**: If you need to read specific files or gather context about the codebase before testing or fixing:
   - Use **file-reader** to read specific file contents.
   - If you need a broader overview, check if a relevant code-exploration summary (generated using the `docs/templates/code-exploration-summary-template.md` template) already exists under `.agents/code-exploration/`. Use **file-reader** to read it first to see if it covers the required scope and contains the necessary details.
   - Spawn the **code-explorer** subagent only if no relevant summary exists or if the existing summary is insufficient, in order to save tokens.

## Step 3: Run the Iterate Loop

For up to a maximum of 5 cycles:

1. **Lint Verification**:
   - Spawn the `tester` subagent to run ESLint on the scoped directory or file.
   - Example instruction to `tester`: `Run lint on src/lib/db/sqlite/`

2. **Formatting & Auto-fix**:
   - If there are lint or formatting issues, delegate the auto-formatting to `small-implementations` or `refactor`.
   - Apply Prettier first, then ESLint `--fix`, then verify.

3. **Test Verification**:
   - Spawn the `tester` subagent to run Jest tests targeting the specific module.
   - Example instruction to `tester`: `Run tests for sqlite/company` or `npx jest src/lib/db/sqlite/company.unit.test.ts`.
   - If tests pass and lint is clean, verification is complete.

4. **Code Fixes**:
   - If there are test/lint failures, analyze the failure report from `tester`.
   - Use **file-reader** to read the files that failed to pinpoint the issues if the logs do not provide enough details.
   - Identify the smallest root cause.
   - Delegate the fix to:
     - `small-implementations`: for simple, single-file edits.
     - `refactor`: for complex, architectural, or multi-file changes.
   - Do not make the edits yourself.

5. **Cycle Cap**:
   - If the same failure repeats twice, or you reach 5 cycles, stop and report the blocker.

## Step 4: Generate Test Report

1. Create or update the test report under `docs/reports/test-reports/` using the template `docs/templates/test-report-template.md` (according to the `test` skill workflow).
2. Assign the next sequential `REP-TEST-NNN` identifier by looking at existing files in `docs/reports/test-reports/`.
3. Fill in run metadata, summary, failed tests (if any were encountered during the cycles, including their root causes and resolutions), coverage summary, and notes.

## Step 5: Finalize and Commit

1. Once the scoped tests and lints are green and the test report is written, verify the final report is clean.
2. Invoke `git-committer-atomic` skill to stage files and create clean, atomic commits for the resolved fixes and the test report.

## Subagent Roster

## Guardrails

## 1. Scope the change

- Identify the touched files and module boundary from the current diff, existing summaries, or failure context.
- Prefer existing session summaries or handoff notes first.
- Use file-reader or code-explorer only if the touched slice is still unclear.
- Do not define subagents inside this skill.

## 2. Pick the smallest useful check

- Use narrow lint and test commands that match the touched file or module.
- Avoid system-wide checks unless a failure cannot be isolated.

## 3. Run the loop in one of two modes

### End of session

- Run changed-file or module-scoped lint, plus only the tests that directly cover the touched slice.
- Keep the failure context short and local.
- After one repair pass, stop if the same slice fails again.

### End of day

- Run the end-of-session checks first.
- Then widen to adjacent contract and security coverage for the same feature area.
- Generate a report only for this broader handoff run.

## Repair mode

- Pass the exact failing file, command, and log fragment.
- Prefer one-file fixes when possible.
- Rerun the same scoped check immediately after the fix.
- Stop after the same failure repeats twice.

## Guardrails

- No direct command execution in this skill.
- No broad context gathering unless it is needed to narrow the touched slice.
- No mandatory full test report or git-committer step in the default workflow.
