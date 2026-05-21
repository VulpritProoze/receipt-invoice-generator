# Refactor Mode: Guardrails

**Purpose**: Defines safety constraints, boundaries, and prohibited actions for refactor mode.

---

## Core Constraints

### Scope Boundaries

- **The defined scope is your boundary.** You operate within it, not around it. Autonomy applies to how you execute, not how far you reach.
- **Never expand scope unilaterally.** If the task feels too narrow or the plan insufficient, surface it — do not absorb extra scope on your own initiative.
- **Never explore broadly when the task is specific.** Large codebase discovery is only justified when the plan explicitly requires it or when a narrow exploration reveals a structural dependency that cannot be resolved within the original scope.

### Change Discipline

- **Never make changes outside the refactor scope.** If you notice an unrelated bug or improvement, log it under risks or follow-ups — do not fix it inline.
- **Never fix unrelated bugs during a refactor.** Log them as follow-up items instead.
- **Never reformat unrelated code.** Only format code you're actively changing.
- **Never improve things outside the scope.** Resist the urge to "clean up while you're here."

### Safety Requirements

- **Never delete files without confirming they have no remaining dependents.** Check imports and references before any deletion.
- **Never rename exported symbols without updating all consumers.** A rename that breaks callers is not a refactor — it is a regression.
- **Never introduce breaking changes to public APIs without explicit instruction.** Internal refactoring is safe; external contract changes require confirmation.
- **Never leave the codebase in a broken state between steps.** Each change should leave the code in a compilable, runnable state.

---

## What You Must Never Do

### Scope Violations

- ❌ Never expand scope without explicit confirmation
- ❌ Never refactor "while you're at it" outside the defined boundaries
- ❌ Never explore the entire codebase when the task is specific
- ❌ Never absorb additional work discovered during exploration

### Change Violations

- ❌ Never fix unrelated bugs
- ❌ Never add new features
- ❌ Never reformat unrelated code
- ❌ Never optimize performance outside the refactor scope
- ❌ Never update dependencies unless that's the refactor goal

### Safety Violations

- ❌ Never delete files without checking for dependents
- ❌ Never rename without updating all references
- ❌ Never change public APIs without explicit instruction
- ❌ Never break tests without fixing them immediately
- ❌ Never introduce circular dependencies
- ❌ Never leave broken imports or references

### Process Violations

- ❌ Never skip the refactor report
- ❌ Never mark task complete without writing the report
- ❌ Never write the report before changes are complete
- ❌ Never skip verification steps
- ❌ Never proceed with unverified changes

---

## Mandatory Checks Before Proceeding

### Before Starting

- [ ] Scope is clearly defined
- [ ] Constraints are understood (API stability, backward compatibility, etc.)
- [ ] Success criteria are clear
- [ ] Change sequence is planned

### After Each Change

- [ ] All imports still resolve
- [ ] All function calls match signatures
- [ ] All type references are valid
- [ ] No circular dependencies introduced
- [ ] Tests still compile

### Before Completing

- [ ] All planned changes are applied
- [ ] All broken references are fixed
- [ ] Tests pass (or test updates are complete)
- [ ] Refactor report is written
- [ ] Verification is documented

---

## Escalation Triggers

Stop and escalate when:

1. **Scope is insufficient** — the planned change would be trivial or leave inconsistencies
2. **Root cause is elsewhere** — the problem is in a different module than specified
3. **Plan is unsafe** — following the plan would break contracts or introduce regressions
4. **Structural blocker** — a dependency or architectural issue prevents the refactor
5. **Tests are missing** — the code being refactored has no test coverage
6. **Breaking change required** — the refactor requires changing public APIs

**Escalation format:**
```
NEED CONFIRMATION
Issue: [What requires confirmation]
Context: [What you discovered]
Proposed action: [What you want to do]
Risk: [What could go wrong]
Alternative: [What else could be done]
```

---

## Testing Requirements

### Before Refactoring

- **If tests exist:** Run them to establish baseline
- **If tests don't exist:** Flag this as a risk in the report

### During Refactoring

- **After each significant change:** Verify tests still compile
- **If tests break:** Fix them immediately, don't accumulate breakage

### After Refactoring

- **Run full test suite:** Verify all tests pass
- **Document results:** Include in verification section of report
- **If tests fail:** Fix before marking complete

### Test Modification Rules

- **Update tests when behavior changes:** If the refactor changes behavior, update tests to match
- **Don't change test expectations arbitrarily:** If a test fails, understand why before changing it
- **Add tests for new code:** If you extract a new function, add tests for it (or flag as follow-up)

---

## File Operation Safety

### Deleting Files

**Before deleting:**
1. Search for all imports of the file
2. Verify no remaining references
3. Check if file is referenced in configs (tsconfig, jest, etc.)
4. Confirm deletion is part of the refactor scope

**Never delete:**
- Files with remaining imports
- Files referenced in configuration
- Files outside the refactor scope

### Renaming Files

**Sequence:**
1. Create file at new location (copy, don't move)
2. Update all imports to point to new location
3. Verify all imports resolve
4. Delete file at old location

**Never:**
- Rename without updating imports
- Assume IDE will update all references
- Rename files outside the refactor scope

### Moving Files

**Sequence:**
1. Create file at new location
2. Update all imports
3. Update any path references in configs
4. Verify everything resolves
5. Delete old file

**Never:**
- Move without updating imports
- Move files outside the refactor scope
- Assume relative imports will still work

---

## API Contract Safety

### Public APIs

**What counts as public:**
- Exported functions, classes, types from modules
- API route handlers
- React components used by other modules
- Utility functions imported by multiple files

**Rules:**
- **Never change signatures** without updating all call sites
- **Never remove exports** without confirming no external usage
- **Never change return types** without updating consumers
- **Never rename** without updating all references

### Internal APIs

**What counts as internal:**
- Non-exported functions
- Private class methods
- Module-internal utilities

**Rules:**
- **Can change freely** as long as module's public API is stable
- **Still verify** no broken references within the module
- **Still document** significant changes in the report

---

## Quality Gates

Before marking a refactor complete, verify:

- [ ] All planned changes are applied
- [ ] All imports resolve correctly
- [ ] All function calls match signatures
- [ ] All type references are valid
- [ ] No circular dependencies introduced
- [ ] Tests pass (or test updates are complete)
- [ ] No broken references remain
- [ ] Refactor report is written and complete
- [ ] Verification is documented in report
- [ ] Output confirmation is provided

If any gate fails, the refactor is incomplete.

---

## When in Doubt

- **Stay in scope.** If you're unsure whether something is in scope, assume it's not and ask.
- **Verify before proceeding.** If you're unsure whether a change is safe, verify it before moving on.
- **Document decisions.** If you make a non-obvious choice, document it in the report.
- **Escalate blockers.** If you hit a structural problem, escalate rather than working around it.
- **Preserve behavior.** If you're unsure whether behavior should change, preserve it and ask.