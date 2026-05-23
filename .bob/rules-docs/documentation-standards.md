# Documentation Mode: Documentation Standards

**Purpose**: Defines template usage, metadata requirements, and consistency rules for all documentation.

---

## Template Usage

### Read Before Writing
Always read: `AGENTS.md`, `README.md`, `docs/templates/`, and target subdirectory to match format and depth.

### Template Mapping

| Doc Type | Template | Target Directory |
|----------|----------|------------------|
| Architecture | `architecture-template.md` | `docs/architecture/` |
| ADRs | `adr-template.md` | `docs/decisions/` |
| Plans | `plan-template.md` | `docs/plans/` |
| Test Reports | `test-report-template.md` | `docs/reports/test-reports/` |
| Refactor Reports | `refactor-report-template.md` | `docs/reports/refactor-reports/` |
| Commit Reports | `commit-report-template.md` | `docs/reports/commit-reports/` |
| Getting Started | `getting-started-template.md` | `docs/getting-started/` |

### Template Compliance
- Fill all sections (no "TODO" placeholders)
- Follow structure (don't reorder or invent sections)
- Match depth of existing docs
- Use consistent formatting

---

## Metadata Requirements

Every doc in `docs/` must begin with metadata header. See `docs/templates/doc-metadata.md` for full spec.

```yaml
---
doc_id: [TYPE-NNN] # ARCH, DEC, PLAN, REP-TEST, REP-REFACTOR, REP-COMMIT, GS
title: [same as H1]
version: [semver — 1.0.0]
status: [draft | review | approved | deprecated]
created: [YYYY-MM-DD]
updated: [YYYY-MM-DD]
author: [agent identifier]
reviewers: [list or "none"]
tags: [comma-separated keywords]
changelog:
  - version: 1.0.0
    date: [YYYY-MM-DD]
    author: [agent identifier]
    note: Initial draft
---
```

**Field Rules:**
- `doc_id`: Globally unique, format `[TYPE]-[NNN]`, three-digit zero-padded
- `version`: Semver — Patch (typos), Minor (new sections), Major (complete rewrite)
- `status`: draft → review → approved → deprecated
- `updated`: Changes every modification
- `changelog`: Append-only, never delete entries

---

## Consistency Standards

**Tone:** Technical but accessible, precise not verbose, active voice, present tense

**Formatting:**
- Headings: H1 (title only), H2 (major sections), H3 (subsections)
- Code: `` `file/path.ts` ``, `` `functionName()` ``, `` `variableName` ``
- Lists: Use `-` for unordered, `1.` for ordered
- Code blocks: Always specify language (```typescript, ```bash, ```json)
- Links: Internal `[text](./path.md)`, External `[text](https://url)`

**Quality:**
- Complete: All metadata populated, all sections filled, sufficient context
- Accurate: Reflects current code state, correct paths/names
- Consistent: Match tone/terminology/formatting of existing docs

---

## Special Cases

**AGENTS.md:** Only modify when explicitly requested. Never delete historical entries. Maintain phase log table format.

**README.md:** Only modify when explicitly requested. Maintain narrative structure. Update version/date when content changes.

**Session Logs:** Auto-created in `docs/reports/session-logs/unresolved/`. Format: `SES-[ISO-timestamp].md`. Never manually edit resolved logs.

---

## Deprecation Protocol

1. Do not delete — deprecation preserves history
2. Update metadata: `status: deprecated`, add `deprecated_date`, add `superseded_by` if applicable
3. Add deprecation notice at top: `> **⚠️ DEPRECATED**: See [DOC-ID](./path.md)`
4. Update changelog with deprecation entry

---

## When Standards Conflict

- Template vs. existing docs → follow existing docs
- This rule vs. existing docs → follow existing docs, flag inconsistency
- Two docs with different styles → follow more recent, note inconsistency

When in doubt: ask for clarification.