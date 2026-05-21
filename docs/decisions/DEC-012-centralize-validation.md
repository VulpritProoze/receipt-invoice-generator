# ADR-012: Centralize API Input Validation with Schema Registry

---

doc_id: DEC-012
title: Centralize API Input Validation with Schema Registry
version: 1.0.0
status: accepted
created: 2026-05-21
updated: 2026-05-21
author: Code Agent
reviewers: none
tags: validation, schemas, api, architecture
changelog:
  - version: 1.0.0
    date: 2026-05-21
    author: Code Agent
    note: Initial decision record

---

## Status

**Accepted** — Implemented in MVP phase

## Context

Prior to this decision, API route handlers in `src/app/api/` performed manual input validation using explicit field checks:

```typescript
const requiredFields = ['userID', 'invoiceDate', 'terms', ...];
const missingFields = requiredFields.filter(
  (field) =>
    body[field] === undefined ||
    body[field] === null ||
    (typeof body[field] === 'string' && body[field].trim() === '')
);
```

This approach had several problems:

1. **Duplication**: Validation logic was duplicated across multiple route handlers
2. **Inconsistency**: Different routes validated the same fields differently
3. **Maintenance burden**: Schema changes required updating validation in multiple places
4. **Type safety gap**: Manual checks didn't leverage TypeScript types or Zod schemas
5. **Error messages**: Inconsistent error response formats across routes

The project already had Zod schemas in `src/models/` defining the shape and constraints of domain entities (Invoice, Receipt, User, Company). However, these schemas included auto-generated fields (IDs, timestamps) that should not be present in request payloads.

## Decision

We will create a centralized schema registry in `src/schemas/` that:

1. **Exports request-specific schemas** derived from domain models, omitting auto-generated fields
2. **Provides a single import point** for all validation schemas used by API routes
3. **Uses Zod's `.safeParse()`** for all request body validation
4. **Returns structured error details** using Zod's `.flatten()` method

### Implementation Structure

```
src/schemas/
├── index.ts                 # Central export point
├── invoice.schema.ts        # Invoice request schemas
└── receipt.schema.ts        # Receipt request schemas
```

### Schema Derivation Pattern

Request schemas are derived from domain schemas using Zod's `.omit()` and `.extend()`:

```typescript
// src/schemas/invoice.schema.ts
import { invoiceSchema } from '@/models/invoice';

export const invoiceCreateRequestSchema = invoiceSchema.omit({
  invoiceID: true,    // Generated server-side
  createdAt: true     // Generated server-side
});
```

### Route Handler Pattern

All route handlers follow this validation pattern:

```typescript
import { invoiceCreateRequestSchema } from '@/schemas';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const result = invoiceCreateRequestSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Invalid invoice data',
        details: result.error.flatten()
      },
      { status: 400 }
    );
  }
  
  // Use result.data (validated and typed)
  const validatedData = result.data;
  // ...
}
```

## Consequences

### Positive

- **Single source of truth**: Validation logic lives in one place per entity type
- **Type safety**: Request data is validated and typed in one step
- **Consistent errors**: All routes return the same error structure
- **Easier maintenance**: Schema changes propagate automatically to all routes
- **Better DX**: Developers import from `@/schemas` and get autocomplete for all schemas
- **Testability**: Schemas can be tested independently of route handlers

### Negative

- **Additional abstraction layer**: Introduces `src/schemas/` as a new concept
- **Learning curve**: Developers must understand the difference between domain schemas (`src/models/`) and request schemas (`src/schemas/`)
- **Potential confusion**: Two schema locations could be confusing initially

### Neutral

- **No breaking changes**: External API contracts remain unchanged
- **Incremental adoption**: Can be applied to new routes immediately, existing routes migrated over time

## Alternatives Considered

### Alternative 1: Keep manual validation

**Rejected** because it doesn't scale and creates maintenance burden.

### Alternative 2: Use domain schemas directly in routes

**Rejected** because domain schemas include auto-generated fields that should not be in request payloads. Accepting them would require additional filtering logic in every route.

### Alternative 3: Use a validation library other than Zod

**Rejected** because Zod is already in use for domain models, and introducing a second validation library would increase bundle size and cognitive load.

## Implementation Notes

### Files Created

- `src/schemas/index.ts` — Central export point
- `src/schemas/invoice.schema.ts` — Invoice request schemas
- `src/schemas/receipt.schema.ts` — Receipt request schemas

### Files Modified

- `src/app/api/invoices/route.ts` — Replaced manual validation with `invoiceCreateRequestSchema`
- `src/app/api/receipts/route.ts` — Replaced manual validation with `receiptCreateRequestSchema`

### Migration Checklist

- [x] Create schema registry structure
- [x] Define request schemas for Invoice
- [x] Define request schemas for Receipt
- [x] Update invoices route handler
- [x] Update receipts route handler
- [ ] Add schema tests (deferred to post-MVP)
- [ ] Document schema extension pattern for future entities

## References

- Zod documentation: https://zod.dev
- Related: DEC-010 (API validation choice)
- Implementation: See `src/schemas/` directory

## Review Notes

This decision was implemented as part of the MVP phase (T1: Centralize input validation). No formal review process was conducted as this is an internal architectural improvement with no external API changes.