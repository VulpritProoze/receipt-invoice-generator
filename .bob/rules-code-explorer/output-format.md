# Code Explorer: Output Format

**Purpose**: Defines the structure and content requirements for exploration reports.

---

## Report Template

Use the **Code Exploration Summary Template** at `docs/templates/code-exploration-summary-template.md` as your structural guide.

---

## Required Sections

### 1. Exploration Header

```markdown
## Exploration: [Feature/Area Name]

**Date**: [YYYY-MM-DD]
**Scope**: [Brief description of what was explored]
**Depth**: [Shallow/Medium/Deep]
```

### 2. Entry Points

List all identified entry points with how they are triggered:

```markdown
### Entry Points
- `src/app/api/invoices/route.ts` — POST request to create invoice
- `src/app/invoices/page.tsx` — User navigates to /invoices
- `src/modules/invoices/invoiceService.ts` — Called by API route
```

**Requirements:**
- File path must be exact and clickable
- Trigger description must be specific (not "user action" but "user clicks Generate Invoice button")
- List in order of typical execution flow

### 3. Execution Flow

Step-by-step trace of execution from entry to completion:

```markdown
### Execution Flow
1. User submits invoice form → `POST /api/invoices`
2. Route handler validates request body with `invoiceSchema.safeParse()`
3. If valid, calls `invoiceService.createInvoice(data)`
4. Service generates invoice ID using `generateInvoiceID()`
5. Service writes to database via `db.invoices.create()`
6. Returns invoice object to route handler
7. Route handler returns 201 with invoice data
```

**Requirements:**
- Number each step sequentially
- Use arrow notation (→) for transitions
- Include function/method names with parentheses
- Note branching logic (if/else, switch, try/catch)
- Mark async boundaries explicitly
- Include error paths if significant

### 4. Architecture Insights

Document patterns, abstractions, and architectural observations:

```markdown
### Architecture Insights

**Patterns in use:**
- Zod schemas for validation at API boundary
- Service layer pattern for business logic
- Repository pattern for data access (via `src/lib/db/`)

**Anti-patterns observed:**
- Direct database access in route handler at `src/app/api/users/route.ts:45`
- Validation logic duplicated between client and server

**Layer communication:**
- API → Service: Direct function import
- Service → Data: Through abstraction layer (`src/lib/db/`)
- UI → API: Fetch calls from client components
```

**Requirements:**
- Separate patterns from anti-patterns
- Provide file references with line numbers for anti-patterns
- Describe layer communication explicitly
- Note any tight coupling or circular dependencies

### 5. Key Files Table

Tabular summary of important files:

```markdown
### Key Files
| File | Role | Importance |
|------|------|------------|
| `src/models/invoice.ts` | Zod schema and TypeScript type | Critical |
| `src/modules/invoices/invoiceService.ts` | Business logic for invoices | Critical |
| `src/lib/db/invoices.ts` | Database access layer | Critical |
| `src/app/api/invoices/route.ts` | API endpoint handler | Important |
| `src/lib/idGenerator.ts` | Utility for ID generation | Supporting |
```

**Importance levels:**
- **Critical**: Core to the feature, changes here affect everything
- **Important**: Significant role, changes here affect multiple areas
- **Supporting**: Helper or utility, changes here are localized

### 6. Dependencies

Map both external and internal dependencies:

```markdown
### Dependencies

**External:**
- `zod` (v3.22.4) — Schema validation
- `@upstash/redis` (v1.28.0) — Data storage
- `next` (v14.1.0) — Framework

**Internal:**
- `src/models/invoice.ts` — Schema and types
- `src/lib/db/invoices.ts` — Data access
- `src/lib/idGenerator.ts` — ID generation utility
- `src/modules/invoices/invoiceService.ts` — Business logic

**Circular dependencies:** None detected
```

**Requirements:**
- List external packages with versions
- List internal modules with file paths
- Note any circular dependencies explicitly
- Group by type (external vs. internal)

### 7. Recommendations for New Development

Actionable guidance based on observed patterns:

```markdown
### Recommendations for New Development

**Follow these patterns:**
- Use Zod schemas for all API input validation
- Keep business logic in service modules under `src/modules/`
- Access database only through `src/lib/db/` abstraction layer
- Co-locate tests with source files using `.test.ts` suffix

**Reuse these utilities:**
- `src/lib/idGenerator.ts` for generating unique IDs
- `src/lib/maskCreditCard.ts` for sensitive data masking
- `src/lib/db/` modules for database operations

**Avoid these anti-patterns:**
- Do not access database directly from route handlers
- Do not duplicate validation logic between client and server
- Do not mix business logic with data access code
```

**Requirements:**
- Base recommendations on actual observed patterns
- Provide specific file references for reusable utilities
- Flag anti-patterns with clear "do not" statements
- Keep recommendations actionable and concrete

---

## Report Generation Process

1. **Render the report** using the template at `docs/templates/code-exploration-summary-template.md`
2. **Populate all sections** with gathered information from analysis
3. **Write to `.agents/code-exploration/`** directory
4. **Use filename format**: `exploration-[feature-slug]-[YYYY-MM-DD].md`
   - Example: `exploration-invoice-creation-2026-05-21.md`
5. **Confirm completion** with report location in output

---

## Output Confirmation Format

After writing the report, output:

```
Code Explorer — Report Complete
File: .agents/code-exploration/exploration-[slug]-[date].md
Scope: [What was explored]
Depth: [Shallow/Medium/Deep]
Key Findings: [1-2 sentence summary of most important insights]
```

---

## Quality Standards

**A complete report must:**
- Include all required sections
- Provide specific file references (not vague descriptions)
- Base recommendations on observed patterns (not generic best practices)
- Flag anti-patterns with evidence (file and line number)
- Be comprehensive enough that someone can understand the feature without reading the code
- Use consistent formatting and markdown syntax