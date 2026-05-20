# Agent Rule Prompt: Linting and Formatting

**File**: `.agents/rules/linting-and-formatting.md`
**Scope**: All agents. Applies to every source file read, written, or modified — and to documentation Markdown files in `docs/`.
**Priority**: High. Code style is mechanically enforced. The agent does not have opinions about formatting. The tools do.

---

## Role

You are an agent operating in the BillGen repository. Two tools govern code style in this project: **ESLint** (logic and correctness) and **Prettier** (formatting). Your job is not to make formatting decisions — your job is to write correct logic and let the tools handle everything else. You do not argue with Prettier output. You do not suppress ESLint errors. You defer entirely to the tools' authority in their respective domains.

Read this rule fully before touching any source file.

---

## ESLint: The Logic Guard

ESLint enforces correctness rules — unused variables, unreachable code, missing React hook dependencies, unsafe TypeScript patterns, Jest antipatterns in test files. These are not style preferences. They are code quality signals that indicate real bugs, security issues, or maintenance problems.

**Your relationship with ESLint is non-negotiable:**

- ESLint output is always read, never ignored.
- Auto-fixable errors are applied with `--fix` and noted in the session trace.
- Non-auto-fixable errors are fixed in the source code before the file is considered usable or committable.
- `eslint-disable` comments are forbidden without an explicit human instruction and a specific, written justification explaining why the rule does not apply in this exact case.
- Blanket file-level `/* eslint-disable */` is always forbidden, under any circumstance.
- If a rule appears to fire incorrectly for this project (false positive specific to Next.js App Router patterns, for example), the correct response is to raise an ADR proposing a targeted rule change in `.eslintrc.json` — not to disable the rule inline and move on.

**ESLint configuration:**

- Lives in `.eslintrc.json` at the project root.
- Includes: `eslint:recommended`, `plugin:@typescript-eslint/strict`, `plugin:react-hooks/recommended`, `plugin:jest/recommended` (applied only to test files via `overrides`), `eslint-config-prettier` as the final entry in `extends`.
- Never modify `.eslintrc.json` without an ADR. ESLint config changes affect every file in the codebase and every subsequent agent. This is not a unilateral decision.

---

## Prettier: The Formatting Authority

Prettier enforces code style — indentation, quote style, trailing commas, line length, bracket spacing, semicolons, and everything else formatting-related. Prettier is always right. You do not have a counter-opinion.

**Your relationship with Prettier:**

- Prettier output is never reverted. What Prettier writes is correct by definition.
- You do not manually reformat code to a style Prettier would undo on the next pass.
- If Prettier's output looks surprising — a long ternary broken across seven lines, or a function call split in an unexpected place — that is correct behavior reflecting the configured `printWidth`. Do not fight it.
- If a Prettier rule genuinely creates a problem for the project (a legitimate structural issue, not a preference disagreement), raise an ADR proposing a `.prettierrc` change. Do not override inline.
- Prettier runs automatically via the `post-edit` hook after every file write. You do not need to invoke it manually in normal operation.

**Prettier configuration** (`.prettierrc` at project root):

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Never modify `.prettierrc` without an ADR.

---

## ESLint and Prettier Do Not Conflict — By Design

`eslint-config-prettier` is installed and is the last entry in the ESLint `extends` array. It disables all ESLint formatting rules that overlap with Prettier, ensuring the two tools do not produce conflicting output.

**Never install `eslint-plugin-prettier`** — it runs Prettier as an ESLint rule, doubling the tooling overhead and producing confusing error messages. `eslint-config-prettier` (which turns off conflicting rules) is the correct package. They are different. Use only `eslint-config-prettier`.

If you see a conflict between ESLint and Prettier output: confirm `eslint-config-prettier` is installed and is last in the `extends` array before doing anything else.

---

## Linting Scope

ESLint runs on:

- `src/**/*.ts`
- `src/**/*.tsx`

ESLint does not run on:

- `node_modules/`
- `.next/`
- `*.d.ts` type declaration files
- Generated files (PDFs, exported CSVs)
- `public/` directory

These exclusions belong in `.eslintignore` or the `ignorePatterns` field of `.eslintrc.json`. If ESLint is picking up files it should not, fix the ignore configuration — do not skip running ESLint.

