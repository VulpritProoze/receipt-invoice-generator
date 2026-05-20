# Agent Rule Prompt: Report Layout
**File**: `.agents/rules/report-layout.md`
**Scope**: All agents involved in invoice or receipt PDF generation, UI form design, or any code that produces or renders report output.
**Priority**: High. The invoice and receipt are the primary deliverable of this application. Their layout must be accurate, professional, and match the approved visual templates — not approximated from memory or generic defaults.

---

## Role

You are an agent operating in the BillGen repository. The two outputs of this application — the Invoice PDF and the Receipt PDF — are documents that real people will read, print, and act on financially. They must look like the provided templates, contain the correct fields in the correct order, and compute their financial values correctly. "Close enough" is not acceptable.

Before you write any code that renders, lays out, or populates an invoice or receipt, you read and follow every rule in this file.

---

## Rule 1: Template Images Are Required Before Any Layout Work Begins

The visual layout of both the invoice and the receipt is defined by two uploaded template images — provided by the human who set up this project. These images define field order, section structure, typography, spacing, and visual hierarchy.

**If either image is not in your active context when you are about to write report layout code:**

Stop. State explicitly:
> "I cannot proceed with invoice/receipt layout without the template images. Please upload the Invoice template image and the Receipt template image so I can match the layout accurately."

Then wait. Do not proceed with layout work until both images are available.

**You must not:**
- Approximate the layout from memory or from "standard invoice design."
- Use a generic invoice layout "as a starting point" that you plan to adjust later. There is no later. There is only accurate from the start.
- Proceed with any component, template, or PDF rendering function that places invoice or receipt fields without referencing the template images.

---

## Rule 2: Analyze the Template Images Thoroughly Before Writing Code

When the template images are uploaded, analyze them before writing any rendering code.

**Your analysis must extract:**

- **Page structure**: identify distinct sections — header, bill-to, line items table, totals, footer. What does each section contain? Where are the visual boundaries?
- **Field order**: within each section, in what order do fields appear? Top to bottom, left to right. The order in the rendered output must match the template exactly.
- **Column structure in the line items table**: column names, approximate relative widths, alignment per column (does "Amount" right-align? does "Description" left-align?).
- **Typography cues**: which text is larger, bolder, or lighter than surrounding text? What is the visual hierarchy of headings vs. body vs. labels vs. values?
- **Spacing and grouping**: which fields are visually grouped? Where are there dividers, horizontal rules, or significant whitespace gaps between sections?
- **Footer content**: what appears at the bottom of each document? Is it company branding, payment notes, legal text, or all of the above?
- **Logo placement**: where does the company logo appear, at what approximate size, and in relation to what other elements?
- **Any fields visible in the template that are not in the data models**: surface these to the human and ask whether they should be added before proceeding.

Write a brief analysis note — not code — before you begin rendering code. This analysis is your source of truth for the implementation.

---

## Rule 3: Invoice Data Model and Layout

The invoice PDF contains these fields, in sections determined by the template image analysis. Below is the full field inventory:

**Header / Branding:**
- Company logo (from `CompanyConfig.logoUrl`)
- Company brand name (`CompanyConfig.brandName`)
- Company name (`CompanyConfig.companyName`)
- Label: "INVOICE"
- Invoice ID — format: `INV` + 9-digit zero-padded number, e.g., `INV000000001`
- Invoice Date (`invoice.invoiceDate`)
- Due Date (`invoice.dueDate`)
- Terms (`invoice.terms`, default: "Due Upon Receipt")
- Currency indicator (`invoice.currency`: PHP or USD)

**Bill To:**
- Recipient name (`invoice.billTo`)
- Address line (`invoice.billToAddressLine`)
- City/municipality (`invoice.billToCityAddress`)
- Province/postal code (`invoice.billToPostalAddress`)
- Country (`invoice.billToCountry`)

**Line Items Table** — one row per selected `InvoiceItem`:
| Column | Source | Alignment |
|--------|--------|-----------|
| Quantity | `item.quantity` | Right |
| Description | `item.description` | Left |
| Rate | `item.rate` (with currency symbol) | Right |
| Amount | `item.quantity × item.rate` (calculated at render time) | Right |

**Totals Section (below the line items table):**
- Subtotal: sum of all `Amount` values
- Tax label: "Tax (N%)" where N is `invoice.taxRate × 100`
- Tax amount: `Subtotal × invoice.taxRate`
- Invoice Total: `Subtotal + Tax Amount`

**Critical calculation rule:** Amount, Subtotal, Tax Amount, and Invoice Total are **never stored in Redis**. They are calculated at render time from the stored `invoice.invoiceItems` array and `invoice.taxRate`. If you find code that stores these calculated values, remove it.

**Currency symbol:** derive at render time from `invoice.currency`:
- `'PHP'` → `₱`
- `'USD'` → `$`

Never hardcode a currency symbol. Never use a symbol that doesn't correspond to the selected currency.

---

## Rule 4: Receipt Data Model and Layout

The receipt PDF contains these fields, in sections determined by the template image analysis:

**Header:**
- Label: "RECEIPT" or "PAYMENT RECEIPT" (match the template)
- Transaction ID / Receipt ID: the `receipt.receiptID` field — format `CH_` + 17 uppercase alphanumeric characters, e.g., `CH_A3K9MXQP2T7VWRJN`
- Date (`receipt.date`)

**Account Billed:**
- Account Billed: `username (userEmail)` — e.g., `jsmith (jsmith@company.com)`
- Charged To: `creditCardType **** **** **** [last 4]` — e.g., `Mastercard **** **** **** 4242`

**Items / Transaction Detail:**
- Reference Invoice ID (`receipt.invoiceID`)
- Line items (snapshot from the invoice): Description, Quantity, Rate, Amount per item
- Total: sum of all item amounts

**Company Branding Footer (bottom of receipt):**
- Company brand name (`CompanyConfig.brandName`)
- Company legal name (`CompanyConfig.companyName`)
- Company URL (`CompanyConfig.companyUrl`)
- Company address line (`CompanyConfig.addressLine`)
- Company postal address (`CompanyConfig.postalAddress`)
- Company country (`CompanyConfig.country`)
- Company logo (`CompanyConfig.logoUrl`)

**If `CompanyConfig` is incomplete** (onboarding not done): do not render the receipt. Return an error and redirect to `/onboarding`. Never render a receipt with empty company branding fields — it is an incomplete and potentially unprofessional document.

---

## Rule 5: PDF Generation Technical Requirements

**PDF generation is server-side only.** It happens in a Route Handler or Server Action. It never happens in a Client Component, never in `useEffect`, never via `window.print()`.

**Output delivery:**
- The PDF is returned as a binary HTTP response.
- Response headers: `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="[invoiceID].pdf"` (or `[receiptID].pdf`).
- The browser downloads the file. It is not opened in an iframe or new tab by default.

**Library selection:** Before writing any PDF code, run the `research-dependency` skill to confirm the chosen PDF library is actively maintained, not deprecated, and compatible with Next.js App Router (specifically: compatible with the `nodejs` runtime, not the Edge Runtime). Document the choice with an ADR. Do not approximate layout with a library that cannot reproduce the template's structure.

**Typography:** Use a clean, readable font. If the template image specifies a font, match it. If not, use a web-safe font available to the PDF renderer (Inter, Roboto, or similar). Minimum body text: 10pt. Section headers: 14pt or larger. Line height must be legible — don't compress rows to fit more content.

**Layout fidelity standard:** the rendered PDF, when placed side-by-side with the template image, must be immediately recognizable as the same layout. An observer should describe them as "the same design." If a layout element from the template cannot be reproduced with the chosen library, surface the limitation to the human before shipping.

---

## Rule 6: Invoice UI — Selection and Filtering Requirements

The invoice generation UI (the form the user fills in, not the PDF itself) must implement:

**Date range filter:**
- Start date and end date inputs filter the displayed `InvoiceItem` rows by `item.date`.
- Items outside the range are hidden from the list but are not deleted from the database.
- The filter resets on page load — it is not persisted.

**Multi-select with Shift+Click range selection:**
- Each `InvoiceItem` row has a checkbox.
- Clicking a single checkbox selects or deselects that item.
- Shift+Click on a checkbox selects all items between the last-selected item and the current item (range selection), matching the behavior of standard file managers and spreadsheet applications.
- A "Select All / Deselect All" control is present.
- The count of selected items and their running subtotal (before tax) is displayed in real time as selection changes.

**Invoice form fields:**
- Bill To: name (required), address line, city, postal/province, country.
- Due Date: date picker, required.
- Currency: dropdown with PHP and USD options, required.
- Tax Rate: percentage input, default 12%, stored as a decimal (0.12).

---

## Rule 7: Receipt UI — Invoice Table Requirements

The receipt generation module is a separate route with its own page. It must:

- Display a table of all invoices in the system (or scoped to the current user context).
- Table columns: Invoice ID, Invoice Date, Bill To, Total (with currency symbol), Due Date.
- Each row has a "Generate Receipt" button.
- Clicking the button triggers server-side receipt generation for that invoice and delivers the PDF as a download. No additional form is required.
- If a receipt has already been generated for an invoice, the button may indicate this (e.g., "Re-generate Receipt" or a secondary download option). The exact UX treatment must be consistent — pick one approach and apply it uniformly.

---

## What You Must Never Do

- **Never approximate the template layout.** The template images are the specification. If they are not uploaded, stop and ask for them.
- **Never store Amount, Subtotal, Tax Amount, or Invoice Total in Redis.** These are render-time calculations. Storing them creates a sync problem if the tax rate or items change.
- **Never generate a receipt without a valid, loaded invoice from Redis.** See the security rule on this — it is a security requirement, not just a data requirement.
- **Never render a receipt with empty company branding fields.** If `CompanyConfig` is missing or incomplete, redirect to onboarding.
- **Never use client-side PDF generation** (`window.print()`, browser-side jsPDF, or similar). PDFs are generated server-side and delivered as file downloads.
- **Never hardcode currency symbols.** Derive from `invoice.currency` at render time.
- **Never place fields in a different order than the template image.** Field order in the template is intentional and meaningful to the human reader.
- **Never proceed with report layout code before analyzing the template images.** Guessing at layout and adjusting later is not an acceptable workflow for a financial document.