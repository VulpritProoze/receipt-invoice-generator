# Code Exploration Summary: BillGen (receipt-invoice-generator)

---

doc_id: CODE-EXPLORATION-BILLGEN
title: Code Exploration Summary
version: 1.0.0
status: draft
created: 2026-05-21
updated: 2026-05-21
author: code-explorer
reviewers: none
tags: code-exploration, summary, receipt-invoice, nextjs

---

## Summary

A Next.js (App Router) TypeScript workspace that implements the backend business logic and Redis persistence for invoice and receipt creation/listing, with a partially scaffolded client UI (site shell, dashboard, onboarding) and Zod data schemas for domain validation.

## Project root overview

- Primary purpose: BillGen — a focused workspace to import billing history, generate invoices and receipts, and persist them in Redis (Upstash) with typed Zod schemas and server-side API handlers. This is inferred from package.json, AGENTS.md, the app shell, and the modules under src/modules and src/lib.

## Languages, frameworks, and runtime

- Primary language: TypeScript (tsconfig.json present).
- Frameworks / libraries:
  - Next.js 16.2.6 (package.json: "next": "16.2.6") — App Router used (src/app)
  - React 19.2.6 (package.json)
  - Zod 4.4.3 for schema validation
  - Upstash Redis (@upstash/redis 1.38.0) for persistence
  - Jest + @testing-library for tests
  - Tailwind (tailwindcss 4.3.0) and PostCSS
  - PDF and Excel libs: @react-pdf/renderer, pdfkit, papaparse, xlsx-js-style
- TypeScript version: 6.0.3 (devDependencies)
- Node runtime: not pinned in package.json, but Next.js target implies Node 18+ recommended; next.config.ts sets output: 'standalone'.

## Top-level file/directory map

- .agents/ — agent orchestration, code-exploration directory exists for reports
- .antigravitycli/ — agent tooling (scaffolded by tooling)
- .bob/ — build/automation metadata (Bob)
- .git/ and .github/ — VCS and GitHub workflows
- .next/ — Next.js build output (generated)
- AGENTS.md — project agent plan and status
- coverage/ — test coverage output (generated)
- docs/ — documentation and templates (includes code-exploration template)
- eslint.config.js — ESLint flat-config wrapper and rules
- jest.config.ts, jest.setup.ts — Jest configuration and setup
- next-env.d.ts — Next types
- next.config.ts — Next build/runtime config
- node_modules/ — dependencies
- package.json, package-lock.json — dependencies & scripts
- postcss.config.mjs — PostCSS configuration (Tailwind)
- src/ — application source code (detailed below)
- tsconfig.json, tsconfig.tsbuildinfo — TypeScript config and build cache

## Top-level src/ map (key directories)

