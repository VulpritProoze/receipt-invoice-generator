# Import Guide

---
doc_id: GS-004
title: Import Guide
version: 1.0.0
status: draft
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: getting-started, import, csv, xlsx
changelog:
  - version: 1.0.0
    date: 2026-05-20
    author: Copilot
    note: Initial
---

## Supported Files
- CSV
- XLSX

## Required Columns
- `Description`
- `Quantity`
- `Rate`
- `Date`

## Notes
- Keep dates parseable and consistent.
- Blank rows are skipped.
- Invalid rows should be reviewed before invoice generation.

## Verification
Upload a sample fixture file, confirm valid rows are imported, and confirm skipped rows are listed with reasons.