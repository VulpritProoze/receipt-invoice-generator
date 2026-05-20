# Local Setup

---

doc_id: GS-001
title: Local Setup
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: getting-started, local-setup
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial

---

## Prerequisites

- Node.js 24.x or newer.
- Access to an Upstash Redis database for development.
- Git and a code editor.

## Steps

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Configure environment variables

Create `.env.local` and set the Redis variables documented in `env-setup.md`.

### Step 3: Start the app

```bash
npm run dev
```

## Verification

Open the local app, confirm the landing page loads, and ensure the app does not throw missing-env errors when Redis variables are present.

## Troubleshooting

| Symptom                        | Likely Cause               | Fix                   |
| ------------------------------ | -------------------------- | --------------------- |
| Redis client throws on startup | Missing env vars           | Populate `.env.local` |
| Build fails on TypeScript      | Dependencies not installed | Re-run `npm install`  |

## Next Steps

Continue with onboarding, importing billing data, and generating a first invoice.