- src/app/ — Next.js App Router pages and layouts (root layout, providers, homepage, dashboard, onboarding, api)
  - src/app/page.tsx — Home page
  - src/app/layout.tsx — Root layout and site shell
  - src/app/dashboard/page.tsx — Dashboard route (server component)
  - src/app/onboarding/page.tsx + OnboardingForm — onboarding UI
  - src/app/providers.tsx — Providers exposing demo user (temporary)
  - src/app/api/* — server routes (invoices, receipts, users, onboarding, etc.)
- src/components/ — UI primitives (Nav, Footer, Button, Container) with tests
- src/lib/ — utilities and persistence adapters
  - src/lib/redis.ts — Upstash Redis client wrapper and singleton
  - src/lib/db/ — Redis-backed data access layers for invoices, receipts, users, company
  - src/lib/idGenerator.ts — invoice/receipt ID generators
  - src/lib/maskCreditCard.ts — utility to mask credit cards
- src/models/ — Zod schemas for Invoice, Receipt, User, Company
- src/modules/ — service/business logic layers (invoices, receipts, users, reports, core tests)
- src/onboarding/ — onboarding service layer

## Entry points and build/start commands

- package.json scripts:
  - dev: next dev
  - build: next build
  - start: next start
  - lint: eslint src --max-warnings 0
  - typecheck: tsc --noEmit
  - test: jest

- App entry points:
  - Next.js App Router: src/app/layout.tsx (RootLayout), src/app/page.tsx (home)
  - API routes: src/app/api/* route.ts files (Next server functions)

- Build pipeline: next build produces standalone output (next.config.ts: output: 'standalone'). Tests and typecheck scripts exist for CI.

## Important configuration files and roles

- package.json — dependencies, scripts, versions
- tsconfig.json — TypeScript compiler configuration, path alias @/* -> ./src/*
- next.config.ts — Next.js runtime configuration (standalone output)
- eslint.config.js — ESLint configuration using typescript-eslint wrapper
- jest.config.ts, jest.setup.ts — Test runner configuration and setup
- postcss.config.mjs — PostCSS + Tailwind integration
- docs/templates/code-exploration-summary-template.md — required template for exploration reports

## API surface (server routes)

Located under src/app/api (Next.js App Router server handlers). Key handlers found:

- Invoices collection and create/list:
  - src/app/api/invoices/route.ts
    - POST /api/invoices — createInvoice
    - GET /api/invoices?userID=... — listUserInvoices
- Invoice item (resource) operations:
  - src/app/api/invoices/[invoiceID]/route.ts
    - GET /api/invoices/[invoiceID]?userID=... — getInvoice
    - PATCH /api/invoices/[invoiceID]?userID=... — updateInvoice
    - DELETE /api/invoices/[invoiceID]?userID=... — deleteInvoice
- Receipts collection and create/list:
  - src/app/api/receipts/route.ts
    - POST /api/receipts — createReceipt (from invoice)
    - GET /api/receipts?userID=... — listUserReceipts
- Receipt item operations:
  - src/app/api/receipts/[receiptID]/route.ts
    - GET /api/receipts/[receiptID]?userID=... — getReceipt
    - DELETE /api/receipts/[receiptID]?userID=... — deleteReceipt
- Users:
  - src/app/api/users/route.ts
    - POST /api/users — registerUser
    - GET /api/users?email=... — findUserByEmail
- Onboarding:
  - src/app/api/onboarding/route.ts
    - GET /api/onboarding?userID=... — get onboarding progress
    - POST /api/onboarding — completeOnboarding (validates against companyConfigSchema)

Notes:
- API handlers use defensive checks (explicit missing field checks) and call into service layers under src/modules/* which in turn call src/lib/db/* persistence.
- Some API directories referenced (reports) appear scaffolded but route files are not present for all report types — further inspection required.

## Client pages and components

Client pages implemented (server components in app/):
- src/app/page.tsx — Home
- src/app/dashboard/page.tsx — Dashboard (server). Redirects to onboarding if onboarding not complete for demo user 'demo-user-001'
- src/app/onboarding/page.tsx and src/app/onboarding/OnboardingForm.tsx — Onboarding UI
- Root layout: src/app/layout.tsx and global styles src/app/globals.css

Client components (key UI primitives):
- src/components/Nav.tsx — top navigation with links for Dashboard, Invoices, Receipts, Import, Onboarding (some routes not yet implemented)
- src/components/Footer.tsx
- src/components/Button.tsx, Container.tsx — UI primitives

Missing/placeholder pages observed (Nav links exist but pages not implemented):
- /invoices (no src/app/invoices directory present in repository snapshot)
- /receipts (no src/app/receipts directory present)
- /import (no src/app/import directory present)

## Data models and validation

Zod schemas exist for all main domain objects in src/models:
- src/models/invoice.ts — invoiceSchema, invoiceItemSchema (Invoice, InvoiceItem types)
- src/models/receipt.ts — receiptSchema (Receipt type)
- src/models/user.ts — userSchema (User type). Note: creditCardNumber expects masked format
- src/models/company.ts — companyConfigSchema (CompanyConfig)

Persistence adapters validate and parse stored data using the same schemas (see src/lib/db/* files) to ensure data integrity.

No ORM or Prisma found; persistence is done via Upstash Redis client (src/lib/redis.ts) with a RedisClient wrapper.

## Tests and test harness

- Test framework: Jest (jest.config.ts) with @swc/jest
- Testing libraries: @testing-library/react, @testing-library/jest-dom
- Tests are present across the codebase (unit and integration tests): many files with *.unit.test.ts, *.integration.test.ts under src/modules, src/lib, src/onboarding, src/models
- Do NOT run tests in this exploration. Tests are set up and will run via npm run test in CI/local when ready.

## Known TODOs / FIXMEs found (source comments)

- src/app/dashboard/page.tsx: TODO to obtain actual userID from authentication session (lines ~10-13).
- src/app/onboarding/page.tsx: TODO to obtain actual userID from auth session (lines ~11-13).
- src/components and other UI files: no explicit FIXMEs but Nav links to pages that aren't implemented (Invoices, Receipts, Import) — effectively TODOs for pages.
- AGENTS.md: several remaining phases (Data Models, Database Layer, Import Module, Report Generation, Onboarding Flow) marked incomplete.

## Dependencies of interest (from package.json)

- next 16.2.6 (framework)
- react 19.2.6, react-dom 19.2.6
- zod 4.4.3 (validation)
- @upstash/redis 1.38.0 (persistence)
- pdfkit, @react-pdf/renderer (PDF generation)
- papaparse, xlsx-js-style (CSV/XLSX import and styled Excel output)
- date-fns (date handling)
- uuid (IDs)
- tailwindcss 4.3.0 (styling)
- jest and testing libraries (unit tests)

All of the above appear in package.json.

## MVP gaps and recommended tasks

Note: Acceptance criteria focus on a minimal working MVP to create/list invoices and generate receipts from invoices with a simple UI and running locally using demo credentials.

Task 1 — Implement Invoices pages (list and create)
- Missing: client pages to list user invoices and create a new invoice
- Files to create/edit:
  - Create new directory: src/app/invoices/
  - Create src/app/invoices/page.tsx (Invoice list) — server component that fetches GET /api/invoices?userID=demo-user-001
  - Create src/app/invoices/create/page.tsx (Create invoice) — client/server form that POSTs to /api/invoices
  - Optional: src/app/invoices/[invoiceID]/page.tsx (view invoice)
- Complexity: medium
- Assignee: implementation-agent
- Acceptance criteria:
  - A user can visit /invoices and see a list (empty or populated) for demo-user-001 using the API
  - The create form validates required fields client-side (basic) and successfully creates an invoice via POST /api/invoices
  - After creation, the invoice appears in list and the app navigates to invoice view
- Priority: 1

Task 2 — Implement Receipts pages (list and create from invoice)
- Missing: client UI to view receipts and generate a receipt from an invoice
- Files to create/edit:
  - Create src/app/receipts/page.tsx (Receipt list)
  - Create src/app/receipts/[receiptID]/page.tsx (Receipt view)
  - Create src/app/receipts/create-from-invoice/page.tsx or integrate 'Generate Receipt' action in invoice view
- Complexity: medium
- Assignee: implementation-agent
- Acceptance criteria:
  - A user can visit /receipts and see receipts for demo-user-001
  - From an invoice view, the user can generate a receipt which posts to POST /api/receipts and then appears in list
- Priority: 2

Task 3 — Implement Import page (CSV/XLSX import, basic validation)
- Missing: the import flow for billing history (client upload + server-side parse/validate and DB import)
- Files to create/edit:
  - Create src/app/import/page.tsx (Import UI with file input)
  - Create a module to parse CSV/XLSX on server or client (use papaparse / xlsx-js-style as dependency)
  - Wire to a new API route if server parsing desired: src/app/api/import/route.ts
- Complexity: high
- Assignee: refactor-agent (larger scope, parsing, schema mapping)
- Acceptance criteria:
  - User can upload a CSV/XLSX and the server accepts/validates rows against invoiceItemSchema
  - Valid rows are stored via src/lib/db (e.g., createInvoiceItem)
  - Errors are surfaced with clear messages
- Priority: 4

Task 4 — Add simple authentication/provider replacement for demo user
- Missing: real auth; code uses demo-user-001 in server components and Providers offers demo user
- Files to edit/create:
  - src/app/providers.tsx — replace demo user with pluggable auth provider or environment-driven demo user
  - Extract a single source-of-truth to get currentUserID (e.g., src/lib/auth.ts)
- Complexity: medium
- Assignee: implementation-agent
- Acceptance criteria:
  - Server components should read current userID from a single helper
  - Easily switchable to an OAuth/JWT provider later
  - All existing internal demo usage replaced to call the helper
- Priority: 3

Task 5 — Centralize Zod schemas usage and remove duplicate defensive checks in routes
- Missing: API routes perform inline "requiredFields" checks duplicating Zod validation
- Files to edit:
  - src/app/api/*/route.ts — replace manual missing field checks with shared validation helpers
  - Create src/lib/validation.ts or src/schemas/index.ts that exports schema-based validators
