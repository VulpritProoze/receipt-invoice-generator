# Invoice Module

---

doc_id: ARCH-003
title: Invoice Module
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: architecture, invoices, pdf
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial draft

---

## Overview

The invoice module lets users filter imported billing items, select rows with checkbox and Shift+Click behavior, complete invoice metadata, and generate a persisted invoice plus downloadable PDF.

## Responsibilities

- Filter invoice items by date range.
- Support multi-select item selection.
- Calculate subtotal, tax, and total at render time.
- Persist invoice records in Redis.
- Produce a server-rendered PDF that matches the reference template.

## Interfaces

### Inputs

- Invoice item rows from the import layer.
- Bill-to information, due date, currency, and tax rate from the form.

### Outputs

- Stored invoice record.
- Generated invoice PDF download response.

### Dependencies

- `src/models/invoice.ts`
- `src/lib/redis.ts`
- PDF rendering library chosen in the dependency ADR

## Data Flow

Selected items flow from the list UI into a server action or route handler. The module validates the payload, computes totals, stores the invoice, and renders the final PDF from the stored data.

## Key Design Decisions

- Totals are computed at render time rather than stored as primary fields.
- Selection logic stays in the UI layer, while invoice persistence stays server-side.

## Risks & Limitations

- Visual parity with the template image remains pending until the template asset is copied into the workspace.
