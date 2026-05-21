# Refactor Mode: Report Requirements

**Purpose**: Defines the structure and content requirements for refactor reports.

---

## Report Template

Use `docs/templates/refactor-report-template.md` as your structural guide. Check the template before writing to ensure you follow the current format.

---

## Report Location and Naming

**Target directory:** `docs/reports/refactor-reports/`

**Filename format:** `REP-REFACTOR-[NNN]-[slug].md`
- `[NNN]` — Three-digit zero-padded number (e.g., `003`)
- `[slug]` — Brief kebab-case description (e.g., `auth-module-split`)

**Determining the next number:**
1. List all files in `docs/reports/refactor-reports/`
2. Find the highest existing `REP-REFACTOR-NNN` number
3. Increment by one
4. Zero-pad to three digits

**Example:**
```
Existing: REP-REFACTOR-001, REP-REFACTOR-002
Next: REP-REFACTOR-003-your-slug-here.md
```

---

## Required Sections

### 1. Metadata Header

Every refactor report must begin with the standard metadata block:

```yaml
---
doc_id: REP-REFACTOR-NNN
title: [Same as H1 heading]
version: 1.0.0
status: approved
created: [YYYY-MM-DD]
updated: [YYYY-MM-DD]
author: [agent identifier]
reviewers: none
tags: refactor, [other relevant tags]
changelog:
  - version: 1.0.0
    date: [YYYY-MM-DD]
    author: [agent identifier]
    note: Initial refactor report
---
```

### 2. Summary

**Purpose:** One-paragraph overview of what was refactored and why.

**Content:**
- What was the goal of this refactor?
- What problem did it solve or what improvement did it make?
- What was the scope (how many files, which modules)?

**Example:**
```markdown
## Summary

Refactored the invoice creation flow to extract duplicated item extraction logic into a shared utility function. This reduces code duplication between the invoice and receipt services, making the codebase more maintainable. The refactor touched 3 files and introduced 1 new utility function.
```

### 3. Motivation

**Purpose:** Explain why this refactor was necessary.

**Content:**
- What was the problem with the old structure?
- What benefits does the new structure provide?
- Were there any constraints or requirements?

**Example:**
```markdown
## Motivation

The invoice and receipt services both contained nearly identical logic for extracting items from uploaded data. This duplication meant:
- Bug fixes had to be applied in two places
- New features required parallel changes
- The two implementations could drift out of sync

Extracting to a shared utility eliminates this duplication and provides a single source of truth for item extraction logic.
```

### 4. Changes Made

**Purpose:** Comprehensive list of all file modifications.

**Content:**
- Files modified (with brief description of changes)
- Files created (with purpose)
- Files deleted (with reason)
- Files moved/renamed (old path → new path)

**Format:**
```markdown
## Changes Made

### Files Modified
- `src/modules/invoices/invoiceService.ts` — Replaced inline extraction with utility call
- `src/modules/receipts/receiptService.ts` — Replaced inline extraction with utility call
- `src/lib/utils.ts` — Added extractInvoiceItems() utility function

### Files Created
- None

### Files Deleted
- None

### Files Moved/Renamed
- None
```

### 5. Decisions Made

**Purpose:** Document non-obvious choices made during the refactor.

**Content:**
- Why was this approach chosen over alternatives?
- What trade-offs were considered?
- Were there any deviations from the original plan?

**Example:**
```markdown
## Decisions Made

**Location of new utility:**
Chose `src/lib/utils.ts` over `src/modules/shared/` because the extraction logic is generic and not specific to invoices or receipts. Placing it in `lib/` makes it available to any module that needs it.

**Function naming:**
Kept the name `extractInvoiceItems()` even though it's now generic, to maintain clarity at call sites. The function signature makes it clear it works with any item array.

**No signature changes:**
Preserved the exact signature of the original inline code to minimize changes at call sites. This made the refactor safer and easier to verify.
```

### 6. Risks and Follow-up Items

**Purpose:** Document known issues, limitations, or future work.

**Content:**
- Risks introduced by this refactor
- Technical debt created or deferred
- Follow-up work needed
- Areas that need monitoring

**Example:**
```markdown
## Risks and Follow-up Items

**Risks:**
- The new utility function is not yet independently tested. If it has a bug, both services are affected.
- If invoice item structure changes significantly, the shared utility may need to handle multiple formats.

**Follow-up items:**
- [ ] Add unit tests for `extractInvoiceItems()` in `src/lib/utils.unit.test.ts`
- [ ] Consider renaming to `extractItems()` if used more broadly in the future
- [ ] Monitor for performance impact if used with very large datasets
```

### 7. Verification

**Purpose:** Document how the refactor was verified.

**Content:**
- What tests were run?
- What manual verification was performed?
- Are there any known issues?

**Example:**
```markdown
## Verification

**Tests run:**
- All existing unit tests for invoice and receipt services pass
- No new test failures introduced
- TypeScript compilation succeeds with zero errors

**Manual verification:**
- Traced execution path through both services
- Verified function signatures match at all call sites
- Confirmed no circular dependencies introduced

**Known issues:**
- None
```

### 8. Scope Escalations (if any)

**Purpose:** Document any scope changes that occurred during the refactor.

**Content:**
- What was the original scope?
- What additional scope was needed?
- Why was the expansion necessary?
- Was it approved?

**Example:**
```markdown
## Scope Escalations

**Original scope:**
Extract duplicated code from invoice service only.

**Expanded scope:**
Also refactored receipt service to use the same utility.

**Rationale:**
During exploration, discovered that receipt service had identical duplication. Refactoring only one service would leave the codebase inconsistent. Expansion approved before proceeding.
```

---

## Report Quality Standards

A complete refactor report must:

- [ ] Include all required sections
- [ ] Have complete metadata header with unique `doc_id`
- [ ] List every file modified, created, or deleted
- [ ] Explain all non-obvious decisions
- [ ] Document all risks and follow-up items
- [ ] Describe verification performed
- [ ] Use exact file paths (not vague references)
- [ ] Be comprehensive enough that someone can understand the refactor without reading the code

---

## Output Confirmation Format

After writing the report, output:

```
Refactor Mode — Report Complete
File: docs/reports/refactor-reports/REP-REFACTOR-[NNN]-[slug].md
Scope: [What was refactored]
Files Changed: [Number of files modified/created/deleted]
Key Decisions: [1-2 sentence summary of most important decisions]
Follow-up Items: [Number of items flagged]
```

---

## When to Write the Report

The refactor report is written **after all code changes are complete** but **before marking the task complete**.

**Sequence:**
1. Complete all code changes
2. Verify changes (tests pass, no broken references)
3. Write the refactor report
4. Confirm completion with output

**Never:**
- Write the report before changes are complete
- Skip the report because "it was a small refactor"
- Write the report without verifying the changes
- Mark the task complete without writing the report