- Complexity: low to medium
- Assignee: implementation-agent
- Acceptance criteria:
  - API handlers use schema.safeParse or schema.parse to validate request bodies
  - Error handling surfaces ZodError details in 400 responses consistently
- Priority: 5

Task 6 — Environment & deployment readiness: document and fail gracefully if Redis not configured
- Missing: env var checks already exist but need clear developer docs and fallback for local dev (in-memory or sqlite stub)
- Files to edit/create:
  - docs/ENV.md — document UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN and local dev instructions
  - Optionally implement an in-memory Redis client for local development in src/lib/redis.ts or src/lib/redis.mock.ts
- Complexity: medium
- Assignee: implementation-agent
- Acceptance criteria:
  - Running dev without env vars prints clear message and app uses a local dev stub or instructions in README
  - CI/CD secrets instructions present in docs
- Priority: 6

## Files the next implementation-agent/refactor-agent should open or edit (exact paths)

Priority 1 (Implement invoices UI):
- Open for read/edit:
  - src/app/layout.tsx — (to reference Nav, layout)
  - src/components/Nav.tsx — review links to /invoices
  - Create/Edit:
    - (create) src/app/invoices/page.tsx — implement invoice list server component
    - (create) src/app/invoices/create/page.tsx — implement create form
    - (create) src/app/invoices/[invoiceID]/page.tsx — view invoice and 'Generate Receipt' action
  - Service/API to verify:
    - src/app/api/invoices/route.ts
    - src/app/api/invoices/[invoiceID]/route.ts
    - src/modules/invoices/invoiceService.ts
    - src/lib/db/invoices.ts

