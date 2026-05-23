---
name: test-lint-fix
user-invocable: true
description: 'Runs modular verification (lints and tests) using the tester subagent, delegates fixes to small-implementations or refactor agents, and creates a test report under docs/reports/test-reports/ according to the test skill (without looping).'
---

# Test Lint Fix Skill

You are acting as the Orchestrator. Your job is to orchestrate a single-pass verification and repair workflow: modular linting -> formatting -> modular testing -> repairing code -> final verification -> test report generation. You think, plan, and delegate — never writing or editing code, and never running the verification commands directly. You delegate verification to the `tester` agent, and delegate fixes to either `small-implementations` or `refactor` agents.

Unlike the `test-lint-fix-iterate` skill, this skill does not loop repeatedly. It runs the verification pass once, attempts a single round of repairs for any failures, runs verification again to verify the fix, and then generates a test report.

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
3. Identify the specific unit test files to target for testing.
4. **Never run system-wide checks** (e.g., `npm test` or `npx eslint src/` on the entire repo) unless explicitly told, to save tokens.
5. **Gather Context**: If you need to read specific files or gather context about the codebase before testing or fixing:
   - Use **file-reader** to read specific file contents.
   - If you need a broader overview, check if a relevant code-exploration summary (generated using the `docs/templates/code-exploration-summary-template.md` template) already exists under `.agents/code-exploration/`. Use **file-reader** to read it first to see if it covers the required scope and contains the necessary details.
   - Spawn the **code-explorer** subagent only if no relevant summary exists or if the existing summary is insufficient, in order to save tokens.

## Step 3: Run Verification and Repair
1. **Lint Verification**:
   - Spawn the `tester` subagent to run ESLint on the scoped directory or file.
   - Example instruction to `tester`: `Run lint on src/lib/db/sqlite/`

2. **Formatting & Auto-fix**:
   - If there are lint or formatting issues, delegate the auto-formatting to `small-implementations` or `refactor`.
   - Apply Prettier first, then ESLint `--fix`, then verify.

3. **Test Verification**:
   - Spawn the `tester` subagent to run Jest tests targeting the specific module.
   - Example instruction to `tester`: `Run tests for sqlite/company` or `npx jest src/lib/db/sqlite/company.unit.test.ts`.

4. **Code Fixes (Single Pass)**:
   - If there are test or lint failures, analyze the failure report from `tester`.
   - Use **file-reader** to read the files that failed to pinpoint the issues if the logs do not provide enough details.
   - Identify the smallest root cause.
   - Delegate the fix to:
     - `small-implementations`: for simple, single-file edits.
     - `refactor`: for complex, architectural, or multi-file changes.
     - Do not make the edits yourself.

5. **Verify Fix**:
   - Once the fix is applied, spawn the `tester` subagent one last time to run the scoped tests and lints to check if the fixes resolved the issues.

## Step 4: Generate Test Report
1. Create or update the test report under `docs/reports/test-reports/` using the template `docs/templates/test-report-template.md` (according to the `test` skill workflow).
2. Assign the next sequential `REP-TEST-NNN` identifier by looking at existing files in `docs/reports/test-reports/`.
3. Fill in run metadata, summary, failed tests (if any were encountered, including their root causes and resolutions), coverage summary, and notes.

## Step 5: Finalize and Commit
1. Verify the generated test report is complete and matches the project template.
2. Invoke `git-committer-atomic` skill to stage files and create clean, atomic commits for the resolved fixes and the test report.

## Subagent Roster
- **code-explorer**: Explores codebase structure; returns high-level summaries of modules, directories, and entry points. Check `.agents/code-exploration/` for existing summaries first.
- **file-reader**: Reads specific files and returns summarized content. Use when you know which files are relevant but need their contents digested.
- **tester**: Executes modular, scoped tests or lints on specific parts of the program without running system-wide checks. Do not delegate code edits to this agent.
- **small-implementations**: Applies targeted file edits specified by the plan. Single-file, minimal-footprint changes only.
- **refactor**: Applies large-scale, complex code changes across multiple files.

## Guardrails
- **Never write or edit code.** You are a planner and coordinator only.
- **Never run commands directly.** Verification commands must run via the `tester` subagent.
- **No system-wide checks.** Keep all commands scoped to the changed or target files/folders.
- **Provide narrow context.** Pass only the relevant failing test logs and files to the repairing subagent.
