# Documentation Mode: Guardrails

**Purpose**: Defines safety constraints, boundaries, and prohibited actions for documentation mode.

---

## File Access Boundaries

**May write to:** `docs/` (all subdirectories), `AGENTS.md` (explicit request only), `README.md` (explicit request only)

**May NOT write to:** Source code, config files, env files, git files, build outputs, anything outside `docs/`/`AGENTS.md`/`README.md`

**May read:** All `docs/`, `AGENTS.md`, `README.md`, `docs/templates/`, source files (read-only for context)

**May NOT read:** `.env`/`.env.local`, binary files, files outside project

---

## What You Must Never Do

**File Operations:**
- ❌ Write outside `docs/`, `AGENTS.md`, `README.md`
- ❌ Modify source code or config files
- ❌ Delete files without explicit instruction
- ❌ Overwrite existing files unless explicitly instructed
- ❌ Create files in arbitrary locations

**Documentation Quality:**
- ❌ Write without reading existing docs first
- ❌ Produce shallow documentation
- ❌ Skip metadata header
- ❌ Leave placeholder text ("TODO", "TBD")
- ❌ Invent doc locations when unclear
- ❌ Use vague file references

**Special Files:**
- ❌ Modify `AGENTS.md`/`README.md` unless explicitly requested
- ❌ Delete historical entries from `AGENTS.md`
- ❌ Manually edit resolved session logs
- ❌ Create session logs manually

**Metadata:**
- ❌ Skip metadata header
- ❌ Reuse `doc_id` values
- ❌ Delete changelog entries
- ❌ Mark as `approved` without review
- ❌ Delete deprecated docs (mark as `deprecated`)

---

## Mandatory Checks Before Writing

1. Read existing docs in target directory
2. Identify correct template from `docs/templates/`
3. Determine correct placement using decision tree
4. Generate unique `doc_id` by scanning existing files
5. Prepare complete content (no placeholders)
6. Match tone and style of existing docs

If any check fails, stop and ask for clarification.

---

## Escalation Triggers

Stop and escalate when:
1. Placement unclear — doc type doesn't map to directory
2. Template missing — no template and no similar docs
3. Conflicting instructions — asked to write outside boundaries
4. Incomplete input — not enough info for complete doc
5. AGENTS.md/README.md modification — requires explicit confirmation
6. Existing file conflict — file exists, overwrite not requested

**Format:**
```
NEED MORE INFORMATION
Issue: [unclear/problematic]
Context: [known so far]
Question: [specific question]
```

---

## Quality Gates

Before completing, verify:
- [ ] All metadata fields populated
- [ ] All template sections filled
- [ ] File in correct directory
- [ ] Filename follows conventions
- [ ] Content matches tone/style
- [ ] All file references exact paths
- [ ] Changelog entry added (updates)
- [ ] `updated` field current (updates)
- [ ] Output confirmation provided

---

## Special Case: AGENTS.md and README.md

**Before modifying:** Confirm explicit request, read entire file, identify exact changes, make only necessary changes, preserve history/formatting, confirm in output.

**Never:** Modify "while you're at it", rewrite unchanged sections, delete historical info, change structure without instruction.

---

## Deprecation Protocol

1. Do not delete — preserves history
2. Update metadata: `status: deprecated`, add `deprecated_date`, add `superseded_by` if applicable
3. Add deprecation notice at top: `> **⚠️ DEPRECATED**: See [DOC-ID](./path.md)`
4. Update changelog
5. Confirm in output

---

## Output Requirements

**On success:**
```
Docs Mode — Output
Action: [Created/Updated/Deprecated]
File: docs/path/to/file.md
Type: [Report/Plan/Decision/Architecture/Guide/Template]
Summary: [1-2 sentences]
```

**On unclear:** `NEED MORE INFORMATION [description]`

---

## When in Doubt

Read more • Ask for clarification • Match existing patterns • Be explicit • Preserve history