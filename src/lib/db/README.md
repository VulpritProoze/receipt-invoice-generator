# Database Layer - Redis Key Format Strategy

---

doc_id: ARCH-DB-001
title: Database Layer - Redis Key Format Strategy
version: 1.0.0
status: approved
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: database, redis, architecture, key-format
changelog:

- version: 1.0.0
  date: 2026-05-20
  author: Copilot
  note: Initial documentation for Phase 4 database layer

---

## Overview

This document describes the Redis key naming conventions and data storage patterns used in the BillGen application. All database operations are implemented in `src/lib/db/` and use these key formats consistently.

## Key Naming Convention

All Redis keys follow a hierarchical pattern with colon (`:`) separators:

```
[entity]:[scope]:[identifier]
```

This format was chosen for:

- **SCAN performance**: Hierarchical keys enable efficient pattern matching with `KEYS` command
- **User isolation**: All user data is scoped by userID, preventing cross-user data access
- **Readability**: Keys are self-documenting and easy to understand in Redis CLI
- **Consistency**: Uniform pattern across all entities simplifies maintenance

## Primary Key Patterns

### User Data

```
user:[userID]
```

Stores complete User object as JSON.

**Example**: `user:550e8400-e29b-41d4-a716-446655440000`

### Invoice Data

```
invoice:[userID]:[invoiceID]
```

Stores complete Invoice object as JSON. Scoped by userID for data isolation.

**Example**: `invoice:550e8400-e29b-41d4-a716-446655440000:INV000000001`

### Receipt Data

```
receipt:[userID]:[receiptID]
```

Stores complete Receipt object as JSON. Scoped by userID for data isolation.

**Example**: `receipt:550e8400-e29b-41d4-a716-446655440000:CH_A3K9MXQP2T7VWRJN`

### Company Configuration

```
company:[userID]
```

Stores CompanyConfig object as JSON. One config per user.

**Example**: `company:550e8400-e29b-41d4-a716-446655440000`

## Secondary Indexes

Secondary indexes enable lookups by fields other than the primary key. They store only the primary key value, not the full object.

### User Email Index

```
user:email:[email] -> userID
```

Maps email address to userID for `getUserByEmail()` lookups.

**Example**: `user:email:john@example.com` → `550e8400-e29b-41d4-a716-446655440000`

**Maintenance**: Created on user creation, updated on email change, deleted on user deletion.

### Receipt Invoice Index

```
receipt:invoice:[userID]:[invoiceID] -> receiptID
```

Maps invoiceID to receiptID for `getReceiptByInvoiceID()` lookups.

**Example**: `receipt:invoice:550e8400-e29b-41d4-a716-446655440000:INV000000001` → `CH_A3K9MXQP2T7VWRJN`

**Maintenance**: Created on receipt creation, deleted on receipt deletion.

## Sequence Counters

Sequence counters use Redis `INCR` to generate sequential numeric IDs.

### Invoice Sequence

```
invoice:sequence:[userID]
```

Stores the next invoice sequence number for a user. Incremented atomically with `INCR`.

**Example**: `invoice:sequence:550e8400-e29b-41d4-a716-446655440000` → `42`

**Usage**: Used by `getNextInvoiceSequence()` to generate invoice IDs like `INV000000042`.

## Data Storage Format

All entity data is stored as JSON and automatically serialized/deserialized by the Upstash Redis client.

**On write**: Objects are validated through Zod schemas before storage.

**On read**: Retrieved JSON is parsed and validated through Zod schemas to ensure data integrity.

## Pattern Matching for List Operations

List operations use Redis `KEYS` command with wildcard patterns:

```typescript
// List all invoices for a user
await redis.keys(`invoice:${userID}:*`);

// List all receipts for a user
await redis.keys(`receipt:${userID}:*`);
```

**Note**: `KEYS` is acceptable for this application's scale. For very large datasets (millions of keys), consider using `SCAN` instead.

## User Data Isolation

All user-scoped data includes `userID` in the key path. This ensures:

1. **Security**: User A cannot access User B's data by guessing keys
2. **Efficient queries**: All data for a user can be retrieved with a single pattern match
3. **Clean deletion**: All user data can be deleted by pattern matching their userID

## Error Handling

Database operations follow these error handling rules:

- **Not found**: Return `null` (not an error condition)
- **Invalid data on read**: Throw error with context about which key failed validation
- **Connection failures**: Throw `RedisError` with operation context and retry information
- **Validation failures**: Throw Zod validation error with field-level details

## Key Lifecycle

### User Creation

1. Create `user:[userID]` with user data
2. Create `user:email:[email]` index

### Invoice Creation

1. Create `invoice:[userID]:[invoiceID]` with invoice data
2. Increment `invoice:sequence:[userID]` if generating new ID

### Receipt Creation

1. Create `receipt:[userID]:[receiptID]` with receipt data
2. Create `receipt:invoice:[userID]:[invoiceID]` index

### User Deletion

1. Delete `user:[userID]`
2. Delete `user:email:[email]` index
3. **Note**: Invoices and receipts are NOT automatically deleted (business decision - preserve financial records)

### Invoice Deletion

1. Delete `invoice:[userID]:[invoiceID]`
2. **Note**: Associated receipt is NOT automatically deleted (business decision)

### Receipt Deletion

1. Delete `receipt:[userID]:[receiptID]`
2. Delete `receipt:invoice:[userID]:[invoiceID]` index

## Future Considerations

### Scaling Considerations

- Current pattern works well for up to ~100K keys per user
- For larger scales, consider:
  - Using `SCAN` instead of `KEYS` for list operations
  - Implementing pagination for list results
  - Adding Redis Cluster support for horizontal scaling

### Additional Indexes

If query patterns change, consider adding:

- Invoice date range index for faster date filtering
- Receipt date index for chronological queries
- User creation date index for admin queries

### Data Migration

When schema changes occur:

1. Update Zod schema with new fields (make them optional if adding to existing data)
2. Update database operation functions
3. Run migration script to update existing records
4. Make new fields required in schema after migration completes

## Related Documentation

- See `src/models/` for Zod schema definitions
- See `docs/architecture/data-models.md` for entity relationship diagrams
- See `docs/decisions/DEP-002-database-choice.md` for Redis selection rationale
