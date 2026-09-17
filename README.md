# ICED TEA HOUSE — Business Operating System

A comprehensive business management platform built for tea houses, cafes, and small retail businesses. Manage orders, inventory, purchases, expenses, customers, and finances from a single connected dashboard.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | Prisma 6 + SQLite |
| Styling | Tailwind CSS v4 |
| UI | React 19, shadcn-style components |
| Charts | Recharts 3 |
| PDF | jsPDF + jspdf-autotable |
| Email | Nodemailer |
| Validation | Zod 4 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Notifications | Sonner |

## Features

- **Dashboard** — KPIs, sales trends, top products, low stock alerts, automated insights
- **Orders** — Create, track, complete, cancel, and take payments on orders
- **Products** — Full product catalog with SKU, pricing, categories, and stock levels
- **Inventory** — Stock tracking with movement history, adjustments, low-stock alerts
- **Purchases** — Supplier purchase orders with receive/cancel workflows
- **Expenses** — Track business expenses by category with payment method
- **Customers** — Customer directory with order history
- **Finance** — General ledger, cash flow, accounts receivable/payable
- **Reports** — Sales, profit, product, inventory, expense, purchase, customer, and financial reports
- **Settings** — Business info, user profile, password management
- **PDF Export** — Branded PDF reports for all report types
- **Email Receipts** — Send HTML order receipts via SMTP
- **Multi-Location** — Support for multiple business locations
- **Role-Based Auth** — Owner, Manager, and Staff roles with permission levels
- **Demo Data** — One-click seed with realistic sample data

## Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm, yarn, or pnpm

### Install

```bash
git clone <repository-url>
cd iced-tea-house
npm install
```

### Setup

```bash
# Copy environment file
cp .env.example .env

# Push database schema
npm run db:push

# Seed demo data
npm run db:seed
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

After seeding, use any of these accounts:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@icedteahouse.com | password123 |
| Manager | manager@icedteahouse.com | password123 |
| Staff | staff@icedteahouse.com | password123 |

## Project Structure

```
iced-tea-house/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                 # Demo data seeder
│   └── dev.db                  # SQLite database
├── src/
│   ├── app/
│   │   ├── (app)/              # Authenticated app pages
│   │   ├── (auth)/             # Login page
│   │   ├── api/                # API routes
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing/redirect
│   │   └── globals.css         # Global styles
│   ├── actions/                # Next.js Server Actions
│   │   ├── auth.ts             # Login, logout, register
│   │   ├── orders.ts           # Order CRUD + payments
│   │   ├── products.ts         # Product CRUD + inventory
│   │   ├── purchases.ts        # Purchase orders
│   │   ├── expenses.ts         # Expense tracking
│   │   ├── customers.ts        # Customer management
│   │   ├── suppliers.ts        # Supplier management
│   │   ├── categories.ts       # Product categories
│   │   ├── locations.ts        # Multi-location support
│   │   ├── settings.ts         # Business & profile settings
│   │   ├── emails.ts           # Receipt email sending
│   │   ├── search.ts           # Global search
│   │   ├── notifications.ts    # Notification management
│   │   └── seed.ts             # Demo data seeding
│   ├── components/
│   │   ├── charts/             # Recharts components
│   │   ├── layout/             # Sidebar, header, nav
│   │   ├── ui/                 # Reusable UI primitives
│   │   └── page-header.tsx     # Page header component
│   └── lib/
│       ├── business.ts         # Core business logic
│       ├── analytics.ts        # Dashboard analytics
│       ├── reports.ts          # Report generation
│       ├── pdf-export.ts       # PDF report export
│       ├── email.ts            # Email receipt generation
│       ├── auth.ts             # Auth helpers & JWT
│       ├── prisma.ts           # Prisma client instance
│       ├── seed.ts             # Seed logic
│       ├── utils.ts            # Utility functions
│       ├── validations.ts      # Zod schemas
│       ├── actions.ts          # Action helpers (ok, fail)
│       └── __tests__/          # Unit tests
├── .env                        # Environment variables
├── package.json
├── next.config.ts
└── tsconfig.json
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` | Database connection string |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing |
| `SMTP_HOST` | No | — | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | — | Sender email address |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset database and re-seed |
| `npm run lint` | Run ESLint |

## License

MIT
