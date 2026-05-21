# DEC-008: Local SQLite Database for Development and Testing

---

doc_id: DEC-008
title: Local SQLite Database for Development and Testing
version: 1.0.0
status: accepted
created: 2026-05-21
updated: 2026-05-21
author: Antigravity (Orchestrator)
reviewers: none
tags: decision, database, sqlite, local-dev
changelog:

- version: 1.0.0
  date: 2026-05-21
  author: Antigravity (Orchestrator)
  note: Initial decision for local development database choice

---

## Context

The primary production database for BillGen is Upstash Redis. However, relying on a cloud-based database for local development and unit/integration testing introduces several drawbacks:
- It requires an internet connection and active Upstash credentials.
- It can lead to flaky, slow tests due to network latency and rate limits.
- Shared cloud environments can cause race conditions or data collisions between multiple developers or test runs.

Using a local Redis instance or a mocked Redis shim is possible but comes with configuration overhead or lack of true persistence fidelity for integration tests.

We need a lightweight, self-contained, and file-based database for local development and testing that does not modify the production Redis stack.

## Decision

Introduce a local development and testing database workflow utilizing **SQLite** (via `better-sqlite3`).

- SQLite is used only when `USE_LOCAL_DB` is set to `true` (e.g., in local development `.env.local` or automatically in the Jest test environment).
- All `src/lib/db/*` functions check `process.env.USE_LOCAL_DB === 'true'` and forward queries to synchronous SQLite implementation wrappers.
- The Jest configuration is updated to set `DATABASE_URL=:memory:` to run tests against an in-memory SQLite database, isolating tests and speeding up execution.
- The schema is initialized dynamically on startup/test setup via the `initializeDatabase()` runner defined in `src/lib/db.sqlite.ts`.

## Alternatives Considered

| Option | Pros | Cons | Reason Rejected |
| ------ | ---- | ---- | --------------- |
| **Local Redis (Docker/WSL)** | Parity with production API. | Requires Docker/WSL runtime, increasing setup complexity for local environments. | Harder to run lightweight tests in clean isolation. |
| **In-Memory Redis Mock** | Fast, zero dependencies. | Does not persist data locally, making interactive dev testing harder; mocking may miss real-world persistence edge-cases. | No file-based persistence for local dev mode. |
| **PostgreSQL** | Relational parity with future SQL target. | Requires a local Postgres server running, migration setup, and connection pools. | Overkill for a simple offline local-dev workflow. |

## Consequences

### Positive
- **Offline Capable**: Local development can run entirely offline with no Redis credentials required.
- **Fast and Isolated Tests**: Jest runs against an in-memory database (`:memory:`), providing full query execution validation with zero network delay and automatic teardown.
- **Deterministic state**: The database file is written to `.dev/billgen.db` (gitignored), allowing developers to inspect data locally using SQLite clients.

### Negative
- **Dual Implementations**: The database layer (`src/lib/db/*`) now maintains both Redis and SQLite implementations, increasing maintenance surface area.

### Risks
- **Divergence**: Behavior could diverge between SQLite and Upstash Redis. This risk is mitigated by maintaining clean, standard CRUD function signatures and verifying both flows with unit/integration tests.

## References

- [Plan: Local SQLite Dev Workflow](file:///D:/Ram%20Alin/src/Misc/receipt-invoice-generator-feat-local-db/docs/plans/local-sqlite-dev-workflow.md)
- [Environment Setup](file:///D:/Ram%20Alin/src/Misc/receipt-invoice-generator-feat-local-db/docs/getting-started/env-setup.md)
