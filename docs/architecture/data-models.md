# Data Models

---

doc_id: ARCH-002
title: Data Models
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: architecture, data-models, zod
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial draft

---

## Overview

The application uses four primary records: `User`, `Invoice`, `Receipt`, and `CompanyConfig`. Each has a matching Zod schema in `src/models/` so runtime validation and TypeScript inference stay aligned.

## Model Notes

### User

- Stores identity, contact information, and masked card details.
- `creditCardNumber` is masked before persistence and must never be stored raw.

### Invoice

- Represents a billable event and the selected invoice items.
- `invoiceID` uses the `INV#########` format.
- `taxRate` is a decimal value, typically `0.12`.

### InvoiceItem

- Represents a single billable row imported from CSV/XLSX or selected in the UI.
- `date` is kept as an ISO string for range filtering.

### Receipt

- References the originating invoice and snapshots the items at receipt time.
- `receiptID` uses the `CH_` prefix plus 17 uppercase alphanumeric characters.

### CompanyConfig

- Single-tenant branding configuration stored once during onboarding.
- Applied to invoice and receipt rendering.

## Constraints

- All date fields are stored as ISO strings.
- Currency is limited to `PHP` and `USD`.
- Receipt generation requires a valid invoice reference.

## Key Design Decisions

- Schemas live next to interfaces to keep schema and model drift visible.
- Shared helper logic should be placed in `src/lib/` or a model-local helper only if the logic is tightly coupled.

## Risks & Limitations

- Additional model fields should not be added without an ADR.
- Receipt and invoice visual layouts remain blocked on template file ingestion.
