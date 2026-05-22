# ADR-013: Use NextAuth.js for Authentication

---

doc_id: DEC-013
title: Use NextAuth.js for Authentication
version: 1.0.0
status: accepted
created: 2026-05-22
updated: 2026-05-22
author: Docs Agent
reviewers:
tags: decision, authentication, security
changelog:
  - version: 1.0.0
    date: 2026-05-22
    author: Docs Agent
    note: Initial decision

---

## Context

We are implementing Phase 15 (Real Authentication) and need to protect the local tool with a simple login screen. As a single-tenant local tool, the authentication mechanism needs to be straightforward to set up, not rely on external cloud dependencies for basic access, and use standard patterns rather than bespoke security implementations.

## Decision

We will use `next-auth` (NextAuth.js) with the `CredentialsProvider` backed by environment variables (`ADMIN_USERNAME` and `ADMIN_PASSWORD`).

## Alternatives Considered

| Option | Pros | Cons | Reason Rejected |
| ------ | ---- | ---- | --------------- |
| Custom JWT implementation | Zero external dependencies; complete control over the token payload and flow. | High risk of security vulnerabilities; requires writing and maintaining boilerplate session management code. | Rejected due to security edge cases and reinventing the wheel. |
| NextAuth with OAuth | Highly secure; delegates credential management to third-party identity providers. | Requires internet access; involves complex setup with external developer app registration (e.g., Google, GitHub). | Rejected for over-complicating what is meant to be a simple local tool. |

## Consequences

### Positive

- Gives us a standardized, battle-tested session management layer.
- Easy to upgrade or add other identity providers later if the project's scope expands.
- Native integration with Next.js App Router and API routes.

### Negative

- Adds a new external dependency (`next-auth`) to the project.
- Requires `.env` configuration for the initial setup.

### Risks

- Hardcoding credentials via environment variables is only suitable for local or single-tenant deployments; this architecture will need to change if multi-tenancy or user roles are required later.

## References

- Phase 15: Real Authentication
