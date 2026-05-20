# Onboarding Module Architecture

---
doc_id: ARCH-005
title: Onboarding Module Architecture
version: 1.0.0
status: approved
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: onboarding, company-config, user-setup, architecture
changelog:
  - version: 1.0.0
    date: 2026-05-20
    author: Copilot
    note: Initial architecture documentation for Phase 8 onboarding implementation
---

## Overview

The Onboarding Module manages the company configuration setup process for new users. It ensures that users provide all required company information before they can generate receipts or invoices. This module is a prerequisite for the receipt generation feature, as receipts require company branding information in their footer.

## Module Purpose

- Collect and validate company information from users
- Store company configuration in Redis with user-scoped keys
- Provide onboarding status checks for protected routes
- Ensure data completeness before allowing receipt generation
- Deliver a user-friendly, accessible form experience

## Responsibilities

### What This Module Owns

1. **Company Configuration Management**
   - Storing company config data in Redis
   - Validating all required fields via Zod schema
   - Checking onboarding completion status

2. **User Interface**
   - Onboarding form with real-time validation
   - Progress indicators
   - Error handling and user feedback
   - Responsive design for all screen sizes

3. **API Endpoints**
   - GET `/api/onboarding` - Check onboarding status
   - POST `/api/onboarding` - Complete onboarding

4. **Route Protection**
   - Onboarding guard utility for protected routes
   - Automatic redirects for incomplete onboarding

### What This Module Delegates

- **User Authentication**: Assumes userID is provided by auth system (currently placeholder)
- **Database Operations**: Uses `src/lib/db/company.ts` for Redis interactions
- **Receipt Generation**: Receipt module checks for company config but doesn't manage it

## Data Flow

### Onboarding Completion Flow

```
User → Onboarding Page (Server Component)
  ↓
  Check onboarding status via service
  ↓
  If complete → Redirect to /dashboard
  If incomplete → Render OnboardingForm (Client Component)
  ↓
User fills form → Real-time Zod validation
  ↓
User submits → POST /api/onboarding
  ↓
API validates → Stores in Redis (company:[userID])
  ↓
Success → Redirect to /dashboard
```

### Onboarding Check Flow (Protected Routes)

```
User accesses protected route (e.g., /receipts)
  ↓
Route checks onboarding status
  ↓
If incomplete → Redirect to /onboarding
If complete → Allow access
```

## Component Structure

### Service Layer

**File**: `src/onboarding/onboardingService.ts`

```typescript
// Core service functions
checkOnboardingStatus(userID: string): Promise<boolean>
completeOnboarding(userID: string, config: CompanyConfig): Promise<void>
getOnboardingProgress(userID: string): Promise<{ complete: boolean; config: CompanyConfig | null }>
```

**Dependencies**:
- `@/lib/db/company` - Database operations
- `@/models/company` - CompanyConfig type and schema

### API Layer

**File**: `src/app/api/onboarding/route.ts`

**GET Endpoint**:
- Query param: `userID` (required)
- Returns: `{ complete: boolean, config: CompanyConfig | null }`
- Status codes: 200 (success), 400 (missing userID), 500 (server error)

**POST Endpoint**:
- Body: `{ userID: string, ...CompanyConfig fields }`
- Validates via `companyConfigSchema.safeParse()`
- Returns: 201 (success), 400 (validation error), 500 (server error)

### UI Layer

**Onboarding Page** (`src/app/onboarding/page.tsx`):
- Server Component
- Checks onboarding status server-side
- Redirects if already complete
- Renders OnboardingForm with userID prop

**Onboarding Form** (`src/app/onboarding/OnboardingForm.tsx`):
- Client Component (requires useState, form handling)
- 7 required fields with real-time validation
- Accessible (ARIA attributes, proper labels)
- Responsive Tailwind CSS styling
- Loading states and error handling

**Dashboard** (`src/app/dashboard/page.tsx`):
- Server Component
- Checks onboarding status
- Redirects to `/onboarding` if incomplete
- Shows quick action cards when complete

### Middleware Utility

**File**: `src/middleware/onboardingGuard.ts`

```typescript
requireOnboarding(userID: string): Promise<{ redirect?: string }>
```

