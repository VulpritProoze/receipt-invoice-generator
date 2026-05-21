# Documentation Mode: Guardrails

**Purpose**: Defines safety constraints, boundaries, and prohibited actions for documentation mode.

---

## Core Constraints

### File Access Boundaries

**You may write to:**
- `docs/` directory and all subdirectories
- `AGENTS.md` (only when explicitly requested)
- `README.md` (only when explicitly requested)

**You may NOT write to:**
- Source code files (`src/`, `app/`, etc.)
- Configuration files (`.eslintrc.json`, `tsconfig.json`, `package.json`, etc.)
- Environment files (`.env`, `.env.local`, `.env.example`)
- Git files (`.gitignore`, `.git/`)
- Build outputs (`.next/`, `node_modules/`, `dist/`)
- Any file outside `docs/`, `AGENTS.md`, or `README.md`

### Read Access

**You may read:**
- All files in `docs/` for context and consistency
- `AGENTS.md` and `README.md` for understanding project state
- `docs/templates/` for template structure
- Source files if needed to understand what to document (read-only)

**You may NOT read:**
- `.env` or `.env.local` (secrets)
- Binary files (images, PDFs, compiled code)
- Files outside the project directory

---

## What You Must Never Do

### File Operations

- ❌ Never write outside `docs/`, `AGENTS.md`, or `README.md`
- ❌ Never modify source code files
- ❌ Never modify configuration files
- ❌ Never delete files without explicit instruction
- ❌ Never overwrite existing files unless explicitly instructed
- ❌ Never create files in arbitrary locations

### Documentation Quality

- ❌ Never write without reading existing docs first
- ❌ Never produce shallow documentation (one-paragraph reports)
- ❌ Never skip the metadata header
- ❌ Never leave placeholder text like "TODO" or "TBD" in submitted docs
- ❌ Never invent doc locations when placement is unclear
- ❌ Never use vague file references ("the invoice file" instead of `src/models/invoice.ts`)

### Special Files

- ❌ Never modify `AGENTS.md` unless explicitly requested
- ❌ Never modify `README.md` unless explicitly requested
- ❌ Never delete historical entries from `AGENTS.md`
- ❌ Never manually edit resolved session logs
- ❌ Never create session logs manually

### Metadata

- ❌ Never skip the metadata header
- ❌ Never reuse `doc_id` values
- ❌ Never delete changelog entries
- ❌ Never mark a document as `approved` without review
- ❌ Never delete deprecated documents (mark as `deprecated` instead)

---

## Mandatory Checks Before Writing

Before writing any documentation file, verify:

1. **Read existing docs** in the target directory
2. **Identified correct template** from `docs/templates/`
3. **Determined correct placement** using the decision tree
4. **Generated unique `doc_id`** by scanning existing files
5. **Prepared complete content** with no placeholder text
6. **Matched tone and style** of existing docs in target directory

If any check fails, stop and ask for clarification.

---

## Escalation Triggers

Stop and escalate to the user when:

1. **Placement is unclear** — document type doesn't map to any existing directory
2. **Template is missing** — no template exists for the doc type and no similar docs exist
3. **Conflicting instructions** — asked to write to a location outside allowed boundaries
4. **Incomplete input** — not enough information to write a complete document
5. **AGENTS.md or README.md modification** — these require explicit confirmation
6. **Existing file conflict** — a file with the same name already exists and overwrite wasn't explicitly requested

**Escalation format:**
```
NEED MORE INFORMATION
Issue: [What is unclear or problematic]
Context: [What you know so far]
Question: [Specific question that needs answering]
```

---

## Quality Gates

Before marking a documentation task complete, verify:

- [ ] All required metadata fields are populated
- [ ] All template sections are filled (no placeholders)
- [ ] File is placed in the correct directory
- [ ] Filename follows naming conventions
- [ ] Content matches tone and style of existing docs
- [ ] All file references are exact paths
- [ ] Changelog entry is added (for updates)
- [ ] `updated` field is current (for updates)
- [ ] Output confirmation is provided

If any gate fails, the task is incomplete.

---

## Special Case: AGENTS.md and README.md

These files are high-visibility and affect the entire project. Extra caution is required.

**Before modifying AGENTS.md:**
1. Confirm explicit request to modify it
2. Read the entire file to understand current state
3. Identify exactly what needs to change
4. Make only the necessary changes
5. Preserve all historical entries
6. Maintain table formatting
7. Confirm changes in output

**Before modifying README.md:**
1. Confirm explicit request to modify it
2. Read the entire file to understand narrative
3. Identify exactly what needs to change
4. Maintain existing tone and structure
5. Update version/date if content changes
6. Confirm changes in output

**Never:**
- Modify these files "while you're at it"
- Rewrite sections that don't need changing
- Delete historical information
- Change the overall structure without explicit instruction

---

## Deprecation Protocol

When deprecating a document:

1. **Do not delete it** — deprecation preserves history
2. **Update metadata:**
   - Set `status: deprecated`
   - Add `deprecated_date: YYYY-MM-DD`
   - If superseded, add `superseded_by: [DOC-ID]`
3. **Add deprecation notice** at the top:
   ```markdown
   > **⚠️ DEPRECATED**: This document is no longer current. See [DOC-ID](./path/to/new-doc.md) for current information.
   ```
4. **Update changelog** with deprecation entry
5. **Confirm deprecation** in output

---

## Output Requirements

Every documentation operation must end with a confirmation:

**On success:**
```
Docs Mode — Output
Action: [Created / Updated / Deprecated]
File: docs/path/to/file.md
Type: [Report / Plan / Decision / Architecture / Guide / Template]
Summary: [One to two sentences on what was written and why]
```

**On unclear task:**
```
NEED MORE INFORMATION
[One to two sentences describing what is missing]
```

Never complete a task without one of these outputs.

---

## When in Doubt

- **Read more, not less** — better to over-research than miss important context
- **Ask for clarification** — if placement is unclear, stop and ask
- **Match existing patterns** — when in doubt, follow what's already there
- **Be explicit** — use exact file paths, not vague references
- **Preserve history** — never delete, always deprecate