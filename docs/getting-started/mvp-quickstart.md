# MVP Quickstart Guide

---

doc_id: GS-MVP-001
title: MVP Quickstart Guide
version: 1.0.0
status: approved
created: 2026-05-21
updated: 2026-05-21
author: Code Agent
reviewers: none
tags: getting-started, mvp, quickstart, setup
changelog:
  - version: 1.0.0
    date: 2026-05-21
    author: Code Agent
    note: Initial quickstart guide for MVP

---

## Overview

This guide will help you get the BillGen MVP running locally in under 10 minutes. The MVP includes:

- ✅ Centralized input validation with Zod schemas
- ✅ Authentication provider stub (demo user)
- ✅ Page scaffolds for invoices, receipts, and users
- ✅ CSV report generation endpoint
- ✅ Responsive navigation and layout

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or later ([Download](https://nodejs.org/))
- **npm** 9.x or later (comes with Node.js)
- **Git** (for cloning the repository)
- A code editor (VS Code recommended)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/billgen.git
cd billgen
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15.x
- React 19.x
- Zod (validation)
- Tailwind CSS (styling)
- TypeScript

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:

```env
# Database (SQLite for local development)
DATABASE_URL=file:./dev.db

# Upstash Redis (optional for MVP - uses in-memory fallback)
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# Company Configuration (optional - can be set via onboarding)
COMPANY_NAME=Your Company Name
COMPANY_BRAND=YourBrand
```

**Note**: For the MVP, you can leave Redis credentials empty. The app will use an in-memory data store for development.

### 4. Initialize the Database

```bash
npm run db:push
```

This creates the SQLite database and applies the schema.

### 5. Start the Development Server

```bash
npm run dev
```

The app will start at **http://localhost:3000**

## Accessing the MVP

### Main Pages

Once the dev server is running, navigate to:

| Page | URL | Description |
|------|-----|-------------|
| Home | http://localhost:3000 | Landing page |
| Dashboard | http://localhost:3000/dashboard | Main dashboard |
| Invoices | http://localhost:3000/invoices | Invoice list and management |
| Receipts | http://localhost:3000/receipts | Receipt list |
| Users | http://localhost:3000/users | User management (placeholder) |
| Onboarding | http://localhost:3000/onboarding | Company setup |

### Demo User

The MVP uses a demo authentication provider. You're automatically logged in as:

- **User ID**: `demo-user-001`
- **Name**: Demo User
- **Email**: demo@example.com

## Testing API Endpoints

### Create an Invoice

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "userID": "demo-user-001",
    "invoiceDate": "2026-05-21",
    "terms": "Due Upon Receipt",
    "dueDate": "2026-06-21",
    "currency": "USD",
    "billTo": "Acme Corp",
    "billToAddressLine": "123 Main St",
    "billToCityAddress": "San Francisco",
    "billToPostalAddress": "CA 94102",
    "billToCountry": "USA",
    "taxRate": 0.12,
    "invoiceItems": [
      {
        "itemID": "item-001",
        "description": "Consulting Services",
        "quantity": 10,
        "rate": 150.00,
        "date": "2026-05-21"
      }
    ]
  }'
```

### List Invoices

```bash
curl http://localhost:3000/api/invoices?userID=demo-user-001
```

### Generate CSV Report

```bash
curl "http://localhost:3000/api/reports/generate?type=invoice&userID=demo-user-001" \
  -o invoices-report.csv
```

## Project Structure

```
billgen/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   ├── invoices/           # Invoice pages
│   │   ├── receipts/           # Receipt pages
│   │   └── users/              # User management pages
│   ├── components/             # React components
│   │   └── ui/                 # UI primitives (Button, Table, etc.)
│   ├── lib/                    # Utilities and helpers
│   │   ├── auth.ts             # Authentication utilities
│   │   └── reporting/          # Report generation
│   ├── models/                 # Zod schemas (domain models)
│   ├── modules/                # Business logic modules
│   ├── providers/              # React context providers
│   └── schemas/                # Request/response schemas
├── docs/                       # Documentation
│   ├── decisions/              # Architecture Decision Records
│   ├── getting-started/        # Setup guides
│   └── plans/                  # Project plans
└── public/                     # Static assets
```

## Common Tasks

### View All Routes

The app includes these main routes:

- `/` — Home page
- `/dashboard` — Dashboard
- `/invoices` — Invoice list
- `/invoices/[id]` — Invoice detail
- `/receipts` — Receipt list
- `/users` — User management
- `/onboarding` — Company setup

### Access the Database

The SQLite database is stored at `./dev.db`. You can inspect it using:

```bash
# Using sqlite3 CLI
sqlite3 dev.db

# Or use a GUI tool like DB Browser for SQLite
```

### Check Logs

Development logs appear in the terminal where you ran `npm run dev`. Look for:

- API request logs
- Validation errors
- Database queries

## Troubleshooting

### Port 3000 Already in Use

If port 3000 is occupied, specify a different port:

```bash
PORT=3001 npm run dev
```

### Module Not Found Errors

Clear the Next.js cache and reinstall:

```bash
rm -rf .next node_modules
npm install
npm run dev
```

### TypeScript Errors

The MVP may show transient TypeScript errors in the editor. These typically resolve after:

1. Restarting the TypeScript server (VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
2. Waiting for the Next.js dev server to fully compile

### Database Issues

Reset the database:

```bash
rm dev.db
npm run db:push
```

## Next Steps

After getting the MVP running:

1. **Explore the UI**: Navigate through all pages to understand the layout
2. **Test API endpoints**: Use the curl examples above to create test data
3. **Review the code**: Start with `src/app/layout.tsx` and follow the imports
4. **Read the docs**: Check `docs/decisions/` for architectural decisions
5. **Plan enhancements**: See `docs/plans/implement-mvp.md` for post-MVP tasks

## Known Limitations (MVP)

- **No real authentication**: Demo user is hardcoded
- **No data persistence**: Uses in-memory storage (unless Redis is configured)
- **No automated tests**: Testing infrastructure exists but tests are not run in MVP
- **Placeholder UI**: User management page is a placeholder
- **CSV only**: Report generation supports CSV only (XLSX and PDF planned)

## Getting Help

- **Documentation**: See `docs/` directory
- **Architecture Decisions**: See `docs/decisions/`
- **Project Plans**: See `docs/plans/`
- **Code Comments**: Most files include inline documentation

## Contributing

This is an MVP. For post-MVP development:

1. Read `AGENTS.md` for project status
2. Check `docs/plans/` for planned work
3. Follow the patterns established in existing code
4. Add tests for new features (see `docs/architecture/testing-strategy.md`)

---

**Last Updated**: 2026-05-21  
**MVP Version**: 1.0.0  
**Maintainer**: Development Team