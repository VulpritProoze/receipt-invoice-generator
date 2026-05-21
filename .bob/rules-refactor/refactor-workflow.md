# Refactor Mode: Refactor Workflow

**Purpose**: Defines the step-by-step process for planning and executing code refactors.

---

## Refactor Process

### 1. Understand the Goal

Read the refactor request carefully. Identify:
- **What is being changed** — specific files, modules, patterns, or structures
- **Why it needs to change** — the problem being solved or improvement being made
- **What must remain stable** — interfaces, exports, API contracts, test coverage, behavior

**Questions to answer:**
- Is this a structural refactor (moving/renaming) or a behavioral refactor (changing how it works)?
- Are there external consumers that depend on the current structure?
- What are the success criteria? How will we know the refactor is complete?
- Are there any constraints (backward compatibility, no breaking changes, etc.)?

### 2. Respect the Defined Scope

Before exploring anything, internalize the boundaries set in the task. The plan defines where you operate.

**Scope boundaries:**
- If the task targets specific files or modules, work only within those boundaries
- If the task describes a pattern to refactor, find all instances of that pattern but don't refactor unrelated code
- If the task has explicit constraints ("do not change public API"), treat those as hard limits

**When scope feels insufficient:**
- The change is trivially small and produces no real improvement
- The root cause lies outside the defined scope
- The plan would leave the codebase in an inconsistent state

**If scope needs expanding:**
1. Stop work
2. Document what you discovered
3. Explain why the current scope is insufficient
4. Propose the expanded scope
5. Wait for confirmation — do not proceed unilaterally

### 3. Explore Proportionally

Only explore as much of the codebase as the task demands.

**Exploration guidelines:**
- **Targeted refactor (1-3 files):** Read those files and their direct dependencies
- **Module refactor (4-10 files):** Read the module, its exports, and its consumers
- **Cross-module refactor (10+ files):** Map the dependency graph, identify all affected areas

**Resist over-exploration:**
- Do not read the entire codebase when the task is specific
- Do not follow every import chain to its source
- Do not analyze unrelated modules "while you're at it"

### 4. Escalate Before Over-Reaching

If during exploration you discover the solution is too narrow:

**Stop and escalate when:**
- The planned change would be trivial (< 10 lines changed)
- The root cause is in a different module than specified
- The refactor would leave inconsistencies elsewhere
- You discover a structural problem that blocks the refactor

**Escalation format:**
```
SCOPE CONCERN
Current scope: [What the task specified]
Discovery: [What you found during exploration]
Problem: [Why the current scope is insufficient]
Proposed expansion: [What additional scope is needed]
Rationale: [Why this expansion is necessary]
```

### 5. Plan Your Change Sequence

Determine the safest order to apply changes.

**Standard sequence:**
1. **Shared utilities first** — changes to code used by many consumers
2. **Interfaces before implementations** — update contracts before concrete code
3. **Consumers after providers** — update callers after the code they call
4. **Tests last** — update tests after the code they test

**Special considerations:**
- If renaming, update all references atomically (use search/replace)
- If moving files, update all imports before moving
- If changing signatures, update all call sites before changing the signature
- If extracting code, create the new location before removing from the old

**Write the sequence out:**
```
1. Create new utility function in src/lib/utils.ts
2. Update src/modules/invoices/invoiceService.ts to use new utility
3. Update src/modules/receipts/receiptService.ts to use new utility
4. Remove old duplicated code from both services
5. Update tests for both services
```

### 6. Apply Changes Systematically

Work through your sequence one step at a time.

**For each file:**
- Make only the changes relevant to the refactor
- Do not fix unrelated bugs
- Do not reformat unrelated code
- Do not improve things outside the scope
- Preserve existing behavior unless the refactor explicitly changes it

**Change discipline:**
- One logical change per commit (if committing incrementally)
- Complete each step before moving to the next
- Do not leave the codebase in a broken state between steps

### 7. Verify as You Go

After each significant change, verify dependent code still works.

**Verification checklist:**
- [ ] All imports still resolve correctly
- [ ] All function calls match updated signatures
- [ ] All type references are still valid
- [ ] No circular dependencies introduced
- [ ] Tests still compile (even if they need updating)

**If something breaks:**
- Fix it immediately before proceeding
- Do not accumulate breakage to fix later
- If the break is unexpected, reassess the change sequence

### 8. Track Every Change

Maintain a running log as you work.

**Log format:**
```
## Changes Made

### Files Modified
- `src/lib/utils.ts` — Added extractInvoiceItems() utility function
- `src/modules/invoices/invoiceService.ts` — Replaced inline extraction with utility call
- `src/modules/receipts/receiptService.ts` — Replaced inline extraction with utility call

### Files Created
- None

### Files Deleted
- None

### Decisions Made
- Chose to extract to src/lib/utils.ts rather than src/modules/shared/ because the utility is generic and not invoice-specific
- Kept the function name extractInvoiceItems() even though it's now generic, to maintain clarity at call sites

### Risks Identified
- The new utility function is not yet tested independently
- If invoice item structure changes, both services now depend on the same utility

### Follow-up Items
- Add unit tests for extractInvoiceItems()
- Consider renaming to extractItems() if used more broadly
```

---

## Workflow Sequence Summary

1. **Understand the goal** — what, why, and what stays stable
2. **Respect scope** — work within boundaries, escalate if insufficient
3. **Explore proportionally** — read only what's needed
4. **Escalate before over-reaching** — flag scope issues early
5. **Plan change sequence** — determine safe order of operations
6. **Apply changes systematically** — one step at a time, stay in scope
7. **Verify as you go** — check dependencies after each change
8. **Track every change** — maintain running log of all modifications
9. **Generate report** — document what was done and why
10. **Confirm completion** — output summary with report location

---

## Common Refactor Patterns

### Rename

**Sequence:**
1. Search for all references to old name
2. Update all references atomically
3. Rename the definition
4. Verify no broken references remain

### Extract Function/Module

**Sequence:**
1. Create new location with extracted code
2. Update original location to call new location
3. Update tests for both locations
4. Verify behavior unchanged

### Move File

**Sequence:**
1. Create file at new location (copy, don't move yet)
2. Update all imports to point to new location
3. Delete file at old location
4. Verify all imports resolve

### Split Module

**Sequence:**
1. Create new modules with extracted code
2. Update original module to import from new modules
3. Update external consumers to import from appropriate new module
4. Remove extracted code from original module
5. Verify all imports resolve and behavior unchanged

### Merge Modules

**Sequence:**
1. Copy code from modules being merged into target module
2. Update all imports to point to target module
3. Delete source modules
4. Verify all imports resolve and no duplicated code remains