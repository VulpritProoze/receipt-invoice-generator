# Import Module

---
doc_id: ARCH-005
title: Import Module
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: architecture, import, csv, xlsx
changelog:
  - version: 1.0.0
    date: 2026-05-20
    author: Copilot
    note: Initial draft
---

## Overview
The import module accepts CSV or XLSX files, validates each row, and converts valid rows into invoice item records tied to a selected user.

## Responsibilities
- Detect supported file type.
- Parse rows with `Description`, `Quantity`, `Rate`, and `Date` columns.
- Normalize date formats into ISO strings.
- Report skipped rows with explicit reasons.

## Validation Rules
- Quantity and rate must parse as finite, non-negative numbers.
- Date must be parseable into a valid ISO date string.
- Empty rows are skipped.
- Unsupported file extensions are rejected.

## Data Flow
Upload arrives at the server, is parsed into raw rows, is validated and normalized, then returns a structured import summary for the UI.

## Key Design Decisions
- Parsing is isolated from UI concerns so the same logic can support tests and route handlers.
- File fixtures live next to the import module for deterministic test coverage.

## Risks & Limitations
- XLSX handling should be kept minimal to reduce parser complexity.