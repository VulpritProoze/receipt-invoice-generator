# Environment Setup

---

doc_id: GS-002
title: Environment Setup
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: getting-started, environment
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial

---

## Required Variables

| Variable                   | Description                      |
| -------------------------- | -------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Redis REST endpoint from Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token from Upstash    |

## Notes

- Store credentials in `.env.local` only.
- Do not commit secrets.
- The app should fail fast if the Redis variables are missing.

## Verification

Start the app after setting the variables and confirm the Redis client initializes without throwing.
