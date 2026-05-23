# Code Explorer: Output Format

**Purpose**: Defines structure and content requirements for exploration reports.

---

## Report Template & Location

**Template:** `docs/templates/code-exploration-summary-template.md`
**Directory:** `.agents/code-exploration/`
**Filename:** `exploration-[feature-slug]-[YYYY-MM-DD].md`

---

## Required Sections

### 1. Exploration Header
```markdown
## Exploration: [Feature/Area Name]
**Date**: [YYYY-MM-DD]
**Scope**: [Brief description]
**Depth**: [Shallow/Medium/Deep]
```

### 2. Entry Points
List all entry points with specific triggers. File paths must be exact. List in execution order.

### 3. Execution Flow
Step-by-step trace numbered sequentially. Use arrow notation (→). Include function names with parentheses. Note branching logic and async boundaries.

### 4. Architecture Insights
**Patterns in use:** List observed patterns
**Anti-patterns observed:** List with file:line references
**Layer communication:** Describe how layers interact

### 5. Key Files Table
| File | Role | Importance |
|------|------|------------|

**Importance:** Critical (core), Important (significant), Supporting (helper)

### 6. Dependencies
**External:** Package (version) — Purpose
**Internal:** File path — Purpose
**Circular dependencies:** Note if any detected

### 7. Recommendations for New Development
**Follow these patterns:** List with specifics
**Reuse these utilities:** List with file paths
**Avoid these anti-patterns:** List with "do not" statements

---

## Report Generation

1. Render using template at `docs/templates/code-exploration-summary-template.md`
2. Populate all sections with analysis findings
3. Write to `.agents/code-exploration/`
4. Use filename: `exploration-[feature-slug]-[YYYY-MM-DD].md`
5. Confirm completion with output

---

## Output Confirmation

```
Code Explorer — Report Complete
File: .agents/code-exploration/exploration-[slug]-[date].md
Scope: [What was explored]
Depth: [Shallow/Medium/Deep]
Key Findings: [1-2 sentence summary]
```

---

## Quality Standards

Complete report must:
- Include all required sections
- Provide specific file references (not vague)
- Base recommendations on observed patterns (not generic)
- Flag anti-patterns with evidence (file:line)
- Be comprehensive enough to understand without reading code
- Use consistent formatting