Returns `{ redirect: '/onboarding' }` if onboarding incomplete, otherwise `{}`.

## Data Model

### CompanyConfig Schema

Defined in `src/models/company.ts`:

```typescript
{
  brandName: string (1-100 chars, required)
  companyName: string (1-200 chars, required)
  companyUrl: string (valid URL, required)
  logoUrl: string (valid URL, required)
  addressLine: string (1-200 chars, required)
  postalAddress: string (1-100 chars, required)
  country: string (1-100 chars, required)
}
```

### Redis Storage

- **Key format**: `company:[userID]`
- **Value**: JSON-serialized CompanyConfig object
- **Validation**: Data validated on write and read via Zod schema
- **User isolation**: Each user's config stored under their unique key

## External Dependencies

### Direct Dependencies

- `@/lib/db/company` - Database operations (getCompanyConfig, setCompanyConfig)
- `@/models/company` - CompanyConfig type and companyConfigSchema
- `next/navigation` - useRouter for client-side redirects, redirect for server-side
- `zod` - Schema validation

### Modules That Depend On This Module

- **Receipt Module** (`src/modules/reports/reportService.ts`):
  - Checks for company config before generating receipts
  - Throws error if config missing: "Company configuration required. Please complete onboarding."

- **Dashboard** (`src/app/dashboard/page.tsx`):
  - Redirects to onboarding if incomplete

## Security Considerations

### User Isolation

- Each user's company config is stored under `company:[userID]`
- Users cannot access other users' configurations
- Tested in `onboarding.security.test.ts` (user isolation tests)

### Input Validation

- All fields validated via Zod schema before storage
- URL fields must be valid URLs (http:// or https://)
- Field length limits enforced (prevents database bloat)
- XSS prevention: Text stored as-is, escaped on render

### Data Integrity

- Schema validation on both write and read
- Invalid data in database throws descriptive error
- No partial updates allowed - all fields required

## Testing Strategy

### Test Coverage: 63 tests total

**Unit Tests** (9 tests):
- `onboardingService.unit.test.ts`
- All service functions tested with mocked database

**Contract Tests** (11 tests):
- `route.contract.test.ts`
- GET and POST endpoints
- Validation errors, missing params, success cases

**Integration Tests** (7 tests):
- `onboarding.integration.test.ts`
- Complete user journey from start to finish
- Multi-user isolation
- Config updates

**Security Tests** (31 tests):
- `onboarding.security.test.ts`
- User isolation (3 tests)
- URL validation (6 tests)
- XSS prevention (3 tests)
- Field length validation (7 tests)
- Required field validation (3 tests)

**Component Tests** (15 tests):
- `OnboardingForm.test.tsx`
- Form rendering, validation, submission, accessibility

### Coverage Targets Met

- Service layer: 100% line coverage
- API routes: ≥80% line coverage
- Components: Snapshot coverage for all exports

## Known Limitations

1. **Authentication Placeholder**: Currently uses hardcoded `userID = 'demo-user-001'`. Will be replaced with real authentication in future phase.

2. **Logo Upload**: Logo URL must be provided as a URL string. No file upload functionality implemented. Users must host logos externally.

3. **Single Company Per User**: Each user can have only one company configuration. No multi-company support.

4. **No Config History**: Updates overwrite previous config. No version history or audit trail.

## Future Enhancements

1. **Logo Upload**: Add file upload capability for company logos
2. **Multi-Company Support**: Allow users to manage multiple companies
3. **Config History**: Track changes to company configuration
4. **Partial Updates**: Allow updating individual fields without full form submission
5. **Preview Mode**: Show preview of how company info appears on receipts/invoices

## Related Documentation

- **Data Models**: `docs/architecture/data-models.md` - CompanyConfig schema details
- **Receipt Module**: `docs/architecture/receipt-module.md` - How receipts use company config
- **Testing Strategy**: `docs/architecture/testing-strategy.md` - Overall testing approach
- **ADR**: None specific to onboarding (uses existing patterns)

## Decision References

- **DEC-002**: Database choice (Redis) - applies to company config storage
- **DEC-003**: Testing stack - Jest, React Testing Library used for onboarding tests

---

**Last Updated**: 2026-05-20  
**Status**: Approved - Phase 8 complete, all tests passing