# Production Deployment Guide

---
doc_id: GS-003
title: Production Deployment Guide
version: 1.0.0
status: active
created: 2026-05-22
updated: 2026-05-22
author: Docs Agent
reviewers: 
tags: getting-started, deployment
changelog:
  - version: 1.0.0
    date: 2026-05-22
    author: Docs Agent
    note: Initial creation completing Phase 11
---

## Prerequisites

- [ ] A Vercel account (or other serverless hosting provider)
- [ ] An Upstash Redis account
- [ ] A GitHub repository containing the BillGen source code

## Overview

Deploying the BillGen application to production requires transitioning from the local development database to a production-ready datastore. Because serverless environments like Vercel have ephemeral filesystems, the local SQLite database (`.dev/billgen.db`) cannot be used. 

To solve this, BillGen includes a built-in Redis fallback database layer (developed in Phase 4). You must configure the application to use this Redis layer for production deployment.

## Steps

### Step 1: Provision an Upstash Redis Database

1. Log in to [Upstash](https://upstash.com/).
2. Create a new Redis database.
3. Once created, locate your `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the Upstash console. You will need these for the next steps.

### Step 2: Configure Environment Variables

When deploying your application, you must set several environment variables to ensure the correct database adapter and authentication parameters are used. 

Configure the following environment variables in your hosting provider's dashboard (e.g., Vercel Project Settings > Environment Variables):

```bash
# Database Configuration
USE_REDIS=true
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"

# Authentication Configuration
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your-generated-secret" # Generate via: openssl rand -base64 32
ADMIN_USERNAME="your-admin-username"
ADMIN_PASSWORD="your-admin-password"
```

### Step 3: Deploy to Vercel

1. Connect your GitHub repository to Vercel.
2. Ensure the framework preset is set to **Next.js**.
3. Add the environment variables configured in Step 2.
4. Click **Deploy**.

## Verification

To confirm the setup worked:
1. Navigate to your production URL.
2. Attempt to log in using the `ADMIN_USERNAME` and `ADMIN_PASSWORD` you configured.
3. Create a test invoice. The data will be saved securely in your Upstash Redis database.

## Troubleshooting

| Symptom | Likely Cause | Fix |
| ------- | ------------ | --- |
| 500 Error on Save | `USE_REDIS` is not set to `true`, causing Next.js to attempt writing to the ephemeral SQLite file. | Ensure `USE_REDIS=true` in your environment variables. |
| Authentication Fails | `NEXTAUTH_SECRET` is missing or `NEXTAUTH_URL` is incorrect. | Verify both variables. `NEXTAUTH_URL` must exactly match your deployment domain. |
| Database Connection Error | Incorrect Upstash credentials. | Double-check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. |

## Next Steps

- Set up a custom domain in Vercel.
- Share access with your authorized personnel.
