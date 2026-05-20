# Agent Rule Prompt: Documentation Protocol

**File**: `.agents/rules/documentation-protocol.md`
**Scope**: All agents. Applies whenever a file in `docs/` is created, read, updated, or should exist but doesn't.
**Priority**: High — documentation is not optional and is not written after the code is done.

---

## Role

You are an agent operating inside the BillGen repository. You treat documentation as a first-class deliverable — not commentary on the code, not an afterthought, not something another agent or human will "fill in later." When you build something, you document it in the same session. When you make a decision, you write the record before the code that implements it. When you end a session, the docs reflect the current state of the project — not the state it was in two sessions ago.

Read and internalize every rule in this file before touching anything in `docs/`.

---

## Rule 1: Documentation Is Part of the Work — Not After It

Documentation and code are written together. A phase is not complete until its documentation is written, accurate, and up to date.

**This means, concretely:**

- When you create a module in `src/modules/`, you create or update its architecture doc in `docs/architecture/` in the same session.
- When you make a dependency decision, you write the ADR in `docs/decisions/` _before_ you install the package.
- When you add a new environment variable to the code, you add it to `docs/getting-started/env-setup.md` before the session ends.
- When you run the test suite, the test report exists in `docs/reports/test-reports/` before the session ends.
- When you complete a phase, the phase log in `AGENTS.md` is updated before the session ends.

**"I'll document it later" is a rule violation.** Later never comes. Undocumented decisions are re-litigated. Undocumented modules are misunderstood. Undocumented env vars block the next person who tries to deploy. Document now.

---

## Rule 2: Every Documentation File Requires the Metadata Header

Every Markdown file created in `docs/` begins with an H1 title followed immediately by this metadata block. No exceptions.

```yaml
---
doc_id:
  [unique identifier — ARCH-001, DEC-003, GS-005, PLAN-002, REP-TEST-012, etc.]
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

**Rules for each field:**

- `doc_id` must be globally unique across the entire `docs/` directory. Scan existing files before assigning one.
- `version` uses semantic versioning: **patch** (x.x.N) for typo fixes and minor corrections; **minor** (x.N.0) for new sections, structural changes, or significant rewrites of existing sections; **major** (N.0.0) for complete rewrites that change the document's core content or purpose.
- `status` must reflect reality. A document that is wrong is not `approved`. A document no longer relevant must be marked `deprecated`, not left to rot.
- `updated` changes every time the file is modified.
- `changelog` is append-only. You never overwrite or delete prior changelog entries — they are the document's version history.

A doc file without this header is incomplete. It must not be referenced as done in `AGENTS.md`.

---

## Rule 3: Use the Correct Template for Each Subfolder

`docs/templates/` contains a template for every `docs/` subfolder. Always start from the correct template. Do not improvise a structure — the templates exist so that all documents in a subfolder are consistent and machine-readable by subsequent agents.

| Target subfolder             | Template to use                              |
| ---------------------------- | -------------------------------------------- |
| `docs/architecture/`         | `docs/templates/architecture-template.md`    |
| `docs/reports/`              | `docs/templates/report-template.md`          |
| `docs/reports/test-reports/` | `docs/templates/test-report-template.md`     |
| `docs/plans/`                | `docs/templates/plan-template.md`            |
| `docs/decisions/`            | `docs/templates/adr-template.md`             |
| `docs/getting-started/`      | `docs/templates/getting-started-template.md` |

If a document does not cleanly fit any subfolder: surface the ambiguity in `AGENTS.md` rather than guessing. The wrong subfolder means the wrong template, the wrong `doc_id` format, and confusion for every agent after you.

---

## Rule 4: Architecture Docs Stay Current With the Code

Every module in `src/modules/` has a corresponding architecture doc in `docs/architecture/`. That doc reflects the _current_ state of the module — not the state it was in when first written.

**When a module changes, the architecture doc must change in the same session.**

What constitutes a change requiring a doc update:

- New fields on a data model or Zod schema.
- New API routes or changed route behavior.
- New sub-components extracted or added.
- Changed data flow (how data enters, transforms, or exits the module).
- New external dependencies.
- New known limitations or technical debt introduced.

**An architecture doc that has drifted from the code is worse than no architecture doc.** A missing doc tells the next agent "this isn't documented." A wrong doc tells the next agent "I understand this" — and then they act on wrong information.

An architecture doc must cover:

- What the module does and why it exists in this project.
- Its responsibilities: what it owns and what it delegates.
- Its interfaces: inputs, outputs, and external dependencies (with references to ADRs for dependency choices).
- Its data flow: how data enters the module, is transformed, and exits — described in enough detail that someone reading cold can trace a request through it.
- Key design decisions: referenced by ADR identifier.
- Known limitations or deferred work.

---

## Rule 5: ADRs Are Written Before the Code They Describe

An Architecture Decision Record (ADR) documents a significant decision. It is written before the code that implements the decision — not afterward as a rationalization.

**When to write an ADR (mandatory):**

- Choosing any npm package (especially over alternatives that were considered).
- Choosing a data storage pattern, key structure, or schema shape that is non-obvious.
- Deviating from a convention used elsewhere in the codebase.
- Accepting a known limitation or technical trade-off.
- Explicitly choosing not to implement something that would normally be expected (e.g., "no authentication in v1").
- Changing a decision that was previously documented (which creates a new ADR that supersedes the old one).

**ADR IDs** use the format `DEC-NNN` (three digits, zero-padded). Check `docs/decisions/` for the next available number before creating.

**ADR status lifecycle:** `proposed` → `accepted` → (optionally: `deprecated` | `superseded by DEC-NNN`)

When an ADR is superseded: update its `status` to `superseded`, add `superseded_by: DEC-NNN` to the metadata, update `updated`, and add a changelog entry. The original ADR is never deleted — it is part of the decision history.

---

## Rule 6: The Session Log in AGENTS.md Is Append-Only and Mandatory

At the close of every session (triggered by the `session-end` hook via the `docs-updater` skill), a session log entry is appended to `AGENTS.md` under `## Session Log`.

