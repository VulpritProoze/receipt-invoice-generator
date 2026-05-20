---
name: format
user-invocable: true
description: 'Use when Prettier and ESLint --fix should format a file or batch of files. Apply Prettier first, then ESLint --fix, verify the result, and surface parse or config failures immediately.'
---

# Format

Use this skill to keep files consistently formatted across BillGen. Prettier owns style; ESLint `--fix` cleans up auto-fixable lint issues after formatting.

## When to Use

Use this skill:

- Automatically through the `post-edit` hook after any in-scope file is written or modified.
- Manually for batch formatting, a focused file check, or a pre-phase formatting sweep.

Do not use this skill for files outside the formatting scope or for `package-lock.json`.

## Configuration Requirements

Before invoking, confirm:

- `prettier` is installed as a dev dependency.
- `.prettierrc` exists at the project root with the expected settings.
- `eslint-config-prettier` is installed and is the last entry in ESLint `extends`.

If `.prettierrc` is missing or differs, do not modify it without an ADR. Record the discrepancy in `AGENTS.md` instead.

## Formatting Scope

Prettier runs on:

- `src/**/*.ts`
- `src/**/*.tsx`
- `**/*.json` except `package-lock.json`
- `docs/**/*.md`
- `src/**/*.css`
- `.agents/**/*.md`
- `.github/hooks/**`
- Root config files such as `.eslintrc.json`, `.prettierrc`, `jest.config.ts`, `next.config.ts`, and `tsconfig.json`

Prettier does not run on:

- `node_modules/`, `.next/`
- Generated PDFs and exported CSVs
- `.env`, `.env.local`, `.env.example`
- `package-lock.json`
- Binary files

If Prettier is touching a file it should not, fix `.prettierignore` rather than skipping the format step.

## Workflow

1. Identify the target.
   - For a post-edit hook, the target is the file just written or modified.
   - For a manual run, choose the specific file, directory, or broader project scope as needed.

2. Run Prettier.
   - Use `npx prettier --write [target]`.
   - Accept the output unconditionally.

3. Handle Prettier failures.
   - Parse error: fix the source syntax, then run Prettier again.
   - Config error: verify `.prettierrc` exists and is valid JSON.
   - Ignore issue: add the correct pattern to `.prettierignore`.

4. Run ESLint `--fix` on the same target.
   - Use `npx eslint [target] --fix`.
   - If ESLint reports non-auto-fixable issues, hand them off to the `lint` skill's manual repair flow.

5. Verify the result.
   - Use `npx prettier --check [target]`.
   - The check must exit cleanly with no differences.

## Special Cases

### Markdown in `docs/`

Prettier may reflow text, normalize lists, and adjust table alignment. Accept those changes.

### JSON Config Files

Prettier formats JSON and project config files consistently. Accept the output.

### `// prettier-ignore`

Use only when a structural necessity exists, such as an aligned table or a complex literal whose layout matters. Include a specific written justification on the comment line.

Do not use `prettier-ignore` for style disagreements. If a formatting rule should change, raise an ADR for the config change instead.

## Completion Criteria

This skill is complete only when all of the following are true:

- Prettier has been applied to the target.
- ESLint `--fix` has been run on the same target.
- `npx prettier --check [target]` exits cleanly.
- Any parse, config, or ignore issues were resolved or surfaced clearly.

## Do Nots

- Do not revert Prettier output because of a style preference.
- Do not skip formatting for small edits.
- Do not use `prettier-ignore` for disagreements.
- Do not format `package-lock.json`.
- Do not format `.env*` files.
- Do not change `.prettierrc` without an ADR.
- Do not install `eslint-plugin-prettier`.
- Do not save a file that Prettier cannot parse.
- Do not run `prettier --write .` routinely.

## Output

The expected result of using this skill is a correctly formatted file or batch with Prettier applied, ESLint auto-fixes applied, and a clean verification check.