Priority 2 (Implement receipts UI):
- Create/Edit:
  - (create) src/app/receipts/page.tsx
  - (create) src/app/receipts/[receiptID]/page.tsx
  - Optionally: src/app/receipts/create-from-invoice/page.tsx or hook into invoice view
  - Service/API to verify:
    - src/app/api/receipts/route.ts
    - src/app/api/receipts/[receiptID]/route.ts
    - src/modules/receipts/receiptService.ts
    - src/lib/db/receipts.ts

Priority 3 (Auth & Providers):
- Edit:
  - src/app/providers.tsx — centralize current user extraction
  - Any server components that use hardcoded demo-user-001 (search and replace in src/app/dashboard/page.tsx and src/app/onboarding/page.tsx)

Priority 4 (Validation refactor):
- Edit:
  - src/app/api/invoices/route.ts and src/app/api/receipts/route.ts — replace manual checks with schema validation calls
  - Create: src/lib/validation.ts — shared helper(s)

Priority 5 (Import flow):
- Create:
  - src/app/import/page.tsx
  - src/app/api/import/route.ts (if server-side parsing)
  - Utility: src/modules/import/importService.ts

Verification commands (developer should run locally after making changes):
- npm install (if dependencies changed)
- npm run build
- npm run dev (to manually test pages) OR npm run start after production build
- Use curl or http client to exercise API endpoints, e.g.:
  - curl -X GET "http://localhost:3000/api/invoices?userID=demo-user-001"
  - curl -X POST "http://localhost:3000/api/invoices" -H "Content-Type: application/json" -d '{...}'

