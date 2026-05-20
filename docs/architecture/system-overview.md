# System Overview

---
doc_id: ARCH-001
title: System Overview
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: architecture, overview, billgen
changelog:
  - version: 1.0.0
    date: 2026-05-20
    author: Copilot
    note: Initial draft
---

## Overview
BillGen is a Next.js App Router application for generating invoices and receipts from imported billing rows. It uses Upstash Redis as the primary data store, Zod for runtime validation, and server-side PDF rendering for final output generation.

## Components
- `src/app/`: route shell, onboarding entry point, future dashboard and API routes.
- `src/models/`: TypeScript interfaces and Zod schemas for users, invoices, receipts, and company configuration.
- `src/lib/`: Redis client factory and reusable server-side helpers.
- `src/modules/invoices/`: selection, filtering, total calculation, and PDF generation workflow.
- `src/modules/receipts/`: receipt creation from existing invoices.
- `src/modules/import/`: CSV/XLSX parsing and row validation.
- `src/onboarding/`: company branding setup and persistence.

## Data Flow
1. A user completes onboarding and stores company branding in Redis.
2. Billing data is imported through CSV or XLSX and validated against the invoice item schema.
3. Invoice items are filtered, selected, and submitted to the invoice generator.
4. The invoice record is persisted, then rendered to a PDF.
5. Receipts are generated only from an existing invoice record and reuse the stored company branding.

## Key Design Decisions
- Runtime validation is centralized in Zod schemas.
- Redis access is isolated behind a small server-side client wrapper.
- PDF generation remains server-side so the browser only receives downloadable output.

## Risks & Limitations
- Template fidelity cannot be finalized until the uploaded invoice and receipt images are available in the workspace.
- The initial scaffold does not yet include route handlers or form components.