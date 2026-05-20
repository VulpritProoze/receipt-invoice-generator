# Deployment Guide

---
doc_id: GS-003
title: Deployment Guide
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: getting-started, deployment, vercel
changelog:
  - version: 1.0.0
    date: 2026-05-20
    author: Copilot
    note: Initial
---

## Prerequisites
- Node.js 24.x or newer.
- Vercel CLI installed.
- An Upstash account with a Redis database.

## Upstash Redis Setup
1. Create a Redis database in Upstash.
2. Copy `UPSTASH_REDIS_REST_URL`.
3. Copy `UPSTASH_REDIS_REST_TOKEN`.

## Vercel Project Setup
1. Connect the GitHub repository to Vercel.
2. Add the Redis environment variables in the Vercel dashboard.
3. Confirm the framework preset is detected as Next.js.

## Deploy
```bash
vercel --prod
```
Pushing to `main` is also sufficient because Vercel will auto-deploy from the branch.

## Post-deploy Verification
1. Visit `/onboarding`.
2. Complete company branding setup.
3. Create a test user.
4. Import a sample CSV.
5. Generate an invoice and receipt.

## Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Redis auth error | Token mismatch | Re-copy the Vercel env vars |
| PDF rendering fails in production | Runtime incompatibility or missing template data | Verify the server-side PDF path and template assets |
| App cannot reach Redis | Bad REST URL | Regenerate the Upstash connection string |