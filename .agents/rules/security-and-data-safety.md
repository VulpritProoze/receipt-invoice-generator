# Agent Rule Prompt: Security and Data Safety

**File**: `.agents/rules/security-and-data-safety.md`
**Scope**: All agents. Applies whenever you handle credentials, sensitive user data, financial data, file uploads, or any user-supplied input.
**Priority**: Critical. Security violations cannot be undone once data has been exposed. When in doubt, always choose the more restrictive path.

---

## Role

You are an agent operating in the BillGen repository, a financial document application handling billing history, invoices, receipts, and credit card information. The people whose data this system stores trust that it is handled correctly. Your job is to ensure that trust is warranted — not by good intentions, but by the mechanical application of the rules in this document, enforced by tests.

Every security-sensitive operation in this system has a corresponding security test. If you write a security-sensitive operation without a corresponding test, that operation is unverified and incomplete.

---

## Rule 1: No Credentials in Any Committed File — Ever

No credential, token, connection string, API key, URL with embedded auth, or environment-specific value appears in any committed file. Not in source code. Not in config. Not in docs. Not in agent files. Not in example files.

**The only correct pattern:**

```typescript
// ✅ Correct — read from environment at runtime
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// ❌ Forbidden — hardcoded credential in committed source
const redis = new Redis({
  url: 'https://us1-relevant-fox-12345.upstash.io',
  token: 'AXxxYYZZ...'
});
```

`.env.example` may contain key names with placeholder values only:

```
UPSTASH_REDIS_REST_URL=your_rest_url_here
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

Real values go only in `.env.local`, which is never committed.

**If you find a hardcoded credential in the codebase:**

1. Remove it immediately from the file.
2. Treat the credential as compromised — tell the human to rotate it.
3. Replace with the correct env var pattern.
4. Document the incident in the current session log entry in `AGENTS.md`.

The sequence matters. Remove first. Then everything else.

---

## Rule 2: Credit Card Numbers — Masked at Write Time, Never Stored Raw

Credit card numbers entered by users are masked before any storage or transmission. The raw number exists only at the moment of input and the masking function call. It must not be assigned to any variable that persists beyond that moment.

**Masking format:** `**** **** **** [last 4 digits]` — only the masked string is stored.

**Implementation requirements:**

- The masking function lives in `src/lib/mask.ts`.
- It is unit-tested in `src/lib/mask.unit.test.ts`.
- The user record written to Redis contains only the masked string. The raw number is not written.
- The masked string is what the UI displays and what appears on receipts. The raw number is never redisplayed after input.
- Credit card numbers are never logged — not in `console.log`, not in error messages, not in server logs.
- API routes never include credit card numbers in error responses.

**Required security test** — `src/lib/creditCardStorage.security.test.ts`:

```
Test 1: Create a user with a raw credit card number via the user creation flow.
        Read the stored record from mock Redis.
        Assert: no stored field contains the raw number.
        Assert: the creditCardNumber field matches /^\*{4} \*{4} \*{4} \d{4}$/.
```

---

## Rule 3: Server-Side Secrets Stay Server-Side

Next.js App Router has a clear client/server boundary. Secrets must never cross to the client.

**The rules:**

- Upstash Redis is accessed only from Route Handlers (`src/app/api/`) and Server Components. Never from Client Components.
- Environment variables containing secrets have no `NEXT_PUBLIC_` prefix — they are server-only.
- Client Components that need data from Redis must fetch it via an internal API route. They never import the Redis client directly.
- No Client Component file (`'use client'`) may contain `import { redis } from '@/lib/redis'` or any equivalent.

**If you accidentally add a Redis import to a Client Component:** remove it immediately. Route the data access through an API route.

**Required security test:** A test in `src/lib/redis.security.test.ts` that statically scans files containing `'use client'` and asserts none of them contain an import of the Redis client module.

---

## Rule 4: All User Input Is Validated With Zod Before Use

User-supplied data — form inputs, request bodies, uploaded file contents — is parsed through the relevant Zod schema before any processing, storage, or response.

**Route handler pattern:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { invoiceSchema } from '@/models/invoice';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = invoiceSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: result.error.flatten() },
      { status: 400 }
    );
  }

  // Only now use result.data — it is typed and validated
  const invoice = result.data;
  // ...
}
```

Never pass `body` directly to a Redis write or any downstream operation before parsing it through `safeParse`. Never cast `body as Invoice` without parsing. A type cast is not validation.

---

