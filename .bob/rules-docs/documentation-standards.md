# Documentation Mode: Documentation Standards

**Purpose**: Defines template usage, metadata requirements, and consistency rules for all documentation.

---

## Documentation Structure

The `docs/` folder is organized by document type:

```
docs/
├── architecture/      # System design and module documentation
├── decisions/         # ADRs (Architecture Decision Records)
├── getting-started/   # Setup and usage guides
├── plans/             # Task plans and roadmaps
├── reports/           # Test, refactor, and commit reports
│   ├── commit-reports/
│   ├── refactor-reports/
│   ├── session-logs/
│   └── test-reports/
└── templates/         # Documentation templates
```

---

## Template Usage

### 1. Read Before Writing

Before producing any documentation, always read:
- `AGENTS.md` — understand the agent roster and how agents are documented
- `README.md` — understand the project's top-level narrative and formatting style
- `docs/templates/` — explore all available templates and identify the one most applicable
- The relevant subdirectory within `docs/` where output will live — read existing files to match format and depth

### 2. Identify the Right Template

Check `docs/templates/` for a template matching the doc type:

| Document Type | Template File | Target Directory |
|--------------|---------------|------------------|
| Architecture notes | `architecture-template.md` | `docs/architecture/` |
| Decision records (ADRs) | `adr-template.md` | `docs/decisions/` |
| Plans | `plan-template.md` | `docs/plans/` |
| Test reports | `test-report-template.md` | `docs/reports/test-reports/` |
| Refactor reports | `refactor-report-template.md` | `docs/reports/refactor-reports/` |
| Commit reports | `commit-report-template.md` | `docs/reports/commit-reports/` |
| Generic reports | `report-template.md` | `docs/reports/` |
| Getting started guides | `getting-started-template.md` | `docs/getting-started/` |

If no template matches, derive structure from existing docs in the relevant subdirectory.

### 3. Template Compliance

When using a template:
- **Fill all sections** — do not leave placeholder text like "TODO" or "TBD"
- **Follow the structure** — do not reorder sections or invent new ones
- **Match the depth** — if existing docs have detailed examples, provide detailed examples
- **Use consistent formatting** — match heading levels, list styles, code block languages

---

## Metadata Requirements

Every documentation file in `docs/` must begin with a metadata header. See `docs/templates/doc-metadata.md` for the full specification.

### Required Metadata Block

```yaml
---
doc_id: [unique identifier — ARCH-001, DEC-003, PLAN-002, etc.]
title: [same as H1 — human-readable]
version: [semver — 1.0.0]
status: [draft | review | approved | deprecated]
created: [YYYY-MM-DD]
updated: [YYYY-MM-DD]
author: [agent identifier or human name]
reviewers: [comma-separated list, or "none"]
tags: [comma-separated keywords relevant to content]
changelog:
  - version: 1.0.0
    date: [YYYY-MM-DD]
    author: [agent identifier]
    note: Initial draft
---
```

### Metadata Field Rules

**`doc_id`:**
- Must be globally unique across the entire `docs/` directory
- Format: `[TYPE]-[NNN]` where TYPE is ARCH, DEC, PLAN, REP-TEST, REP-REFACTOR, REP-COMMIT, GS
- Three-digit zero-padded number (001, 042, 123)
- Scan existing files before assigning to avoid collisions

**`version`:**
- Uses semantic versioning: `MAJOR.MINOR.PATCH`
- **Patch** (x.x.N): typo fixes, minor corrections
- **Minor** (x.N.0): new sections, structural changes, significant rewrites
- **Major** (N.0.0): complete rewrites that change core content or purpose

**`status`:**
- `draft` — work in progress, not yet complete
- `review` — complete but awaiting review
- `approved` — reviewed and accepted
- `deprecated` — no longer current, superseded or obsolete

**`updated`:**
- Changes every time the file is modified
- Format: `YYYY-MM-DD`

**`changelog`:**
- Append-only — never overwrite or delete prior entries
- Each entry must have: version, date, author, note
- Provides document version history

---

## Consistency Standards

### Tone and Style

- **Technical but accessible** — assume the reader is competent but unfamiliar with this specific codebase
- **Precise, not verbose** — every sentence must carry meaning
- **Active voice** — "The service validates input" not "Input is validated by the service"
- **Present tense** — "The function returns" not "The function will return"

### Formatting Conventions

**Headings:**
- H1 (`#`) — document title only, matches metadata `title`
- H2 (`##`) — major sections
- H3 (`###`) — subsections
- H4 (`####`) — rarely used, only for deep nesting

**Code references:**
- File paths: `` `src/models/invoice.ts` ``
- Function names: `` `createInvoice()` ``
- Variable names: `` `invoiceID` ``
- Commands: `` `npm install` ``

**Lists:**
- Use `-` for unordered lists (not `*` or `+`)
- Use `1.` for ordered lists
- Indent nested lists with 2 spaces

**Code blocks:**
- Always specify language: ` ```typescript `, ` ```bash `, ` ```json `
- Use `sh` or `bash` for shell commands
- Use `text` for plain output

**Links:**
- Internal docs: `[link text](./relative/path.md)`
- External: `[link text](https://example.com)`
- Anchor links: `[link text](#section-heading)`

---

## Quality Standards

### Completeness

A complete document must:
- Have all required metadata fields populated
- Fill all template sections (no "TODO" placeholders)
- Provide enough context that a reader with no prior knowledge can understand
- Include examples where appropriate
- Reference related documents when relevant

### Accuracy

Documentation must:
- Reflect the current state of the code (not a past or planned state)
- Provide correct file paths and line numbers
- Use actual function/class/variable names from the codebase
- Match the behavior described in the code

### Consistency

Documentation must:
- Match the tone and style of existing docs in the same directory
- Use the same terminology as other docs (don't invent new names for existing concepts)
- Follow the same formatting conventions
- Use the same heading structure and depth

---

## Special Cases

### AGENTS.md

- High-visibility file — treat updates as deliberate, not incidental
- Only modify when explicitly requested
- Maintain the phase log table format
- Keep hand-off notes chronological
- Never delete historical entries

### README.md

- Project's public face — changes affect all readers
- Only modify when explicitly requested
- Maintain the existing narrative structure
- Keep the tone welcoming but professional
- Update version numbers and dates when content changes

### Session Logs

- Saved to `docs/reports/session-logs/unresolved/` at session end
- Format: `SES-[ISO-8601-timestamp].md`
- Moved to `resolved/` after processing by `session-resolver` skill
- Never manually edit resolved session logs

---

## Deprecation Protocol

When a document becomes outdated:

1. **Do not delete it** — deprecation preserves history
2. **Update metadata:**
   - Set `status: deprecated`
   - Add `deprecated_date: YYYY-MM-DD`
   - If superseded, add `superseded_by: [DOC-ID]`
3. **Add deprecation notice** at the top of the document:
   ```markdown
   > **⚠️ DEPRECATED**: This document is no longer current. See [DOC-ID](./path/to/new-doc.md) for current information.
   ```
4. **Update changelog** with deprecation entry

---

## When Standards Conflict

If you encounter a conflict between:
- **Template vs. existing docs** → follow existing docs (they reflect project evolution)
- **This rule vs. existing docs** → follow existing docs, but flag the inconsistency
- **Two existing docs with different styles** → follow the more recent one, note the inconsistency

When in doubt: ask for clarification rather than guessing.