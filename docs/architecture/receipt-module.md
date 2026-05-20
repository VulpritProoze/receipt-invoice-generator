# Receipt Module

---

doc_id: ARCH-004
title: Receipt Module
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: architecture, receipts, pdf
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial draft

---

## Overview

The receipt module exposes a recent-invoices table and creates a receipt only after an invoice exists. Receipts are generated from stored invoice data and carry forward company branding from onboarding.

## Responsibilities

- List recent invoices with key summary data.
- Enforce invoice existence before receipt generation.
- Create a receipt ID in the required format.
- Persist receipt records in Redis.
- Render the receipt PDF using the reference template.

## Interfaces

### Inputs

- Invoice ID from the table row action.
- Stored invoice data and company branding.

### Outputs

- Stored receipt record.
- Generated receipt PDF download response.

### Dependencies

- `src/models/receipt.ts`
- `src/models/company.ts`
- `src/lib/redis.ts`

## Data Flow

The user selects an invoice row, the server loads the invoice, validates the reference, creates the receipt snapshot, stores it, and returns the rendered document.

## Key Design Decisions

- Receipt creation is strictly invoice-driven.
- Company branding is a shared onboarding concern rather than per-receipt input.

## Risks & Limitations

- Receipt rendering cannot be finalized until the template image is available in the workspace.
