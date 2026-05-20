# Database Choice

---

doc_id: DEC-002
title: Database Choice
version: 1.0.0
status: accepted
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: decision, database, redis
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial proposal

---

## Context

BillGen needs a simple serverless-friendly store for user records, imported billing rows, invoices, receipts, and onboarding configuration.

## Decision

Use Upstash Redis as the primary database layer.

## Alternatives Considered

| Option        | Pros                                              | Cons                                                   | Reason Rejected                             |
| ------------- | ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| Postgres      | Strong relational modeling                        | Requires heavier setup and more infrastructure         | Overkill for the initial billing workflow   |
| SQLite        | Simple local storage                              | Weak fit for serverless deployment and multi-user sync | Not ideal for Vercel-first deployment       |
| Firestore     | Managed document store                            | Adds a different data model and query style            | Less aligned with Redis-style keyed records |
| Upstash Redis | Serverless HTTP access, simple key/value patterns | Less relational structure                              | Best fit for the current scope              |

## Consequences

### Positive

- Easy serverless deployment.
- Straightforward mocked test strategy.
- Low operational overhead for the bootstrap phase.

### Negative

- Relational behavior must be modeled deliberately in application code.

### Risks

- Data modeling must remain disciplined to avoid key sprawl.

## References

- Upstash Redis docs and active GitHub repository.
