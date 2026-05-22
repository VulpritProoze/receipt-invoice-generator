# Environment Setup

---

doc_id: GS-002
title: Environment Setup
version: 1.1.0
status: draft
created: 2026-05-20
updated: 2026-05-22
author: Antigravity
reviewers: none
tags: getting-started, environment
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial
- version: 1.1.0
  date: 2026-05-22
  author: Antigravity
  note: Added USE_REDIS, NextAuth, and admin credentials variables.

---

## Required Variables

### Database Configuration

| Variable                   | Description                                                      | Required |
| -------------------------- | ---------------------------------------------------------------- | -------- |
| `USE_REDIS`                | Set to `true` to use Redis. If `false` or unset, SQLite is used. | No       |
| `UPSTASH_REDIS_REST_URL`   | Redis REST endpoint from Upstash (Required if `USE_REDIS=true`). | Cond     |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token from Upstash (Required if `USE_REDIS=true`).    | Cond     |
| `DATABASE_URL`             | Optional path or URL to SQLite database file.                    | No       |

### Authentication & Admin Credentials

| Variable         | Description                                                            | Required |
| ---------------- | ---------------------------------------------------------------------- | -------- |
| `NEXTAUTH_SECRET` | Secret used to sign NextAuth JWTs (Required in production).            | Yes (PRD)|
| `NEXTAUTH_URL`    | Canonical URL of the website, e.g. `https://billgen.vercel.app`.       | Yes (PRD)|
| `ADMIN_EMAIL`     | Administrator email for initial dashboard login.                      | Yes      |
| `ADMIN_PASSWORD`  | Password for the administrator account.                                | Yes      |

## Notes

- Store credentials in `.env.local` only.
- Do not commit secrets.
- The app should fail fast if the Redis variables are missing.

## Verification

Start the app after setting the variables and confirm the Redis client initializes without throwing.
