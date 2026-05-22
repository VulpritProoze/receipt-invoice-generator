# How to Use BillGen

---
doc_id: GS-004
title: How to Use BillGen
version: 1.0.0
status: active
created: 2026-05-22
updated: 2026-05-22
author: Docs Agent
reviewers: 
tags: getting-started, usage
changelog:
  - version: 1.0.0
    date: 2026-05-22
    author: Docs Agent
    note: Initial creation
---

## Prerequisites

- [ ] Node.js installed (v18+)
- [ ] Dependencies installed via `npm install`
- [ ] Environment file `.env.local` configured (you can copy `.env.example` to `.env.local`)

## Steps

### Step 1: Run the Application Locally

Start the local Next.js development server:

```bash
npm run dev
```

The application will use the local SQLite database (`.dev/billgen.db`) by default. Open your browser and navigate to `http://localhost:3000`.

### Step 2: Log In

BillGen uses single-tenant authentication. When you first access the application, you will be prompted to log in. 

Use the credentials configured in your `.env.local` file:
- **Username**: Look for the `ADMIN_USERNAME` value (e.g., `admin`)
- **Password**: Look for the `ADMIN_PASSWORD` value (e.g., `password`)

### Step 3: Create an Invoice

1. After logging in, navigate to the **Invoices** page using the top navigation bar.
2. Click the **Create Invoice** button.
3. Fill out the invoice details, including client information and invoice items. The application will automatically calculate the totals in real-time.
4. Save the invoice.

### Step 4: Generate Reports

You can generate reports for your invoices and receipts in multiple formats:
1. Navigate to either the **Invoices** or **Receipts** page.
2. Select the records you wish to include in your report.
3. Use the Export buttons to choose your desired format:
   - **CSV**: Best for importing into accounting software.
   - **XLSX**: Best for sharing tabular data via Excel.
   - **PDF**: Best for sharing finalized documents directly with clients.

## Verification

To confirm your data is saving correctly, restart your development server (`Ctrl+C` then `npm run dev`) and log back in. Your created invoices and settings should still be visible because they persist to the local SQLite database.

## Troubleshooting

| Symptom | Likely Cause | Fix |
| ------- | ------------ | --- |
| Invalid credentials | Using incorrect login details | Check your `.env.local` file for the exact `ADMIN_USERNAME` and `ADMIN_PASSWORD` values. |
| Missing database | First run without SQLite setup | The app automatically creates `.dev/billgen.db` when you start it, but ensure your app has folder write permissions. |

## Next Steps

- Explore the [Deployment Guide](./deployment.md) to launch your app into production.
