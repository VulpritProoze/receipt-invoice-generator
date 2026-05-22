# Fix Report: NextAuth Sign-In Loop & Custom Login UI

---
doc_id: FIX-002
title: NextAuth Sign-In Redirect Loop, Doubled Redirect URL, and Custom Login UI
version: 1.0.0
status: complete
created: 2026-05-22
updated: 2026-05-22
author: Antigravity (agent)
reviewers: none
tags: fix, bug, auth, nextauth, middleware, ui
changelog:
- version: 1.0.0
  date: 2026-05-22
  author: Antigravity
  note: Initial fix report — covers three related auth and UX issues resolved in one session
---

## Issue Description

Three separate but related issues were reported against the production deployment at `https://billgen-taupe.vercel.app` and the local dev environment.

**Issue A — Infinite sign-in redirect loop (production)**
After submitting valid credentials on the NextAuth sign-in page, the browser looped indefinitely through these URLs without ever landing on the app:
1. `POST /api/auth/callback/credentials` → 302
2. `GET /` → 307 (middleware bounced back to sign-in)
3. `GET /api/auth/signin` → 200 (sign-in page rendered again)

**Issue B — Doubled redirect URL (production)**
The middleware redirect in step 2 pointed to a malformed URL:
```
https://billgen-taupe.vercel.app/https://billgen-taupe.vercel.app/api/auth/signin?callbackUrl=%2F
```
The domain appeared twice — once as the origin and once embedded as a path segment.

**Issue C — Chrome DevTools URL hijacking `callbackUrl` (local dev)**
After a successful login in local dev, the browser landed on:
```
http://localhost:3000/.well-known/appspecific/com.chrome.devtools.json
```
instead of the app root `/`.

---

## Root Cause Analysis

### Issue A — `nextAuthMiddleware` called as handler, skipping JWT decode

`src/proxy.ts` invoked `nextAuthMiddleware` (the `withAuth` factory from `next-auth/middleware`) directly as a request handler:

```ts
// BROKEN — calls the factory as if it were a standalone handler
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  return nextAuthMiddleware(req as NextRequestWithAuth, event);
}
```

Calling the factory directly bypassed the JWT decode setup that `withAuth` performs when invoked as a wrapper. As a result, the middleware could never find a valid token in any request — every authenticated user was treated as unauthenticated and bounced back to sign-in, producing the infinite loop.

### Issue B — Doubled redirect URL from unset `pages.signIn`

With `signIn` unset in `withAuth`'s `pages` config, `next-auth/middleware` constructed the redirect URL by combining `NEXTAUTH_URL` (a full `https://` URL) with the default sign-in path in a way that treated the absolute URL as a relative path segment. This produced the doubled-domain string visible in network logs.

### Issue C — `/.well-known/appspecific/com.chrome.devtools.json` captured as `callbackUrl`

Chrome v130+ silently issues a background `GET` to `/.well-known/appspecific/com.chrome.devtools.json` to probe for DevTools configuration. The middleware matcher `/((?!api/auth|...).*)`  matched this path, captured the probe as the `callbackUrl`, and NextAuth faithfully redirected there after a successful login.

---

## Fix Implementation

### `src/proxy.ts`

Three changes applied:

1. **Replaced raw handler invocation with `withAuth` factory call** — `withAuth({...})` is now called at module load time, producing a real middleware handler with proper JWT decode.
2. **Added explicit `pages.signIn`** — set to `"/auth/signin"` so the middleware always produces a clean relative redirect path, eliminating the doubled-domain URL.
3. **Extended the matcher exclusion list** — added `auth/signin` (prevents the login page from being protected, which would cause a loop) and `\.well-known` (excludes Chrome DevTools probes from intercepting `callbackUrl`).

```diff
-import { NextRequest, NextFetchEvent } from "next/server";
-import nextAuthMiddleware, { NextRequestWithAuth } from "next-auth/middleware";
-
-export default function proxy(req: NextRequest, event: NextFetchEvent) {
-  return nextAuthMiddleware(req as NextRequestWithAuth, event);
-}
+import { withAuth } from "next-auth/middleware";
+
+export default withAuth({
+  pages: {
+    signIn: "/auth/signin",
+  },
+});

 export const config = {
   matcher: [
-    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
+    "/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico|\\.well-known).*)",
   ],
 };
```

### `src/app/api/auth/[...nextauth]/route.ts`

Registered the custom sign-in page in `authOptions.pages` so NextAuth redirects through the branded UI instead of its generic default:

```diff
 pages: {
-  // defaults
+  signIn: '/auth/signin',
 },
```

### `src/app/auth/signin/page.tsx` *(new file)*

Created a custom sign-in page replacing the generic NextAuth default UI. Design aligns with the BillGen design system (`src/DESIGN.md`):

| Token | Value |
|---|---|
| Background | Radial + linear gradient (matches home page) |
| Card | `bg-white/80 rounded-2xl border-slate-200 shadow-sm backdrop-blur` |
| Wordmark label | `text-sm font-semibold uppercase tracking-[0.35em] text-slate-500` |
| Heading | `text-3xl font-semibold tracking-tight` |
| Inputs | `border-slate-200 focus:ring-2 focus:ring-blue-500/20 transition-colors` |
| Primary CTA | `bg-blue-600 hover:bg-blue-700` with loading + disabled states |
| Error banner | `bg-red-50 border-red-200 text-red-600` |

Implementation notes:
- Uses `signIn('credentials', { redirect: false })` to handle errors client-side before calling `router.push(callbackUrl)`, avoiding a hard page reload on failure.
- Wrapped in `<Suspense>` to satisfy the Next.js requirement for `useSearchParams()` in server-rendered layouts without build-time warnings.

---

## Verification & Testing

### Manual verification steps

**Local dev:**
1. Start dev server. Navigate to a protected route (e.g. `/invoices`) while logged out.
2. Middleware should redirect to `/auth/signin?callbackUrl=%2Finvoices` (not `/api/auth/signin`).
3. Enter `admin` / `password`. Should land on `/invoices` — not the Chrome DevTools URL.

**Production (Vercel) — after deploy:**
1. Visit `https://billgen-taupe.vercel.app/api/auth/signin` (or any protected route).
2. Enter credentials. Vercel runtime logs should show:
   - `POST /api/auth/callback/credentials` → 302
   - `GET /` → middleware passes through → 200
   - No further 307 bounces.
3. Redirect URL in logs should be `https://billgen-taupe.vercel.app/auth/signin?callbackUrl=...` — domain appears only once.

### Automated tests

No automated tests were added. Auth middleware behaviour depends on runtime cookie handling and is not covered by the current Jest suite. This is tracked as a deferred task in `AGENTS.md` (Phase 9 — Testing Setup, status: Deferred).
