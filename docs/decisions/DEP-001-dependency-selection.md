# Dependency Selection

---

doc_id: DEC-001
title: Dependency Selection
version: 1.0.0
status: accepted
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: decision, dependencies, nextjs
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial proposal

---

## Context

BillGen needs a current, actively maintained stack for App Router, server-side PDF generation, Redis persistence, file parsing, and validation. The bootstrap explicitly rejects deprecated or stale packages.

## Decision

Use Next.js 16.2.6 with React 19.2.6, Upstash Redis 1.38.0, Tailwind CSS 4.3.0, Zod 4.4.3, @react-pdf/renderer 4.5.1, xlsx 0.18.5, papaparse 5.5.3, date-fns 4.2.1, Jest 30.4.x, @swc/jest 0.2.39, Testing Library 16.3.x / 6.9.x, ESLint 10.4.0, and Prettier 3.8.3.

## Research Findings

| Package                   | Latest version | Deprecation | Notes                                               |
| ------------------------- | -------------- | ----------- | --------------------------------------------------- |
| next                      | 16.2.6         | none        | Active releases and current repo activity           |
| react / react-dom         | 19.2.6         | none        | Matches current Next.js major line                  |
| @upstash/redis            | 1.38.0         | none        | GA-stage client with active releases                |
| tailwindcss               | 4.3.0          | none        | Current utility-first CSS solution                  |
| @tailwindcss/postcss      | 4.3.0          | none        | Required bridge for Tailwind 4 + PostCSS            |
| zod                       | 4.4.3          | none        | Active maintenance and current docs                 |
| @react-pdf/renderer       | 4.5.1          | none        | Active server-side PDF rendering option             |
| xlsx                      | 0.18.5         | none        | Broadly used parser for CSV/XLSX import             |
| papaparse                 | 5.5.3          | none        | Stable CSV parser fallback/utility                  |
| date-fns                  | 4.2.1          | none        | Active date utility for formatting and parsing      |
| jest                      | 30.4.2         | none        | Current stable test runner                          |
| jest-environment-jsdom    | 30.4.1         | none        | DOM environment for component tests                 |
| @testing-library/react    | 16.3.2         | none        | Active React component testing library              |
| @testing-library/jest-dom | 6.9.1          | none        | Assertion helpers for DOM tests                     |
| @swc/jest                 | 0.2.39         | none        | TypeScript transform aligned with Next.js toolchain |
| eslint                    | 10.4.0         | none        | Latest stable lint engine                           |
| eslint-config-next        | 16.2.6         | none        | Framework lint preset                               |
| eslint-plugin-jest        | 29.15.2        | none        | Jest-specific lint rules                            |
| prettier                  | 3.8.3          | none        | Formatting authority                                |

## Consequences

### Positive

- The scaffold uses modern, maintained packages with a consistent major-version story.
- Redis, validation, and PDF generation choices fit Next.js server-side workflows.

### Negative

- Some package majors are newer than typical tutorials and require explicit configuration.

### Risks

- PDF template fidelity still depends on the uploaded reference images.

## References

- npm registry metadata captured during bootstrap.
- GitHub repository activity for the selected packages.
