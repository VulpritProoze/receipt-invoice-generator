# Refactor Mode: Guardrails

**Purpose**: Defines safety constraints, boundaries, and prohibited actions for refactor mode.

---

## Core Constraints

### Scope Boundaries
- Orchestrator's scope is your boundary
- Never expand scope unilaterally
- Never explore broadly when task is specific
- Never make changes outside refactor scope
- Never delete files without confirming no dependents
- Never rename exports without updating consumers
- Never skip the refactor report
- Document any deviations from plan

### Change Discipline
- Never fix unrelated bugs during a refactor
- Never reformat unrelated code
- Never improve things outside the scope
- Never add new features
- Never optimize performance outside scope
- Never update dependencies unless that's the goal

### Safety Requirements
- Never introduce breaking changes to public APIs without explicit instruction
- Never leave the codebase in a broken state between steps
- Never break tests without fixing them immediately
- Never introduce circular dependencies
- Never leave broken imports or references

---

## Mandatory Checks

### Before Starting
- [ ] Scope clearly defined
- [ ] Constraints understood (API stability, backward compatibility)
- [ ] Success criteria clear
- [ ] Change sequence planned

### After Each Change
- [ ] All imports resolve
- [ ] All function calls match signatures
- [ ] All type references valid
- [ ] No circular dependencies
- [ ] Tests still compile

### Before Completing
- [ ] All planned changes applied
- [ ] All broken references fixed
- [ ] Tests pass (or updates complete)
- [ ] Refactor report written
- [ ] Verification documented

---

## Escalation Triggers

Stop and escalate when:
1. Scope is insufficient — change would be trivial or leave inconsistencies
2. Root cause is elsewhere — problem in different module than specified
3. Plan is unsafe — would break contracts or introduce regressions
4. Structural blocker — dependency/architectural issue prevents refactor
5. Tests are missing — code being refactored has no test coverage
6. Breaking change required — refactor requires changing public APIs

**Format:**
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

**Before:** Run tests to establish baseline (or flag missing tests as risk)
**During:** Verify tests compile after each change; fix breaks immediately
**After:** Run full suite, document results, fix failures before completing

**Test Modification:** Update when behavior changes; understand failures before changing expectations; add tests for new code (or flag as follow-up)

---

## File Operation Safety

### Deleting
Before: Search imports, verify no references, check configs, confirm in scope
Never: Delete files with imports, referenced in config, or outside scope

### Renaming/Moving
Sequence: Create at new location → Update all imports → Verify resolution → Delete old
Never: Rename/move without updating imports or outside scope

---

## API Contract Safety

**Public APIs** (exported functions, route handlers, shared components):
- Never change signatures without updating call sites
- Never remove exports without confirming no usage
- Never change return types without updating consumers
- Never rename without updating references

**Internal APIs** (non-exported, private methods):
- Can change freely if module's public API stable
- Still verify no broken references within module
- Still document significant changes

---

## Quality Gates

Before completing, verify all items in "Before Completing" checklist above. If any gate fails, refactor is incomplete.

---

## When in Doubt

Stay in scope • Verify before proceeding • Document decisions • Escalate blockers • Preserve behavior