**Format:**

```markdown
### Session: [ISO 8601 timestamp]

**Agent**: [identifier]
**Session focus**: [one sentence]
**Files changed**:

- `[path]` — [brief reason]
  **Docs updated**:
- `[path]` — [what changed]
- (or "None — [reason]")
  **Phase log changes**: [list, or "None"]
  **ADRs created or updated**: [list, or "None"]
  **Open items added**: [list, or "None"]
  **Notes**: [anything the next agent needs to know]
```

The session log is **append-only**. Prior entries are never edited or deleted. They are the project's runtime history — the record of what happened, in what order, and why.

---

## Rule 7: Documentation Quality Standards

Every doc you write must meet these standards:

**Written for a reader with no context.** The next agent reading this doc has no memory of your session, no access to your reasoning, and no prior knowledge of this project beyond what is written. Write for that agent.

**No placeholder text in submitted docs.** "TODO: fill this in" or "Lorem ipsum" are not acceptable in a doc marked anything other than `draft`. If a section genuinely cannot be completed yet, mark it `[Pending: description of what is missing and why]` — and add the gap to `AGENTS.md` as an open item.

**No excessive brevity.** A three-bullet architecture doc is not an architecture doc. Sections must contain enough information to be actionable by a reader who was not in the room when the code was written.

**No verbatim code copying as a substitute for prose.** You can reference a file (`see src/models/invoice.ts`) but you do not reproduce the TypeScript interface in the doc and call it documentation. Describe the shape, purpose, and constraints in prose.

**Accurate cross-references.** Every link to another doc must resolve. If you link to a file that does not exist yet, mark it `[forthcoming: DOC-ID]` — do not link to a nonexistent file as if it exists.

**No stale docs.** A doc that accurately described the module two months ago but does not describe it now is harmful documentation. The architecture doc rule (Rule 4) exists to prevent this. The `docs-updater` skill enforces it at session end.

---

## How This Rule Is Enforced

- The `session-end` hook triggers `docs-updater`, which evaluates seven specific questions about whether documentation needs updating based on what changed this session.
- `docs-updater` will flag any doc file missing its metadata header and refuse to mark the session clean until it is added.
- `docs-updater` will auto-draft an ADR (marked `proposed`) for any dependency added this session with no corresponding ADR, then add it to `AGENTS.md` open items for review.
- A phase cannot be marked `✅ Complete` in the phase log unless all documentation conditions are met (see the `agent-communication` rule for the full phase completion checklist).
