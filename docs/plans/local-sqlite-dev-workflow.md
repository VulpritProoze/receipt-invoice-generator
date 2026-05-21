# Plan: Local SQLite Dev Workflow

---

doc_id: PLAN-004
title: Local SQLite Development Workflow
version: 1.0.0
status: active
created: 2026-05-21
updated: 2026-05-21
author: Antigravity (Orchestrator)
reviewers: none
tags: plan, database, sqlite, local-dev, feat/local-db-refactor
changelog:

- version: 1.0.0
  date: 2026-05-21
  author: Antigravity (Orchestrator)
  note: Initial plan documenting the local SQLite development workflow on feat/local-db-refactor

---

## Objective

Introduce a fully self-contained local development mode using SQLite (via `better-sqlite3`) as a drop-in replacement for the Upstash Redis persistence layer. The production layer remains unchanged; this plan covers only the local development and test workflow introduced on the `feat/local-db-refactor` branch.

## Scope

### In Scope

- SQLite singleton and DDL initialisation (`src/lib/db.sqlite.ts`)
- SQLite-backed implementations of all `src/lib/db/*` modules
- Environment variable convention (`DATABASE_URL`) and `.env.local` setup
- Jest in-memory isolation via `DATABASE_URL=:memory:`
- Table schema and design decisions for all five domain tables
- Local developer quickstart commands

### Out of Scope

- Production deployment (Upstash Redis layer is unchanged on `main`)
- Database migrations for version upgrades (noted as a future concern)
- Connection pooling or PostgreSQL promotion
- Changes to Zod schemas, service modules, or API route handlers

## Motivation

The production persistence layer uses Upstash Redis (a cloud-hosted serverless service). This makes local development and testing dependent on either a live Upstash account or a mocked Redis shim. The `feat/local-db-refactor` branch introduces a fully self-contained local development mode using SQLite (via `better-sqlite3`) as a drop-in replacement for the Redis layer.

Goals:

- Zero cloud dependencies for local development
- Deterministic, file-based persistence (or in-memory for tests)
- Same public API surface in `src/lib/db/*` — services are unchanged
- Faster test runs (no network, no async I/O)

## Architecture

The SQLite layer consists of:

| File | Role |
| ---- | ---- |
| `src/lib/db.sqlite.ts` | Singleton `db` instance + `initializeDatabase()` DDL runner |
| `src/lib/db/users.ts` | User CRUD using SQLite prepared statements |
| `src/lib/db/company.ts` | CompanyConfig CRUD |
| `src/lib/db/invoices.ts` | Invoice + InvoiceItem CRUD; sequence via `invoice_sequences` table |
| `src/lib/db/receipts.ts` | Receipt CRUD; invoice uniqueness via UNIQUE index |

### Table Design

| Table | Key columns | Notes |
| ----- | ----------- | ----- |
| `users` | `user_id PK`, `user_email UNIQUE` | Email index is a UNIQUE column — no manual secondary index management |
| `company_configs` | `user_id PK` | One config per user |
| `invoice_sequences` | `user_id PK`, `next_value INT` | Replaces `redis.incr()` |
| `invoices` | `(invoice_id, user_id) PK` | `invoice_items` stored as JSON text (snapshot) |
| `invoice_items` | `(item_id, user_id) PK` | Standalone items for the import module |
| `receipts` | `(receipt_id, user_id) PK`, `UNIQUE(user_id, invoice_id)` | Replaces manual `receipt:invoice:*` Redis secondary index |

## Environment Variable

| Variable | Default | Notes |
| -------- | ------- | ----- |
| `DATABASE_URL` | `.dev/billgen.db` | Set to `:memory:` in Jest for in-memory isolation |

Add `.env.local` to configure for local development:

```
DATABASE_URL=.dev/billgen.db
```

The `.dev/` directory is gitignored.

## Running Locally

```bash
# Switch to worktree
cd ../receipt-invoice-generator-feat-local-db

# Install new dependency
npm install

# Start development server
npm run dev
```

On first run, `initializeDatabase()` is called automatically when `src/lib/db.sqlite.ts` is imported. The SQLite file is created at `.dev/billgen.db`.

## Running Tests

```bash
npm test
```

The `jest.config.ts` sets `DATABASE_URL=:memory:` in the test environment. The `jest.setup.ts` calls `initializeDatabase()` in `beforeEach` to ensure a clean schema for every test.

## What Did Not Change

- `src/models/*` — Zod schemas are unchanged
- `src/modules/**/*Service.ts` — services call the same `src/lib/db/*` function signatures
- `src/app/api/**` — API routes unchanged
- Service unit tests (`*.unit.test.ts` in `src/modules/`) — already mock `@/lib/db/*` at module level; no changes needed
- Contract tests (`*.contract.test.ts`) — mock the service layer; no changes needed

## Milestones

| Milestone | Target Date | Owner | Status |
| --------- | ----------- | ----- | ------ |
| SQLite singleton + DDL (`db.sqlite.ts`) | 2026-05-21 | Antigravity | Complete |
| SQLite-backed `src/lib/db/*` modules | 2026-05-21 | Antigravity | Complete |
| Jest in-memory isolation (`DATABASE_URL=:memory:`) | 2026-05-21 | Antigravity | Complete |
| Plan documentation | 2026-05-21 | Docs Agent | Complete |

## Dependencies

- `better-sqlite3` — synchronous SQLite driver for Node.js
- `@types/better-sqlite3` — TypeScript typings
- Node.js 18+ (required for Next.js 15)
- `jest.config.ts` test environment variable injection

## Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| SQLite behaviour diverges from Redis on edge cases | Low | Medium | Integration tests cover all CRUD paths with in-memory DB |
| JSON-stored `invoice_items` becomes hard to query | Low | Low | Acceptable for local-dev scope; normalise if promoting to production |
| `.dev/billgen.db` grows stale between test runs | Medium | Low | Jest wipes schema via `initializeDatabase()` in `beforeEach`; local file is developer-managed |

## Migration Notes (Future)

This branch is a local-dev alternative. If promoting to production:

- Add a migration runner to `initializeDatabase()` (e.g., `drizzle-orm/migrate` or a hand-rolled versioned migration table)
- Add connection pooling if moving to PostgreSQL
- Consider replacing JSON-stored `invoice_items` with a normalised join table for queryability

## Open Questions

- Should `initializeDatabase()` be moved behind a lazy singleton to avoid double-init on hot reload in Next.js dev mode?
- Is `better-sqlite3` the correct long-term choice if the app later needs async/concurrent writes, or should `libsql` (Turso) be evaluated?