## Rule 5: Receipt Generation Requires a Verified Invoice

The receipt module cannot generate a receipt without first loading and verifying a real, existing invoice from Redis.

**The required flow:**

1. The receipt route handler receives an `invoiceID`.
2. It loads the invoice from Redis using that ID.
3. If the invoice does not exist in Redis: return HTTP 404 `{ error: 'Invoice not found' }`.
4. If the invoice exists but belongs to a different user context: return HTTP 403.
5. Only if the invoice is verified: proceed with receipt generation using the data from Redis — not from the request body.

Never generate a receipt by accepting invoice data from the request body. The source of truth is Redis.

**Required security tests** — `src/modules/receipts/receiptGeneration.security.test.ts`:

```
Test 1: Valid invoiceID → receipt generates successfully.
Test 2: Non-existent invoiceID → returns 404.
Test 3: Request body contains invoice data but no valid invoiceID → returns 400 (body data is ignored).
```

---

## Rule 6: File Import Is a Controlled Attack Surface

The CSV/XLSX import module accepts user-uploaded files. This is one of the most common vectors for abuse in web applications. Treat every uploaded file as untrusted until proven otherwise.

**Validation requirements:**

- Check MIME type: accept only `text/csv`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Check file extension as a secondary check: accept only `.csv` and `.xlsx`.
- Enforce a file size maximum (research and set an appropriate limit — a billing history file with hundreds of rows should not require more than a few MB; document the chosen limit and rationale in an ADR).
- Parse the file in a sandboxed manner — never execute any file content.
- Validate parsed content against the expected column schema (Description, Quantity, Rate, Date). Rows that do not match are skipped with a reason logged — not silently accepted.

**Required security tests** — `src/modules/import/fileImport.security.test.ts`:

```
Test 1: Valid .csv file → accepted.
Test 2: Valid .xlsx file → accepted.
Test 3: File with .exe extension → rejected.
Test 4: File claiming to be CSV (correct MIME type) but containing binary content → rejected or handled gracefully without crash.
Test 5: File exceeding the size limit → rejected with a clear error message.
```

---

## Rule 7: Error Responses Must Not Leak Implementation Details

API error responses must be safe to return to any client — including a hostile one.

**What must never appear in an error response:**

- Stack traces.
- Redis error messages verbatim (they may include connection details, key names, or internal state).
- Server-side file system paths.
- Internal variable names or data shapes not in the public API contract.

**What an error response looks like:**

```typescript
// ✅ Safe
return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

// ❌ Leaks internal detail
return NextResponse.json({ error: redisError.message }, { status: 500 });
```

Log detailed errors server-side with `console.error` (development) or a structured logger (production). Return only safe, user-facing messages to the client.

---

## Rule 8: Invoice Total Cannot Be Negative

Calculated financial fields — Subtotal, Tax Amount, Invoice Total — are computed at render time from the stored line items. The calculation must be guarded against producing a negative result.

**Required guardrail:** If `Quantity` or `Rate` on any `InvoiceItem` is negative (which should be rejected by the Zod schema, but must also be defended against at calculation time), the Invoice Total calculation clamps to zero rather than producing a negative value. Log the anomaly server-side.

**Required security test** — included in `src/modules/invoices/invoiceCalculation.security.test.ts`:

```
Test: Pass line items with negative quantities and rates through the total calculation.
Assert: the resulting Invoice Total is >= 0.
```

---

## What You Must Never Do

- **Never store raw credit card numbers.** Not temporarily. Not "just for this test." Not "just to check the flow." Mask at write time, always.
- **Never log sensitive data** — not credit card numbers, not Redis tokens, not raw user email addresses in verbose server logs during development.
- **Never bypass Zod validation** by casting request body directly to a TypeScript type: `body as Invoice` is not validation. Use `safeParse`.
- **Never trust file extensions alone** to determine file type. Always check MIME type.
- **Never generate a receipt without loading and verifying the invoice from Redis.** Taking invoice data from the request body is not acceptable.
- **Never expose server-only environment variables to the client bundle.** No `NEXT_PUBLIC_` prefix on secrets. No Redis client imports in Client Components.
- **Never return stack traces or internal error details in API responses.**
- **Never skip security tests.** Security tests are part of the mandatory suite and run in Step 9 before the final linting check. A phase with untested security-sensitive code is an incomplete phase.
- **Never suppress a security test by adding `.skip()`.** A `.skip()` on a security test is a committed statement that a security property is unverified. It will be caught by `jest/no-disabled-tests`.
