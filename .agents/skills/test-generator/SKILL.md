---
name: test-generator
user-invocable: true
description: 'Use when the user wants tests created for specific modules or for recent features and fixes. Always ask for scope first if it is missing, then generate the smallest relevant test set according to the repo testing strategy. Prefer full per-module coverage across all applicable test families when possible, and never expand to all modules unless explicitly requested.'
---

# Test Generator

Test Generator helps you create focused tests for BillGen by forcing an explicit scope decision before any test code is written. It supports two modes: tests for named modules, or tests inferred from recent features and fixes in workspace, session, or memory context.

This skill follows the repository's documented testing infrastructure in [docs/architecture/testing-strategy.md](../../../docs/architecture/testing-strategy.md): unit, schema, contract, fixture, integration, snapshot, and security tests. When a module can realistically support multiple required families, prefer covering all applicable families for that module rather than only one narrow test type.

## When to Use

Use this skill when the user wants to:

- Create tests for one or more named modules.
- Generate tests based on recent features or bug fixes already implemented.
- Add the smallest relevant test set for a change.
- Avoid broad repository-wide test generation.

Do not use this skill when the user explicitly wants a full suite-wide expansion across every module. Do not generate tests for all modules by default.

## Workflow

1. Determine the scope before writing tests.
   - If the user names one or more modules, use only those modules.
   - If the user says to use recent features or fixes, inspect session context, memory, and nearby workspace changes to identify the relevant modules.
   - If the scope is missing or ambiguous, ask a focused question that offers these choices:
     - named modules
     - recent features/fixes
   - Never assume the scope is "all modules." Ask or confirm first.

2. Narrow the test target.
   - Prefer the smallest module or helper surface that proves the requested behavior.
   - Use recent implementation evidence to avoid guessing which files need tests.
   - If multiple modules are involved, include only the ones directly affected by the change.
   - For a selected module, map it against the repo testing strategy and include every applicable required test family if possible.
   - If a family does not apply to the module, state why it is out of scope instead of silently omitting it.

3. Choose the right test type.
   - Use unit tests for isolated logic.
   - Use schema tests for Zod-backed models and validation contracts.
   - Use fixture tests for CSV/XLSX or other static sample inputs.
   - Use contract tests for route handlers or request/response shapes.
   - Use integration tests when behavior crosses module boundaries or depends on wiring.
   - Use snapshot tests for user-facing React components when rendering stability matters.
   - Use security tests for sensitive data handling, trust boundaries, validation, or file input.
   - Use the least expensive test type that still verifies the requested behavior, but expand to the full applicable family set for the selected module when the docs require it.

4. Write tests that prove behavior, not implementation trivia.
   - Cover the requested success path and the relevant failure path when both matter.
   - Keep assertions specific to observable behavior.
   - Reuse existing helpers, fixtures, and conventions from the repository.
   - Do not add broad coverage just to make the suite look larger.
   - If a selected module can support all required families from the testing strategy, generate that full module test set instead of stopping at a single happy-path test.

5. Respect recent-work inference.
   - If the user asks for tests based on recent features or fixes, inspect the available session and memory context before deciding scope.
   - Use workspace evidence to confirm the affected modules when possible.
   - If recent context is insufficient, ask one targeted clarification instead of guessing.

6. Validate the result.
   - Run the narrowest relevant test scope that proves the new test file or change.
   - If the repository requires it, run the local lint or format checks needed for the touched files.
   - Fix any broken test expectations, imports, or fixtures before finishing.
   - If you generated a complete module test set, validate the module's full test matrix rather than only one file.

## Guardrails

- Never generate tests for every module unless the user explicitly says to do that.
- Never widen the scope because it is easier than clarifying the request.
- Never guess which modules should be tested when recent work is unclear.
- Never create placeholder tests that do not verify a real behavior.
- Never stop at a single test family when the selected module can and should be covered by additional required families from the test strategy.
- Never skip security-sensitive edge cases when the change touches sensitive data or boundaries.
- Never mark tests as focused or skipped to force a green result.

## Completion Criteria

This skill is complete only when:

- The test scope is explicit or confirmed.
- The generated tests cover only the requested modules or recent-work targets.
- The generated tests cover all applicable required test families for each selected module when possible, or clearly note why a family does not apply.
- The tests verify real behavior with a clear success or failure signal.
- The final output makes it obvious why the chosen scope was selected.

## Output

The expected result of using this skill is a focused test plan or a set of test files that target only the requested modules or the modules implied by recent features and fixes.
