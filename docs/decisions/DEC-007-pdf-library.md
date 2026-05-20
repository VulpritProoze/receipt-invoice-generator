# ADR-007: PDF Generation Library Selection

---
doc_id: DEC-007
title: PDF Generation Library Selection
version: 1.0.0
status: accepted
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: pdf, dependencies, reports, server-side
changelog:
  - version: 1.0.0
    date: 2026-05-20
    author: Copilot
    note: Initial decision - PDFKit selected for server-side PDF generation
---

## Status

**Accepted** — 2026-05-20

## Context

Phase 7 (Report Generation) requires server-side PDF generation for invoices and receipts. The PDFs must:

- Match provided template layouts exactly (invoice-template.png, receipt-template.png)
- Render professional financial documents with proper typography and spacing
- Support tables with multiple columns and calculated totals
- Include company branding (logos, text)
- Generate on the server (Next.js Route Handlers with Node.js runtime)
- Return as downloadable files with proper HTTP headers
- Be testable in unit tests (generate Buffer output)

The library must be:
- Actively maintained (not deprecated)
- Compatible with Node.js runtime (not browser-only)
- Capable of producing professional layouts with precise positioning
- Well-documented with examples for common use cases

## Decision

**We will use PDFKit** (`pdfkit` npm package) for all PDF generation in this project.

## Rationale

### Why PDFKit

1. **Industry standard for Node.js server-side PDF generation** — PDFKit is the most widely-used library for generating PDFs in Node.js environments, with millions of weekly downloads and extensive production usage.

2. **Full control over layout** — PDFKit provides low-level drawing primitives (text positioning, lines, rectangles, images) that allow precise reproduction of the template layouts. This is critical for matching the provided invoice and receipt templates exactly.

3. **Native Node.js compatibility** — PDFKit is designed for server-side use and works seamlessly in Next.js Route Handlers with the `nodejs` runtime (no Edge Runtime limitations).

4. **Streaming output** — PDFKit can generate PDFs as streams or Buffers, making it easy to return them as HTTP responses without writing to disk.

5. **Rich typography support** — Supports custom fonts, text styling (bold, italic), alignment, and line height control — all necessary for professional financial documents.

6. **Table and column support** — While not providing a high-level table API, PDFKit's positioning primitives make it straightforward to implement custom table layouts with precise column alignment.

7. **Image embedding** — Can embed PNG/JPEG images for company logos.

8. **Mature and stable** — PDFKit has been in active development since 2011, with a stable API and extensive community knowledge base.

### Alternatives Considered

**pdf-lib:**
- Lower-level library focused on PDF manipulation (editing existing PDFs)
- More complex API for creating PDFs from scratch
- Better suited for PDF form filling or modification than document generation
- Rejected: Overkill for our use case; PDFKit's higher-level API is more appropriate

**jsPDF:**
- Originally designed for browser-side PDF generation
- Can run server-side but less commonly used in that context
- Smaller ecosystem for server-side use cases
- Rejected: PDFKit is more established for Node.js server-side generation

**Puppeteer/Playwright (HTML-to-PDF):**
- Render HTML/CSS to PDF via headless browser
- Easier layout with familiar web technologies
- Rejected: Significantly heavier (requires Chromium), slower, and overkill for structured financial documents. PDFKit's direct generation is more efficient and predictable.

## Implementation Notes

### Installation

```bash
npm install pdfkit
npm install --save-dev @types/pdfkit
```

### Route Handler Configuration

All PDF generation routes must use the Node.js runtime (not Edge):

```typescript
// src/app/api/reports/invoice/[invoiceID]/route.ts
export const runtime = 'nodejs';
```

### Basic Usage Pattern

```typescript
import PDFDocument from 'pdfkit';

export async function generateInvoicePDF(
  invoice: Invoice,
  companyConfig: CompanyConfig
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Layout implementation here
    doc.fontSize(24).text('INVOICE', { align: 'center' });
    // ... more layout code

    doc.end();
  });
}
```

### Testing Strategy

- **Unit tests**: Generate PDFs with mock data, assert Buffer output is non-empty and starts with PDF magic bytes (`%PDF`)
- **Visual verification**: Manual comparison against template images (not automated)
- **Content verification**: Parse generated PDF text content in tests to verify key fields are present

### Known Limitations

1. **No built-in table API** — Tables must be implemented manually using text positioning and line drawing. This is acceptable given our simple table structures (invoice line items, receipt details).

2. **Font embedding** — Custom fonts require font files to be bundled. We will use PDFKit's built-in fonts (Helvetica, Times, Courier) which are sufficient for professional financial documents.

3. **No automatic page breaks in tables** — If an invoice has many line items spanning multiple pages, page break logic must be implemented manually. For MVP, we assume invoices fit on one page; multi-page support can be added later if needed.

## Consequences

### Positive

- Precise control over layout to match templates exactly
- Fast PDF generation (no browser overhead)
- Lightweight dependency (no Chromium required)
- Testable with standard Jest unit tests
- Well-documented with extensive examples
- Proven in production at scale

### Negative

- Lower-level API requires more code than HTML-to-PDF approaches
- Manual table layout implementation needed
- Learning curve for developers unfamiliar with PDFKit's coordinate-based positioning

### Neutral

- PDFs are generated synchronously in Route Handlers (acceptable for MVP; can be moved to background jobs later if needed)

## References

- PDFKit documentation: http://pdfkit.org/
- PDFKit GitHub: https://github.com/foliojs/pdfkit
- npm package: https://www.npmjs.com/package/pdfkit

## Related Decisions

- DEC-002: Database Choice (Upstash Redis) — PDF generation reads invoice/receipt data from Redis
- Phase 7 implementation will reference this ADR in all PDF generation code

## Review Notes

This decision was made based on PDFKit's established position as the standard Node.js PDF library and user approval to proceed with it. No formal deprecation check was performed due to PowerShell execution policy restrictions, but PDFKit's widespread usage and active maintenance are well-documented in the community.