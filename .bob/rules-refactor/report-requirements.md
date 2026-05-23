# Refactor Mode: Report Requirements

**Purpose**: Defines structure and content requirements for refactor reports.

---

## Report Template & Location

**Template:** `docs/templates/refactor-report-template.md`
**Directory:** `docs/reports/refactor-reports/`
**Filename:** `REP-REFACTOR-[NNN]-[slug].md` (e.g., `REP-REFACTOR-003-auth-module-split.md`)

**Next number:** List files, find highest `REP-REFACTOR-NNN`, increment, zero-pad to 3 digits.

---

## Required Sections

### 1. Metadata Header
Standard metadata block with `doc_id: REP-REFACTOR-NNN`, version 1.0.0, status approved, tags including "refactor".

### 2. Summary
One-paragraph overview: goal, problem solved, scope (files/modules affected).

### 3. Motivation
Why refactor was necessary: old structure problems, new structure benefits, constraints.

### 4. Changes Made
Comprehensive list:
- **Files Modified**: path + brief description
- **Files Created**: path + purpose
- **Files Deleted**: path + reason
- **Files Moved/Renamed**: old → new path

### 5. Decisions Made
Non-obvious choices: approach rationale, trade-offs considered, plan deviations.

### 6. Risks and Follow-up Items
- **Risks**: issues introduced, technical debt
- **Follow-up**: needed work, monitoring areas (use checkboxes)

### 7. Verification
- Tests run and results
- Manual verification performed
- Known issues

### 8. Scope Escalations (if any)
Original scope, expanded scope, rationale, approval status.

---

## Quality Standards

Complete report must:
- Include all required sections
- Have complete metadata with unique `doc_id`
- List every file modified/created/deleted
- Explain all non-obvious decisions
- Document all risks and follow-ups
- Describe verification
- Use exact file paths
- Be comprehensive enough to understand without reading code

---

## Output Confirmation

```
Refactor Mode — Report Complete
File: docs/reports/refactor-reports/REP-REFACTOR-[NNN]-[slug].md
Scope: [What was refactored]
Files Changed: [Number]
Key Decisions: [1-2 sentence summary]
Follow-up Items: [Number]
```

---

## When to Write

Write **after all code changes complete** but **before marking task complete**.

**Sequence:** Complete changes → Verify → Write report → Confirm

**Never:** Write before complete, skip report, write without verifying, mark complete without report.