**For test files specifically:** `eslint-plugin-jest` rules apply to `src/**/*.test.ts` and `src/**/*.test.tsx` via an `overrides` block in `.eslintrc.json`. Two rules are set to `error` — not `warn`:

- `jest/no-disabled-tests` — `.skip()` and `xtest()` calls cannot be committed.
- `jest/no-focused-tests` — `.only()` and `ftest()` calls cannot be committed.

These are errors, not warnings. A committed test file with `.skip()` or `.only()` will fail the linting bookend in `/run-tests`.

---

## Formatting Scope

Prettier runs on:

- `src/**/*.ts`, `src/**/*.tsx`
- `**/*.json` (excluding `package-lock.json`)
- `docs/**/*.md`
- `src/**/*.css`
- `.agents/**/*.md`
- `.github/hooks/**`
- Root config files: `.eslintrc.json`, `.prettierrc`, `jest.config.ts`, `next.config.ts`, `tsconfig.json`

Prettier does not run on:

- `node_modules/`, `.next/`
- Generated PDFs, exported CSVs
- `.env`, `.env.local`, `.env.example`
- `package-lock.json`
- Binary files

These go in `.prettierignore`. If Prettier is running on a file it should not touch, fix the ignore configuration.

---

## The Pre-Read Hook Behavior

Before you open any `.ts` or `.tsx` source file, the `pre-read` hook automatically runs ESLint on that file.

**What happens:**

1. ESLint runs with `--max-warnings 0`.
2. Zero errors, zero warnings → file opens normally.
3. Auto-fixable errors only → `eslint --fix` applies, you note the fix in the session trace, file opens.
4. Non-auto-fixable errors → you do **not** open the file. You surface every error by rule name, fix them in the source, re-run ESLint, then open the clean file.

**Why this matters:** An agent that reads a broken file may treat the broken state as canonical — propagating the errors into every subsequent edit. The pre-read hook prevents this contamination.

---

## The Post-Edit Hook Behavior

After you write or modify any in-scope file, the `post-edit` hook automatically:

1. Runs `prettier --write [file]` — Prettier rewrites in place.
2. Runs `eslint [file] --fix` — catches auto-fixable lint issues introduced by the edit.
3. If Prettier fails with a parse error (the file has a syntax error): you are notified immediately. The file is not saved in a broken state. The syntax error is a blocker — fix it before the file is used.

The post-edit hook runs even when the edit was itself a formatting correction. Idempotency is fine — running Prettier twice on a Prettier-formatted file produces the same output.

---

## `// prettier-ignore` — Rare, Justified, Documented

Using `// prettier-ignore` is permitted only when:

- There is a structural necessity (an ASCII table alignment, a complex template literal that must not be reflowed, a data array where column alignment has semantic meaning).
- An explicit human instruction was given.
- The comment includes a specific written justification.

Format:

```typescript
// prettier-ignore — [specific reason: e.g., column-aligned lookup table, must not be reflowed]
const lookup = [
  ['key-a', 'value-a', 100],
  ['key-bb', 'value-bb', 200]
];
```

You do not use `prettier-ignore` for style disagreements. If you disagree with Prettier's output on a structural level, raise an ADR to change `.prettierrc`.

---

## What You Must Never Do

- **Never commit a file with lint errors.** A phase is not complete if any file in scope has unresolved lint errors.
- **Never reformat code manually** in a way Prettier would undo. Write the logic; let Prettier do the aesthetics.
- **Never add `eslint-disable` at the file level** — ever.
- **Never add `eslint-disable-next-line` without a written justification comment** and explicit human instruction.
- **Never run `eslint --max-warnings [N > 0]`** during a phase completion check. The threshold is always zero.
- **Never install `eslint-plugin-prettier`.** Use `eslint-config-prettier` only.
- **Never change `.eslintrc.json` or `.prettierrc` without an ADR.**
- **Never skip the final linting check in `/run-tests`** because "the initial one was clean." Test setup files can introduce lint errors. Both bookends are mandatory.
- **Never save a file that Prettier cannot parse.** A parse error means the file has a syntax error. Fix the syntax; then let Prettier format it.
