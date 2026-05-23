# ADR-014: Billing User System Architecture

---
doc_id: DEC-014
title: Billing User System Architecture
version: 1.0.0
status: accepted
created: 2026-05-23
updated: 2026-05-23
author: Bob
reviewers: none
tags: architecture, billing-users, data-model, refactor
changelog:
  - version: 1.0.0
    date: 2026-05-23
    author: Bob
    note: Initial decision documenting Phase 1 implementation
---

## Context

The current BillGen system uses a flat, invoice-centric data model where:
- Invoice items are imported and linked directly to the logged-in user
- Bill-to information is embedded in each invoice
- There is no concept of customers/clients as first-class entities
- Invoice generation requires manually filling bill-to forms each time

This structure has several limitations:
1. **No customer management** — Cannot track or manage clients independently
2. **Data duplication** — Bill-to information repeated across invoices for the same client
3. **Limited reporting** — Cannot generate reports by customer
4. **Poor scalability** — Difficult to add features like customer history, recurring billing, or multi-tenant support

## Decision

We will refactor the system to introduce a **Billing User** architecture with the following changes:

### 1. New First-Class Entities

**Billing User** (customers/clients):
- Represents a customer or client of the company
- Contains name and address information (previously embedded in invoices)
- Linked to a company via `companyID`
- Becomes the primary organizational unit for billing data

**Invoice Item Master** (catalog of billable services):
- Represents a type of service or product that can be billed
- Contains description and optional default rate
- Shared across all billing users within a company
- Used for matching during CSV/XLSX import

**Billing History** (time-stamped transactions):
- Represents individual billable transactions
- Links a billing user to an invoice item with quantity, rate, and date
- Tracks billed/unbilled status
- Multiple billing history entries can be grouped into a single invoice

### 2. Modified Entities

**Invoice**:
- Remove: `billTo`, `billToAddressLine`, `billToCityAddress`, `billToPostalAddress`, `billToCountry`, `userID`
- Add: `billingUserID` (foreign key to billing_users)
- Change: `invoiceItems` structure to nested format with billing history entries

**Company Config**:
- Add: `companyID` field (generated, not user-provided)
- Enables future multi-tenant support

### 3. Data Flow Changes

**Old flow:**
```
Import CSV → Create InvoiceItems → Select items → Fill bill-to form → Generate Invoice
```

**New flow:**
```
Create Billing User → Import CSV for that user → Match to Invoice Item Masters → 
Create Billing History → Select billing history entries → Generate Invoice
```

### 4. Database Schema Changes

**New tables:**
- `billing_users` — Customer/client records
- `invoice_item_masters` — Catalog of billable services
- `billing_history` — Time-stamped transactions with indexes on user, item, and status

**Modified tables:**
- `company_configs` — Added `company_id` column
- `invoices` — Removed bill-to fields, added `billing_user_id`, changed to single primary key
- `invoice_sequences` — Changed from `user_id` to `billing_user_id`

**Removed tables:**
- `invoice_items` — Replaced by `invoice_item_masters` + `billing_history`

## Rationale

### Why Billing Users as First-Class Entities?

1. **Customer-centric workflow** — Matches how businesses actually think about billing (by customer, not by invoice)
2. **Data normalization** — Eliminates duplication of customer information
3. **Reporting capabilities** — Enables customer-level reports and analytics
4. **Future extensibility** — Foundation for features like customer portals, recurring billing, payment tracking

### Why Separate Invoice Item Masters from Billing History?

1. **Import matching** — Allows automatic matching of imported items by description
2. **Consistency** — Ensures service descriptions are standardized across invoices
3. **Rate management** — Provides default rates while allowing per-transaction overrides
4. **Catalog management** — Enables UI for managing available services

### Why Nested Invoice Structure?

1. **Clarity** — Groups billing history entries by service type in the invoice
2. **Traceability** — Maintains link to original billing history records
3. **Flexibility** — Supports multiple transactions for the same service in one invoice

## Consequences

### Positive

- **Better data organization** — Clear hierarchy: Company → Billing Users → Billing History → Invoices
- **Reduced duplication** — Customer information stored once, referenced by invoices
- **Enhanced reporting** — Can generate reports by customer, service type, time period
- **Improved UX** — No need to re-enter customer information for repeat clients
- **Multi-tenant ready** — `companyID` field prepares for future multi-company support

### Negative

- **Breaking change** — Existing data must be migrated or database reset
- **Increased complexity** — More entities and relationships to manage
- **Import flow changes** — Requires item matching logic, may need user intervention for new items
- **Learning curve** — Users must understand the new customer-centric workflow

### Migration Strategy

**Phase 1 approach (this implementation):**
- Clean slate — Users delete existing database and start fresh
- Acceptable for MVP/early adopters with minimal existing data
- Documented in migration guide

**Future consideration:**
- Automated migration script to preserve existing data
- Extract unique bill-to combinations as billing users
- Convert invoice items to billing history
- Deduplicate descriptions into invoice item masters

## Implementation Notes

### Phase 1 Scope (Completed)

1. ✅ Data models created: `BillingUser`, `BillingHistory`, `InvoiceItemMaster`
2. ✅ Data models modified: `Invoice` (removed bill-to fields, added `billingUserID`), `CompanyConfig` (added `companyID`)
3. ✅ Database schema updated in `db.sqlite.ts`
4. ✅ Database adapters created for new entities
5. ✅ Database adapters modified for changed entities
6. ✅ Schema tests written for all new and modified models
7. ⏸️ Unit tests for adapters (deferred to avoid test suite overhead during Phase 1)

### Future Phases

- **Phase 2**: Service layer and import logic with item matching
- **Phase 3**: API routes for billing users, invoice item masters, billing history
- **Phase 4**: UI for billing user management and scoped import
- **Phase 5**: Invoice generation UI with nested item selection
- **Phase 6**: Migration script and documentation
- **Phase 7**: Testing and refinement

## Alternatives Considered

### Alternative 1: Keep Flat Structure, Add Customer Table

**Approach:** Add a `customers` table but keep invoice items flat.

**Rejected because:**
- Doesn't solve the import matching problem
- Still requires manual item entry for each invoice
- Misses opportunity for better data organization

### Alternative 2: Use Tags/Categories Instead of Billing Users

**Approach:** Tag invoices with customer identifiers instead of foreign keys.

**Rejected because:**
- Weak referential integrity
- Harder to enforce data consistency
- Doesn't support customer-level operations cleanly

### Alternative 3: Implement Multi-Tenant from Start

**Approach:** Full multi-company support in Phase 1.

**Rejected because:**
- Scope too large for initial refactor
- Current user base is single-tenant
- Can be added incrementally via `companyID` field

## References

- Plan: `docs/plans/014-billing-user-system-refactor.md`
- Related ADRs: DEC-008 (SQLite database), DEC-012 (centralized validation)
- Implementation: Phase 1 complete as of 2026-05-23

## Status

**Accepted** — Phase 1 implementation complete. Foundation layer (models, database, adapters, tests) is in place and ready for service layer and UI implementation in subsequent phases.