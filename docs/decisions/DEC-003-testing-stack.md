# Testing Stack

---

doc_id: DEC-003
title: Testing Stack
version: 1.0.0
status: accepted
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: decision, testing, jest, zod
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial proposal

---

## Context

The project needs a test stack that works well with Next.js App Router, TypeScript, React component rendering, schema validation, and isolated server-side module testing.

## Decision

Use Jest 30 with `jest-environment-jsdom` for component tests, `@swc/jest` for TypeScript transformation, Testing Library for React assertions, `eslint-plugin-jest` for linting, and Zod schemas as the validation contract.

## Alternatives Considered

| Option             | Pros                                   | Cons                                                         | Reason Rejected                     |
| ------------------ | -------------------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| ts-jest            | Familiar for older TypeScript projects | Slower and less aligned with modern Next.js tooling          | SWC is a better fit here            |
| Vitest             | Fast and modern                        | Would split the stack from the Jest-oriented requirement set | Jest matches the requested workflow |
| No component tests | Simpler setup                          | Loses snapshot and DOM coverage                              | Not acceptable for a UI-heavy app   |

## Consequences

### Positive

- Fast TypeScript transforms via SWC.
- Clear separation between jsdom and node-based tests.
- Test reports can be standardized around a single runner.

### Negative

- Requires a little more config than a pure runtime test stack.

### Risks

- Snapshot tests can drift if component structure changes without review.

## References

- Jest and Testing Library package metadata.
- Zod 4 runtime schema documentation.
