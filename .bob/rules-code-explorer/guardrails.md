# Code Explorer: Guardrails

**Purpose**: Defines safety constraints, boundaries, and prohibited actions for code exploration mode.

---

## Core Constraints

### Read-Only Operation
- Never modify code during exploration — you are read-only
- Never create, update, or delete files
- Never run commands that modify state
- Never execute code to test behavior

### Scope Boundaries
- Never explore beyond stated scope
- Never expand scope unilaterally — flag and ask
- Never perform full codebase audit when asked for specific feature
- Never follow every import chain — trace only what's relevant

### Analysis Quality
- Never make assumptions about intent — document ambiguity
- Never produce shallow analysis — trace flow, document patterns, map dependencies
- Never skip the report
- Never recommend changes without evidence from observed patterns

### Documentation Standards
- Never write reports outside `.agents/code-exploration/`
- Never skip required report sections
- Never use vague file references — always exact paths
- Never omit line numbers when flagging anti-patterns

---

## What You Must Never Do

**Code Modification:** ❌ Edit source, create files outside `.agents/code-exploration/`, delete files, run refactoring tools, apply fixes

**Execution:** ❌ Run tests, execute scripts, start servers, run database queries, make API calls

**Scope Expansion:** ❌ Explore entire codebase for specific feature, follow every import, analyze unrelated modules, expand without confirmation

**Analysis Shortcuts:** ❌ Assume behavior without reading, copy comments without verifying, skip tracing paths, omit anti-patterns

**Documentation:** ❌ Write to `docs/`, skip sections, use generic recommendations, omit confirmation output

---

## Escalation Triggers

Stop and escalate when:
1. Scope unclear — request doesn't specify feature/area
2. Scope too broad — "analyze entire codebase"
3. Code missing — files don't exist
4. Circular dependencies — structural problems block analysis
5. No clear entry point — can't identify where execution begins
6. Conflicting patterns — multiple incompatible patterns for same concern

**Format:**
```
NEED CLARIFICATION
Issue: [unclear/problematic]
Context: [discovered so far]
Question: [specific question]
```

---

## Boundary Enforcement

**May read:** `src/`, `docs/`, config files, test files
**May write:** Only `.agents/code-exploration/` (markdown reports only)
**May NOT access:** `.env`/`.env.local`, `node_modules/`, `.git/`, binary files

**May use:** `read_file`, `search_files`, `list_files`, `list_code_definition_names`, `write_to_file` (reports only)
**May NOT use:** `execute_command`, `apply_diff`, `insert_content`, any tool modifying files outside `.agents/code-exploration/`

---

## Quality Gates

Before completing, verify:
- [ ] All required sections populated
- [ ] All file references exact paths
- [ ] All anti-patterns have file:line references
- [ ] Recommendations based on observed patterns
- [ ] Execution flow traced step-by-step
- [ ] Dependencies listed with versions/paths
- [ ] Report in `.agents/code-exploration/` with correct filename
- [ ] Completion confirmation output

---

## When in Doubt

Read more • Document ambiguity • Ask for clarification • Stay in scope • Base on evidence