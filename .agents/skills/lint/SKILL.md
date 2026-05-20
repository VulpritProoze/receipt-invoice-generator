---
name: lint
user-invocable: true
description: 'Use when ESLint must verify a file, directory, or the full src tree. Run the correct lint scope, apply safe fixes, repair remaining violations in source, and finish with zero errors and zero warnings.'
---

# Lint

Use this skill to keep BillGen lint-clean. ESLint is treated as a correctness gate, not a style preference.

## When to Use

Use this skill:
- Automatically through the `pre-read` hook before opening any `.ts` or `.tsx` file.
- Automatically as the initial and final ESLint bookends in `/run-tests`.
- Automatically through the post-edit hook after file writes, when `eslint --fix` is appropriate.
- Manually when checking a file, module, or the entire `src/` tree.

Do not use this skill to change `.eslintrc.json` unless an ADR exists for that configuration change.

## Scope Selection

Choose the narrowest scope that matches the trigger:
- Pre-read hook for a specific file: `eslint [filepath]`
- `/run-tests` initial or final bookend: `eslint src/`
- Manual module check: `eslint src/modules/[name]/`
- Phase completion check: `eslint src/`
- Post-edit hook: `eslint [edited-filepath] --fix`

## Workflow

1. Confirm the lint environment.
   - Verify the needed ESLint packages are installed.
   - Confirm the config has the expected parser, plugin, and `eslint-config-prettier` ordering.
   - If the config is wrong, surface the issue instead of silently editing it.

2. Run ESLint for the chosen scope.
   - Use `npx eslint [scope] --max-warnings 0 --format stylish`.
   - Do not use `--quiet` or any relaxed warning threshold for checks that gate completion.

3. Categorize the result.
   - Zero errors and zero warnings: lint is clean.
   - Auto-fixable problems: fix them with ESLint `--fix`.
   - Non-auto-fixable problems: repair the source code, not the rule.

4. Apply safe auto-fixes.
   - Run `npx eslint [scope] --fix` when appropriate.
   - Re-run the same scope without `--fix` afterward to confirm the remaining issues, if any, are real source problems.

5. Fix remaining violations in source.
   - Read each reported rule and understand why it fired.
   - Remove unused code, fix hook dependencies, repair strict type issues, or correct Jest misuse.
   - Re-run ESLint on the touched file or scope after each fix.

6. Use targeted suppressions only as a last resort.
   - If a fix would require a larger refactor that is out of scope, add a targeted `eslint-disable-next-line` with a concrete justification.
   - Add an open item to `AGENTS.md` with the file, line, rule, and resolution plan.
   - Do not use file-wide suppression.

7. Finish with a clean verification run.
   - Re-run `npx eslint [scope] --max-warnings 0`.
   - The output must be empty: zero errors and zero warnings.

## Configuration Expectations

The repository should have these dev dependencies available:
- `eslint`
- `@typescript-eslint/parser`
- `@typescript-eslint/eslint-plugin`
- `eslint-plugin-react-hooks`
- `eslint-plugin-jest`
- `eslint-config-prettier`

The ESLint configuration should include:
- `parser: "@typescript-eslint/parser"`
- `parserOptions.project` pointing at `./tsconfig.json`
- `eslint-config-prettier` as the last `extends` entry
- Jest-specific overrides for `*.test.ts` and `*.test.tsx`
- Ignore patterns for `node_modules/`, `.next/`, and declaration files

## Common Fix Patterns

- Remove unused imports and variables.
- Add missing hook dependencies or restructure the hook.
- Replace `any` with `unknown` and narrow it.
- Fix strict TypeScript violations at the source.
- Remove `.only()` and `.skip()` from test files.
- Add real assertions to tests that currently have none.

## Completion Criteria

This skill is complete only when all of the following are true:
- The chosen ESLint scope has been evaluated.
- The scope returns zero errors and zero warnings.
- Any auto-fixes have been applied and re-verified.
- Any remaining issues have been fixed in source or explicitly suppressed with a targeted justification.
- Any suppressions or unresolved lint work are documented in `AGENTS.md`.

## Do Nots

- Do not treat lint output as style-only feedback.
- Do not use `--quiet` or relaxed warning thresholds to make the check pass.
- Do not change `.eslintrc.json` without an ADR.
- Do not use blanket `/* eslint-disable */` file-level suppression.
- Do not use `@ts-ignore` as a lint suppression.
- Do not leave unresolved lint errors in committed files.

## Output

The expected result of using this skill is a lint-clean file, module, or `src/` tree with zero ESLint errors and zero ESLint warnings.