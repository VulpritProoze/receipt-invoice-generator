# Agent Rule Prompt: Testing Protocol
**File**: `.agents/rules/testing-protocol.md`
**Scope**: All agents. Applies whenever code is written, modified, or a phase is marked complete.
**Priority**: High. Tests are written alongside the code. There is no "testing phase." A phase without tests is a phase that is not complete.

---

## Role

You are an agent operating in the BillGen repository. You do not write code and then "add tests later." Tests are written in the same session as the code they cover, using the conventions in this rule. You run the full test suite after every phase. You produce a written test report every time you run the suite. You do not mark a phase complete while the suite is red.

This rule defines what tests exist, how they are named, in what order they run, what decisions are made inside them, and what you are never permitted to do.

---

## Rule 1: Tests Are Written With the Code — Not After

Every piece of logic written in this project gets a test in the same session it is written.

**Minimum test coverage per code unit:**
- Every pure utility function in `src/lib/`: at least one unit test for the happy path and one for an edge case or invalid input.
- Every Zod schema in `src/models/`: a schema test covering at least one fully valid object and one invalid permutation per required/constrained field.
- Every Next.js API route handler in `src/app/api/`: at least one contract test for the happy path and one for the primary error path.
- Every React component in `src/components/` and `src/modules/*/`: at least one snapshot test.
- Every module-level flow (invoice creation, receipt generation, CSV import, user creation): at least one small integration test with mocked Redis.
- Every security-sensitive operation (credit card masking, receipt-without-invoice guard, file type validation on import): at least one security test.

If a function exists in the codebase with no test covering it, that is a gap — not a future task. Fill it before the session ends.

---

## Rule 2: The Fixed Test Execution Order

The test suite always runs in this exact order. Do not reorder. Do not skip a step.

```
1.  TypeScript compilation      (pre-condition — not a Jest step)
2.  Linting check — initial     (ESLint, must be clean before any test runs)
3.  Unit tests
4.  Snapshot tests
5.  Schema tests
6.  Contract tests
7.  Fixture tests
8.  Integration tests
9.  Security / guardrails tests
10. Linting check — final       (ESLint, must still be clean after test setup)
```

**If Step 1 (TypeScript) fails:** stop. Fix all type errors first. TypeScript compilation failures are upstream of everything — Jest may not even be able to load the files.

**If Step 2 (initial lint) fails:** stop. Do not run Steps 3–10. Fix lint errors using the `lint` skill. Then restart from Step 1.

**If Steps 3–9 have failures:** record every failure and continue running the remaining steps unless a failure is a hard blocker (e.g., a missing module import that prevents the entire test runner from loading). The goal is to collect all failures in one pass so they can all be fixed in one `/test-fix-iterate` cycle.

**If Step 10 (final lint) fails:** test setup code introduced a lint regression. Fix it. A suite that passes Steps 3–9 but fails the final lint check is still a red suite.

---

## Rule 3: Test File Naming — The Convention Is Strict

Test files live next to the source file they test. The naming pattern is:

```
[source-filename].[test-type].test.ts(x)
```

| Test type | Suffix | Example |
|-----------|--------|---------|
| Unit | `.unit.test.ts` | `maskCreditCard.unit.test.ts` |
| Snapshot | `.snap.test.tsx` | `InvoiceForm.snap.test.tsx` |
| Schema | `.schema.test.ts` | `invoice.schema.test.ts` |
| Contract | `.contract.test.ts` | `invoicesRoute.contract.test.ts` |
| Fixture | `.fixture.test.ts` | `csvParser.fixture.test.ts` |
| Integration | `.integration.test.ts` | `invoiceCreation.integration.test.ts` |
| Security | `.security.test.ts` | `creditCardStorage.security.test.ts` |

**Why the convention is strict:** `/run-tests` uses `--testPathPattern` to run each type in isolation and in the correct order. A test file named outside this convention will not be picked up by the ordered run — it either runs at the wrong time or not at all.

---

## Rule 4: Zod Schemas Are the Runtime Contract

Every TypeScript interface in `src/models/` is derived from a Zod schema — not defined separately.

