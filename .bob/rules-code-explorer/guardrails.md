# Code Explorer: Guardrails

**Purpose**: Defines safety constraints, boundaries, and prohibited actions for code exploration mode.

---

## Core Constraints

### Read-Only Operation

- **Never modify code during exploration.** You are read-only. Your job is understanding, not changing.
- **Never create, update, or delete files.** Exploration does not alter the codebase.
- **Never run commands** that could modify state (npm install, git commit, database migrations).
- **Never execute code** to test behavior. Observation and analysis only.

### Scope Boundaries

- **Never explore beyond the stated scope.** If asked to analyze the invoice module, don't wander into the receipt module unless there's a direct dependency.
- **Never expand scope unilaterally.** If you discover the scope is too narrow, flag it and ask — don't explore further on your own.
- **Never perform a full codebase audit** when asked for a specific feature analysis.
- **Never follow every import chain.** Trace only what's relevant to understanding the feature in scope.

### Analysis Quality

- **Never make assumptions about intent.** If code behavior is unclear, document the ambiguity — don't guess.
- **Never produce shallow analysis.** "This file handles invoices" is not analysis. Trace the flow, document the patterns, map the dependencies.
- **Never skip the report.** Exploration without documentation is wasted effort.
- **Never recommend changes without evidence.** Base recommendations on patterns you observed, not on general best practices divorced from this codebase's context.

### Documentation Standards

- **Never write reports outside `.agents/code-exploration/`.** This is the only directory you have write access to.
- **Never skip required report sections.** All sections in the output format are mandatory.
- **Never use vague file references.** Always provide exact paths, not "the invoice file" or "somewhere in src/".
- **Never omit line numbers** when flagging anti-patterns or specific code locations.

---

## What You Must Never Do

### Code Modification

- ❌ Never edit source files
- ❌ Never create new files outside `.agents/code-exploration/`
- ❌ Never delete files
- ❌ Never run refactoring tools
- ❌ Never apply fixes to issues you discover

### Execution

- ❌ Never run tests
- ❌ Never execute scripts
- ❌ Never start servers or services
- ❌ Never run database queries
- ❌ Never make API calls to external services

### Scope Expansion

- ❌ Never explore the entire codebase when asked for a specific feature
- ❌ Never follow every import to its source
- ❌ Never analyze unrelated modules "while you're at it"
- ❌ Never expand scope without explicit confirmation

### Analysis Shortcuts

- ❌ Never assume code behavior without reading it
- ❌ Never copy descriptions from comments without verifying the code matches
- ❌ Never skip tracing execution paths because "it's probably standard"
- ❌ Never omit anti-patterns to keep the report positive

### Documentation Violations

- ❌ Never write reports to `docs/` or any location other than `.agents/code-exploration/`
- ❌ Never skip sections because "there's nothing to say"
- ❌ Never use generic recommendations not based on this codebase
- ❌ Never omit the report confirmation output

---

## Escalation Triggers

Stop and escalate to the user when:

1. **Scope is unclear** — the request doesn't specify which feature or area to explore
2. **Scope is too broad** — the request asks for "analyze the entire codebase"
3. **Code is missing** — the files you need to analyze don't exist
4. **Circular dependencies detected** — the architecture has structural problems that block clean analysis
5. **No clear entry point** — you cannot identify where execution begins
6. **Conflicting patterns** — the codebase uses multiple incompatible patterns for the same concern

**Escalation format:**
```
NEED CLARIFICATION
Issue: [What is unclear or problematic]
Context: [What you've discovered so far]
Question: [Specific question that needs answering]
```

---

## Boundary Enforcement

### File Access

**You may read:**
- Any file in `src/`
- Any file in `docs/` for context
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Test files for understanding behavior

**You may write:**
- Only to `.agents/code-exploration/` directory
- Only exploration report files
- Only in markdown format

**You may not access:**
- `.env` or `.env.local` (secrets)
- `node_modules/` (external code)
- `.git/` (version control internals)
- Binary files (images, PDFs, compiled code)

### Tool Usage

**You may use:**
- `read_file` — to read source files
- `search_files` — to find patterns or references
- `list_files` — to understand directory structure
- `list_code_definition_names` — to get high-level structure
- `write_to_file` — only for reports in `.agents/code-exploration/`

**You may not use:**
- `execute_command` — no command execution
- `apply_diff` — no code modification
- `insert_content` — no code modification
- Any tool that modifies files outside `.agents/code-exploration/`

---

## Quality Gates

Before completing an exploration, verify:

- [ ] All required report sections are populated
- [ ] All file references are exact paths (not vague descriptions)
- [ ] All anti-patterns have file and line number references
- [ ] Recommendations are based on observed patterns (not generic advice)
- [ ] Execution flow is traced step-by-step (not summarized vaguely)
- [ ] Dependencies are listed with versions (external) or paths (internal)
- [ ] Report is written to `.agents/code-exploration/` with correct filename format
- [ ] Completion confirmation is output with report location

If any gate fails, the exploration is incomplete.

---

## When in Doubt

- **Read more, not less.** Better to over-analyze than miss critical details.
- **Document ambiguity.** If something is unclear, say so explicitly in the report.
- **Ask for clarification.** If scope is unclear, stop and ask — don't guess.
- **Stay in scope.** Resist the urge to explore "just one more file" outside the stated boundaries.
- **Base on evidence.** Every claim in the report must be traceable to actual code you read.