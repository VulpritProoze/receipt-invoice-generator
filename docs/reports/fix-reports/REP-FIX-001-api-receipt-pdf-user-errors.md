# Fix Report: API Authentication, PDF Generation, and Query Parameter Errors

---
doc_id: FIX-001
title: API Authentication, PDF Generation, and Query Parameter Errors
version: 1.0.0
status: final
created: 2026-05-22
updated: 2026-05-22
author: Antigravity
reviewers: none
tags: fix, bug, auth, pdfkit, api
changelog:
- version: 1.0.0
  date: 2026-05-22
  author: Antigravity
  note: Initial fix report
---

## Issue Description
Several related bugs were encountered affecting the generation and fetching of invoices, receipts, and users:
1. `POST /api/receipts` was failing with a `User not found` error when attempting to generate a receipt for an invoice.
2. `GET /api/reports/invoice/[invoiceID]` was failing with `Error: ENOENT: no such file or directory, open 'D:\ROOT\node_modules\pdfkit\js\data\Helvetica.afm'` during PDF Generation.
3. `GET /api/reports/receipt/[receiptID]` returned `{"error": "userID query parameter is required"}` when a user navigated to a newly created receipt PDF link.
4. `GET /api/users` returned `{"error": "Email query parameter is required"}` when navigating to the `users/` page on the client side, causing a "Failed to fetch users" state.

## Root Cause Analysis
1. **User Not Found**: The local SQLite database lacked a `users` table record for the default `demo-user-001`. NextAuth was also falling back to passing `admin@example.com` instead of the internal user ID because it did not attach the generated `id` property to the session object correctly.
2. **PDFKit ENOENT Error**: The Next.js Webpack bundler overrides `__dirname` in compiled server routes. Because `pdfkit` relies on `__dirname` to lazily resolve the `Helvetica.afm` file at runtime, Webpack misrouted it to the root of the local disk (`D:\ROOT\...`).
3. **Receipt PDF API Parameter**: The receipt report API manually strictly enforced the presence of a `userID` query string parameter, completely ignoring the secure `getCurrentUserId()` session fetcher used elsewhere in the application.
4. **Users Page API Parameter**: The `api/users` GET route was tightly coupled to looking up specific users by email via `?email=xxx` and immediately threw an error if the parameter was omitted, instead of accommodating the "All Users" list for the current single-tenant environment.

## Fix Implementation
1. **Auth & User Records**: 
   - Seeded `demo-user-001` explicitly into the local SQLite `users` table. 
   - Updated NextAuth config in `src/app/api/auth/[...nextauth]/route.ts` to return `demo-user-001` as the `id` and added `jwt`/`session` callbacks to securely transmit it in the token. 
   - Updated `getCurrentUserId` in `src/lib/auth.ts` to seamlessly fallback to `demo-user-001` if legacy `admin@example.com` identifiers are parsed from old cookies.
   - Migrated any orphaned SQLite records mapped to `admin@example.com` to `demo-user-001`.
2. **PDFKit Workaround**: 
   - Added `serverExternalPackages: ['pdfkit']` to `next.config.ts`. This instructs Next.js to skip Webpack bundling for PDFKit and execute it natively via Node.js, preserving accurate internal file-system paths.
3. **Receipt PDF API Security**: 
   - Refactored `src/app/api/reports/receipt/[receiptID]/route.ts` to attempt extraction of the `userID` using `getCurrentUserId()` before failing.
4. **Users Fetch Expansion**: 
   - Refactored `src/app/api/users/route.ts` so that if `email` is absent, it retrieves the current session user via `getCurrentUserId()`, queries `getUserProfile()`, and returns the user array `{ users: [user] }`.

## Verification & Testing
1. Successfully executed a raw SQL update command locally confirming all invoices and receipts sync with the `demo-user-001` user.
2. Verified that raw node fetching of the `pdfkit` library handles font resolving gracefully. (Note: Dev server requires a hard restart for `next.config.ts` to propagate).
3. Verified the structure of the NextAuth Session and ensured the UI gracefully hydrates single-tenant user listings without crashing due to absent query parameters.
