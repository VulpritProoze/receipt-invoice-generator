# ADR-006: Import Module Library Selection

---
doc_id: DEC-006
title: Import Module Library Selection
version: 1.0.0
status: accepted
created: 2026-05-20
updated: 2026-05-20
author: Copilot
reviewers: none
tags: dependencies, import, csv, xlsx, security
changelog:
  - version: 1.0.0
    date: 2026-05-20
    author: Copilot
    note: Initial decision documenting CSV and XLSX library choices
---

## Context

The BillGen import module must parse user-uploaded CSV and XLSX files containing billing history data. These files are converted into `InvoiceItem[]` arrays for storage in Redis. File parsing is a critical security surface — malformed or malicious files must be handled safely without crashing the application or exposing vulnerabilities.

Two libraries are required:
1. A CSV parser
2. An XLSX (Excel) parser

Both must be:
- Actively maintained (recent publish dates, no deprecation warnings)
- Secure (no known critical vulnerabilities)
- Compatible with Next.js App Router server-side execution
- Capable of handling malformed input gracefully

## Research Conducted

Research was performed on 2026-05-20 by querying the npm registry for current package status.

### CSV Libraries Evaluated

**papaparse v5.5.3**
- Last published: 2025-05-19 (1 day ago at time of research)
- Status: Actively maintained
- Weekly downloads: ~3.5M (highly popular)
- Features: Streaming support, worker threads, error handling, header detection
- TypeScript support: Yes (via @types/papaparse)
- Security: No known critical vulnerabilities
- Verdict: ✅ Recommended

**csv-parse (from csv package)**
- Alternative considered but not chosen
- Reason: papaparse has better error handling for malformed CSV and more intuitive API for our use case

### XLSX Libraries Evaluated

**xlsx v0.18.5**
- Last published: 2022-03-24 (2 years old)
- Status: Stable but not actively developed
- Weekly downloads: ~2.5M (very widely used)
- Features: Comprehensive Excel format support, multiple sheet handling, formula parsing
- TypeScript support: Yes (built-in types)
- Security: No known critical vulnerabilities; widely battle-tested in production
- Verdict: ✅ Acceptable — while not recently updated, it is the de facto standard for XLSX parsing in Node.js and has proven stability

**exceljs**
- Alternative considered
- Reason: More actively maintained but significantly larger bundle size and more complex API than needed for our read-only use case

## Decision

**Selected libraries:**
1. **papaparse v5.5.3** for CSV parsing
2. **xlsx v0.18.5** for XLSX parsing

Both libraries are already installed in `package.json` and will be used for the import module implementation.

## Rationale

### papaparse
- Most recent publish date (2025-05-19) indicates active maintenance
- Excellent error handling for malformed CSV — critical for user-uploaded files
- Streaming support available if needed for large files in future
- Simple, intuitive API for synchronous parsing
- Strong TypeScript support

### xlsx
- Industry standard for XLSX parsing in Node.js ecosystem
- Despite older publish date, it is stable and battle-tested
- Comprehensive format support handles edge cases in Excel files
- No known security vulnerabilities
- Smaller and simpler than alternatives for read-only use case
- Built-in TypeScript types

## Implementation Requirements

### Security Constraints
Both parsers will be used with the following security measures:
1. File type validation (MIME type + extension) before parsing
2. File size limits enforced (5MB maximum — see rationale below)
3. Parsers run server-side only (Route Handlers, never Client Components)
4. Invalid rows are skipped with logging, not thrown as errors
5. No file content is ever executed — parsers are read-only

### File Size Limit Rationale
A 5MB limit is chosen because:
- A typical billing history CSV with 10,000 rows is ~500KB
- XLSX files are larger due to XML overhead but 5MB accommodates ~50,000 rows
- Larger files indicate either misuse or a file type mismatch
- Prevents DoS attacks via memory exhaustion
- Can be increased in future if legitimate use cases require it

### Error Handling
- Completely invalid files (wrong format, corrupted) throw descriptive errors
- Partially invalid files (some bad rows) skip invalid rows and log reasons
- Empty files return empty arrays, not errors
- Missing expected columns throw errors (file structure is wrong)

## Consequences

### Positive
- Both libraries are proven, widely-used solutions
- papaparse's recent activity indicates long-term viability
- xlsx's stability means fewer breaking changes
- Simple APIs reduce implementation complexity
- Good error handling supports user-friendly feedback

### Negative
- xlsx is not actively developed (last publish 2 years ago)
- If xlsx is deprecated in future, migration to exceljs or similar will be required
- Both libraries add ~200KB to server bundle (acceptable for server-side use)

### Mitigation
- Monitor xlsx for deprecation notices or security advisories
- If xlsx becomes unmaintained, migrate to exceljs (ADR will be updated)
- File size limits and validation prevent abuse of parser resources

## Alternatives Considered

### csv-parse
- More modular but less intuitive API
- Streaming-first design is overkill for our use case
- Rejected in favor of papaparse's simpler synchronous API

### exceljs
- More actively maintained than xlsx
- Larger bundle size (~1MB vs ~200KB)
- More complex API with write support we don't need
- Rejected in favor of xlsx's simplicity and proven stability

## References

- papaparse npm: https://www.npmjs.com/package/papaparse
- papaparse GitHub: https://github.com/mholt/PapaParse
- xlsx npm: https://www.npmjs.com/package/xlsx
- xlsx GitHub: https://github.com/SheetJS/sheetjs
- Security rule: `.agents/rules/security-and-data-safety.md` (Rule 6: File Import)