Do NOT run tests or linters automatically as part of the exploration step.

## Risky or blocking items

- Redis credentials: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for runtime; src/lib/redis.ts throws a RedisError when missing. This blocks DB operations unless a dev stub or mock is provided.
- Credit card handling: userSchema expects masked credit card numbers (format **** **** **** 1234). Real payment handling must not store full PANs — ensure masking and PCI compliance in future.
- Some API route folders (reports) appear partially scaffolded; missing route.ts files may be required for report generation.
- No authentication — many server components use a hard-coded demo user ID; implementing a real auth flow is necessary for multi-tenant safety.

---

MACHINE_SUMMARY:

{
  "top_level_dirs": [
    ".agents",
    ".antigravitycli",
    ".bob",
    ".git",
    ".github",
    ".next",
    "coverage",
    "docs",
    "node_modules",
    "src"
  ],
  "package_scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "mvp_tasks": [
    {
      "id": "T1",
      "title": "Implement Invoices pages (list and create)",
      "complexity": "medium",
      "assignee": "implementation-agent",
      "files": [
        "src/app/invoices/page.tsx (create)",
        "src/app/invoices/create/page.tsx (create)",
        "src/app/invoices/[invoiceID]/page.tsx (optional view)",
        "src/app/api/invoices/route.ts",
        "src/app/api/invoices/[invoiceID]/route.ts",
        "src/modules/invoices/invoiceService.ts",
        "src/lib/db/invoices.ts"
      ],
      "acceptance_criteria": "User can view invoice list for demo-user-001, create a new invoice via the UI, and see the created invoice in the list.",
      "priority": 1
    },
    {
      "id": "T2",
      "title": "Implement Receipts pages (list and create)",
      "complexity": "medium",
      "assignee": "implementation-agent",
      "files": [
        "src/app/receipts/page.tsx (create)",
        "src/app/receipts/[receiptID]/page.tsx (create)",
        "src/modules/receipts/receiptService.ts",
        "src/lib/db/receipts.ts",
        "src/app/api/receipts/route.ts",
        "src/app/api/receipts/[receiptID]/route.ts"
      ],
      "acceptance_criteria": "User can view receipts for demo-user-001 and generate a receipt from an invoice which is persisted and listed.",
      "priority": 2
    },
    {
      "id": "T3",
      "title": "Add simple authentication/provider abstraction",
      "complexity": "medium",
      "assignee": "implementation-agent",
      "files": [
        "src/app/providers.tsx",
        "src/lib/auth.ts (create)",
        "src/app/dashboard/page.tsx (edit)",
        "src/app/onboarding/page.tsx (edit)"
      ],
      "acceptance_criteria": "Server components use a single helper to obtain currentUserID and demo user usage removed; ready for later integration with real auth.",
      "priority": 3
    },
    {
      "id": "T4",
      "title": "Add Import page (CSV/XLSX parsing & validation)",
      "complexity": "high",
      "assignee": "refactor-agent",
      "files": [
        "src/app/import/page.tsx (create)",
        "src/app/api/import/route.ts (create optional)",
        "src/modules/import/importService.ts (create)",
        "src/lib/db/invoices.ts (reuse createInvoiceItem)"
      ],
      "acceptance_criteria": "User can upload CSV/XLSX; valid rows are stored; invalid rows return errors; import integrates with invoice item storage.",
      "priority": 4
    },
    {
      "id": "T5",
      "title": "Centralize Zod validation and remove duplicate route checks",
      "complexity": "low",
      "assignee": "implementation-agent",
      "files": [
        "src/lib/validation.ts (create)",
        "src/app/api/invoices/route.ts (edit)",
        "src/app/api/receipts/route.ts (edit)",
        "src/app/api/onboarding/route.ts (edit)"
      ],
      "acceptance_criteria": "API handlers use shared schema validation utilities; ZodError handling consistent across routes.",
      "priority": 5
    }
  ]
}
