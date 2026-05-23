# Refactor Mode: Refactor Workflow

**Purpose**: Defines the step-by-step process for planning and executing code refactors.

---

## Refactor Process

### 1. Understand the Goal
Read refactor request, identify what changes and what stays stable:
- What is being changed (files, modules, patterns, structures)
- Why it needs to change (problem solved, improvement made)
- What must remain stable (interfaces, exports, API contracts, behavior)
- Success criteria and constraints

### 2. Respect the Defined Scope
Internalize boundaries set in task. Work within defined limits.

**When scope feels insufficient:**
- Change is trivially small
- Root cause lies outside scope
- Plan would leave inconsistencies

**If scope needs expanding:** Stop, document discovery, explain insufficiency, propose expansion, wait for confirmation.

### 3. Explore Proportionally
- **Targeted (1-3 files):** Read files + direct dependencies
- **Module (4-10 files):** Read module, exports, consumers
- **Cross-module (10+ files):** Map dependency graph, identify affected areas

Resist over-exploration: Don't read entire codebase, follow every import, or analyze unrelated modules.

### 4. Escalate Before Over-Reaching
Stop and escalate when: planned change trivial, root cause elsewhere, would leave inconsistencies, structural blocker discovered.

**Format:**
```
SCOPE CONCERN
Current scope: [specified]
Discovery: [found]
Problem: [why insufficient]
Proposed expansion: [needed]
Rationale: [why necessary]
```

### 5. Plan Change Sequence
**Standard order:** Shared utilities → Interfaces → Consumers → Tests

**Special considerations:** Renaming (atomic updates), moving files (update imports first), changing signatures (update call sites first), extracting code (create new before removing old).

### 6. Apply Changes Systematically
Work through sequence one step at a time. Make only relevant changes. Don't fix unrelated bugs, reformat unrelated code, or improve outside scope. Complete each step before next.

### 7. Verify as You Go
After each change: imports resolve, calls match signatures, types valid, no circular dependencies, tests compile. Fix breaks immediately.

### 8. Track Every Change
Maintain running log: Files Modified/Created/Deleted, Decisions Made, Risks Identified, Follow-up Items.

---

## Workflow Summary

1. Understand goal → 2. Respect scope → 3. Explore proportionally → 4. Escalate before over-reaching → 5. Plan sequence → 6. Apply systematically → 7. Verify → 8. Track changes → 9. Generate report → 10. Confirm completion

---

## Common Refactor Patterns

**Rename:** Search references → Update atomically → Rename definition → Verify

**Extract:** Create new location → Update original to call new → Update tests → Verify

**Move File:** Create at new location → Update imports → Delete old → Verify

**Split Module:** Create new modules → Update original → Update consumers → Remove extracted → Verify

**Merge Modules:** Copy to target → Update imports → Delete sources → Verify