**The required pattern:**
```typescript
// src/models/invoice.ts
import { z } from 'zod';

export const invoiceSchema = z.object({
  invoiceID: z.string().regex(/^INV\d{9}$/, 'Must match INV + 9 digits'),
  invoiceDate: z.string().datetime(),
  terms: z.string().min(1),
  dueDate: z.string().datetime(),
  currency: z.enum(['PHP', 'USD']),
  billTo: z.string().min(1),
  taxRate: z.number().min(0).max(1),
  // ... all fields
});

export type Invoice = z.infer<typeof invoiceSchema>;
```

The TypeScript type is always `z.infer<typeof schema>`. It is never defined separately from the schema — if they diverge, the schema wins, and the type is regenerated from it.

**Schema test requirements:**
- One test passing a fully valid object through `safeParse` → expect `success: true`.
- At least one test per required or constrained field passing an invalid value → expect `success: false` with an error message that matches the constraint.
- Tests live in `[model-name].schema.test.ts` co-located with the model file.

---

## Rule 5: Mocking Rules — What Is Mocked and How

**Redis (Upstash):** Never call real Upstash in any test. Use a Jest manual mock in `src/lib/__mocks__/redis.ts` that implements an in-memory key-value store. The mock resets between test cases in `beforeEach`. Contract tests, fixture tests, integration tests, and security tests all use this mock.

**PDF generation:** Never render a real PDF in any test. Mock the PDF generation call to return a fixed `Buffer` or a resolved URL. PDF visual accuracy is verified manually against the uploaded template images — it is not an automated test concern.

**File system / uploads:** Use fixture files from `src/modules/import/__fixtures__/`. Fixture files are static and committed — never generate fixture data dynamically inside tests.

**Next.js Route Handlers:** Test them directly (call the handler function), not via a live HTTP server. Use `node` Jest environment for all route handler tests.

---

## Rule 6: Coverage Targets

| Area | Line coverage target | Branch coverage target |
|------|---------------------|------------------------|
| `src/lib/` | ≥ 90% | ≥ 80% |
| `src/modules/` | ≥ 80% | ≥ 70% |
| `src/models/` (Zod schemas) | 100% | 100% |
| `src/app/api/` (route handlers) | ≥ 80% | ≥ 70% |
| `src/components/` | Snapshot for every exported component | N/A |

Coverage is reported per test type in each test report. A phase is not complete if coverage is materially below target (more than 5 percentage points) for a module that has been fully implemented.

---

## Rule 7: Test Reports Are Mandatory and Machine-Generated

Every invocation of `/run-tests` produces a report at:
```
docs/reports/test-reports/[NNN]-[three-word-summary].md
```

Where `NNN` is the next available three-digit index (e.g., `001`, `042`) and the three-word summary describes this run's context or outcome (`phase-3-complete`, `schema-fix-passing`, `initial-suite-baseline`).

The report uses `docs/templates/test-report-template.md` and must be fully populated. A test run with no report is treated as if it did not happen and does not count toward phase completion.

**Reports are never written by hand.** They are always generated by the `/run-tests` skill from actual test output. A hand-written test report cannot be trusted to reflect actual results.

---

## What You Must Never Do

- **Never skip writing tests to save time.** A phase with untested code is not a complete phase.
- **Never use `.skip()` or `.only()` in committed test files.** ESLint rules `jest/no-disabled-tests` and `jest/no-focused-tests` are set to `error` and will catch both. A committed `.skip()` is a committed lie about test coverage.
- **Never mock the module you are testing.** Mock its dependencies, not itself. Mocking the thing under test makes the test worthless.
- **Never write tests with no assertions.** `expect(true).toBe(true)` is noise. Every test makes a meaningful assertion that can fail.
- **Never hit real external services from tests.** No real Redis, no real HTTP calls outside the process, no real file system writes except fixture reads.
- **Never run `--updateSnapshot` without human confirmation.** Show the diff, ask if it is intentional, then update only after explicit confirmation.
- **Never mark a phase complete while any test is failing.** One red test means the suite is red. Fix it, or document a specific resolution plan in `AGENTS.md` if it requires human input — then do not mark the phase complete until it is fixed.
- **Never generate a test report manually.** Reports come from actual test output, not from the agent's assessment of what probably passed.
- **Never use `--passWithNoTests` for any test type.** If a type has no files yet, that is noted in the report — it is not treated as a pass.
- **Never run integration tests without `--runInBand`.** Parallel integration tests share mock state and produce race conditions.