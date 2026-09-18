# ICED TEA HOUSE — Business Operating System
## System Workflow & Feature Documentation

**Version:** 1.0  
**Date:** September 2026  
**Prepared for:** Iced Tea House Management

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Workflows](#4-core-workflows)
   - 4.1 Order Management
   - 4.2 Inventory Management
   - 4.3 Purchase Management
   - 4.4 Expense Tracking
   - 4.5 Financial Management
   - 4.6 Reporting & Analytics
5. [Feature-to-Requirements Mapping](#5-feature-to-requirements-mapping)
6. [Technical Infrastructure](#6-technical-infrastructure)
7. [Multi-Device & Access](#7-multi-device--access)
8. [Future Roadmap](#8-future-roadmap)

---

## 1. Executive Summary

The **Iced Tea House Business Operating System** is a cloud-based, centralized platform that connects every aspect of the business — from taking an order to tracking inventory, managing purchases, recording expenses, and viewing financial reports — all in one dashboard.

**One transaction updates everything automatically.** When an order is placed:
- Inventory is tracked
- Revenue is recorded
- Profit is calculated
- Reports are updated
- Audit trail is logged

The system is accessible from **any device with a browser** — desktop, tablet, or phone — and all users share the same live data.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ICED TEA HOUSE SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Desktop  │   │  Tablet  │   │  Phone   │   │  Remote  │ │
│  │ (Counter) │   │ (Kitchen)│   │ (Staff)  │   │ (Partner)│ │
│  └─────┬────┘   └─────┬────┘   └─────┬────┘   └─────┬────┘ │
│        │              │              │              │        │
│        └──────────────┴──────┬───────┴──────────────┘        │
│                              │                               │
│                    ┌─────────▼─────────┐                     │
│                    │   Next.js Server   │                     │
│                    │   (Port 3111)      │                     │
│                    │   JWT Auth + RBAC  │                     │
│                    └─────────┬─────────┘                     │
│                              │                               │
│                    ┌─────────▼─────────┐                     │
│                    │   SQLite Database  │                     │
│                    │   (Single File)    │                     │
│                    │   Auto-Backed Up   │                     │
│                    └───────────────────┘                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  NGINX (Port 80)                     │    │
│  │          Reverse Proxy → App (Port 3111)             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PM2 Process Manager                     │    │
│  │         Auto-restart, Memory limits                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           GitHub Actions (Auto-Deploy)               │    │
│  │       Push to master → Auto build & deploy           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (e.g., "Complete Order")
        │
        ▼
┌───────────────────┐
│  1. Validate Data │  Zod schema validation
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  2. Auth Check    │  JWT session verification
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  3. Business Logic│  createOrder / completeOrder
└────────┬──────────┘
         │
    ┌────┴────┬──────────┬───────────┬──────────┐
    ▼         ▼          ▼           ▼          ▼
┌────────┐┌────────┐┌─────────┐┌─────────┐┌─────────┐
│ Order  ││Payment ││Inventory││ Finance ││  Audit  │
│ Record ││ Record ││ Movement││   Txn   ││   Log   │
└────────┘└────────┘└─────────┘└─────────┘└─────────┘
    │         │          │           │          │
    └─────────┴──────────┴───────────┴──────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Reports Updated │
              │  Dashboard KPIs  │
              │  Notifications   │
              └─────────────────┘
```

---

## 3. User Roles & Permissions

| Role | Access Level | Key Permissions |
|------|-------------|-----------------|
| **Owner** | Full | All operations, delete orders, manage team, system settings, view all reports |
| **Manager** | Operational | Create/complete/cancel orders, manage inventory, view reports, add customers |
| **Staff** | Limited | Create orders, view products, record payments |

### Permission Matrix

| Action | Owner | Manager | Staff |
|--------|:-----:|:-------:|:-----:|
| Take orders | ✅ | ✅ | ✅ |
| Complete orders | ✅ | ✅ | ✅ |
| Cancel orders | ✅ | ✅ | ❌ |
| Delete orders | ✅ | ❌ | ❌ |
| Manage products | ✅ | ✅ | ❌ |
| Adjust inventory | ✅ | ✅ | ❌ |
| Create purchases | ✅ | ✅ | ❌ |
| Record expenses | ✅ | ✅ | ❌ |
| View financial reports | ✅ | ✅ | ❌ |
| View sales reports | ✅ | ✅ | ✅ |
| Manage team members | ✅ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ |
| View audit log | ✅ | ❌ | ❌ |

---

## 4. Core Workflows

### 4.1 Order Management

This is the **primary workflow** — the heart of the system.

#### Order Creation Flow

```
Staff selects "New Order"
        │
        ▼
┌─────────────────────────────────┐
│  STEP 1: Select Order Type      │
│  ○ Dine-in  ○ Takeaway  ○ Delivery │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  STEP 2: Select Source          │
│  ○ Walk-in  ○ Phone  ○ Foodpanda │
│  ○ Uber Eats  ○ Website  ○ Other │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  STEP 3: Add Items              │
│  • Tap product card to add      │
│  • Quantity +/- controls        │
│  • Add per-item instructions:   │
│    "Extra ice, no boba,         │
│     less sugar, no straw"       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  STEP 4: Checkout Details       │
│  • Customer (optional)          │
│  • Discount                     │
│  • Payment method               │
│    (Cash / Card / Transfer)     │
│  • PR/Complimentary toggle      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  STEP 5: Save or Complete       │
│                                 │
│  [Save Pending]                 │
│  → Order saved, inventory held  │
│                                 │
│  [Complete Sale]                │
│  → Inventory deducted           │
│  → Revenue recorded             │
│  → COGS calculated              │
│  → Gross profit computed        │
│  → Receipt generated            │
└─────────────────────────────────┘
```

#### Order Status Flow

```
┌─────────┐    ┌───────────┐    ┌───────────┐    ┌─────────┐    ┌───────────┐
│ PENDING │ →  │ CONFIRMED │ →  │ PREPARING │ →  │  READY  │ →  │ COMPLETED │
└─────────┘    └───────────┘    └───────────┘    └─────────┘    └───────────┘
     │              │                │                │
     │              │                │                │
     └──────────────┴────────────────┴────────────────┘
                              │
                              ▼
                     ┌─────────────┐
                     │ CANCELLED   │
                     └─────────────┘
```

#### PR / Complimentary Orders

```
User toggles "PR / Comp" button
        │
        ▼
┌─────────────────────────────────┐
│  Purple indicator appears       │
│  "PR Order" shown               │
│  Total forced to $0 / FREE      │
│  Payment forced to PAID         │
│  Status forced to COMPLETED     │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌──────────┐   ┌──────────────┐
│ Inventory│   │ Revenue      │
│ DEDUCTED │   │ NOT RECORDED │
│ (tracked)│   │ (excluded)   │
└──────────┘   └──────────────┘
```

**Result:** PR drinks appear in order records and inventory tracking but are clearly separated from paid revenue in reports.

#### Card Payment Fee

```
Payment method = CARD
        │
        ▼
┌─────────────────────────────────┐
│  Auto-calculate fee:            │
│  Subtotal × 2.5% = Card Fee     │
│                                 │
│  Example:                       │
│  Subtotal: PKR 1,000            │
│  Card fee: PKR 25               │
│  Total:    PKR 1,025            │
│                                 │
│  Fee % is configurable in       │
│  Settings → Payment & Expenses  │
└─────────────────────────────────┘
```

#### Receipt Generation

Two receipts are generated for every order:

**Customer Receipt:**
```
┌───────────────────────────────┐
│      ICED TEA HOUSE           │
│       @icedteahouse           │
│───────────────────────────────│
│  ORD-001234 · Dine-in         │
│  Date: Sep 18, 2026 2:30 PM   │
│  Customer: Ahmed               │
│  Source: Walk-in               │
│  ★ PR / COMPLIMENTARY          │  ← if applicable
│───────────────────────────────│
│  Mango Tea      × 2   400     │
│    ↳ Extra ice, no boba        │  ← per-item instructions
│  Peach Oolong   × 1   250     │
│    ↳ Less sugar                │
│───────────────────────────────│
│  Subtotal:          650        │
│  Card fee (2.5%):    16       │  ← if card payment
│  TOTAL:             FREE       │  ← if PR order
│  Paid:               0         │
│───────────────────────────────│
│   Thank you! Visit @icedteahouse│
└───────────────────────────────┘
```

**Kitchen Slip:**
```
┌───────────────────────────────┐
│  KITCHEN ORDER                │
│  ORD-001234 · Dine-in         │
│  Customer: Ahmed               │
│───────────────────────────────│
│  □ Mango Tea × 2               │
│    ⚠ EXTRA ICE, NO BOBA       │
│  □ Peach Oolong × 1            │
│    ⚠ LESS SUGAR               │
│───────────────────────────────│
│  Status: PREPARING             │
└───────────────────────────────┘
```

---

### 4.2 Inventory Management

```
┌─────────────────────────────────────────────────────────────┐
│                    INVENTORY LIFECYCLE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STOCK IN:                    STOCK OUT:                     │
│  ├─ Purchase received         ├─ Order completed             │
│  ├─ Manual adjustment (+)     ├─ Manual adjustment (-)       │
│  └─ Opening stock             └─ Damaged/discarded           │
│                                                              │
│  Every change creates an Inventory Movement record:          │
│  • Product name                                        │
│  • Movement type (SALE/PURCHASE/ADJUSTMENT/RETURN/DAMAGE)   │
│  • Quantity (positive=in, negative=out)                     │
│  • Balance after movement                                   │
│  • Reference (order number, purchase number, etc.)          │
│  • Who made the change                                      │
│  • Timestamp                                                │
│                                                              │
│  AUTO-ALERTS:                                                │
│  • Low stock (below reorder level) → Notification           │
│  • Out of stock → Notification                              │
│  • Both visible on Dashboard                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Stock Movement Flow

```
Product: Mango Syrup (current stock: 50)
        │
        ├── Order #00123 completed (-10) ──→ New stock: 40
        │                                    Movement: SALE
        │
        ├── Purchase #PUR-001 received (+100) ──→ New stock: 140
        │                                         Movement: PURCHASE
        │
        ├── Manual adjustment (-5) ──→ New stock: 135
        │                             Movement: ADJUSTMENT
        │
        └── Current stock: 135
            Full history available on product detail page
```

---

### 4.3 Purchase Management

```
┌──────────────────┐
│ Create Purchase  │
│ (Select supplier │
│  + items)        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Purchase PENDING │
│ ( awaiting       │
│   delivery )     │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────────┐
│RECEIVED│ │ CANCELLED  │
└────┬───┘ └────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  RECEIVE PURCHASE:              │
│  1. Increase product stock      │
│  2. Create inventory movements  │
│  3. Record payment (if paid)    │
│  4. Update financial ledger     │
│  5. Check low stock alerts      │
└─────────────────────────────────┘
```

---

### 4.4 Expense Tracking

```
┌─────────────────────────────────┐
│  Record Expense                 │
│                                 │
│  • Category (Rent, Utilities,   │
│    Salaries, Marketing, etc.)   │
│  • Description                  │
│  • Amount                       │
│  • Payment method               │
│  • Date                         │
│  • Optional receipt/photo       │
│  • Notes                        │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌──────────┐   ┌──────────────┐
│ Expense  │   │ Financial    │
│ Recorded │   │ Transaction  │
│          │   │ (money out)  │
└──────────┘   └──────────────┘
                     │
                     ▼
              ┌─────────────┐
              │ Balance     │
              │ Updated     │
              └─────────────┘
```

**Auto-alert:** Expenses ≥ PKR 50,000 trigger a notification.

---

### 4.5 Financial Management

```
┌─────────────────────────────────────────────────────────────┐
│                    FINANCIAL LEDGER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MONEY IN:                    MONEY OUT:                     │
│  ├─ Sales (orders)           ├─ Purchases                    │
│  ├─ Payments received        ├─ Expenses                     │
│  └─ Adjustments (+)          ├─ Refunds (cancelled orders)   │
│                              └─ Adjustments (-)              │
│                                                              │
│  BALANCE = Running total of all transactions                 │
│                                                              │
│  FILTER BY:                                                  │
│  • Payment method (Cash / Card / Bank Transfer)              │
│  • Date range                                                │
│  • Transaction type                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.6 Reporting & Analytics

```
┌─────────────────────────────────────────────────────────────┐
│                     REPORTS DASHBOARD                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  SALES   │ │  PROFIT  │ │ PRODUCTS │ │INVENTORY │       │
│  │          │ │          │ │          │ │          │       │
│  │ Revenue  │ │ Gross    │ │ Top      │ │ Stock    │       │
│  │ by day/  │ │ profit   │ │ sellers  │ │ levels   │       │
│  │ week/    │ │ margin   │ │ by qty/  │ │ movement │       │
│  │ month    │ │ COGS     │ │ revenue  │ │ history  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │EXPENSES  │ │PURCHASES │ │CUSTOMERS │ │FINANCIAL │       │
│  │          │ │          │ │          │ │          │       │
│  │ By       │ │ Supplier │ │ Top      │ │ Cash     │       │
│  │ category │ │ spend    │ │ spenders │ │ flow     │       │
│  │ trends   │ │ history  │ │ order    │ │ Balance  │       │
│  │          │ │          │ │ count    │ │ sheet    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  EXPORT: PDF (branded)  |  CSV (spreadsheet)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Feature-to-Requirements Mapping

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| **1** | Order Types (Dine-in, Takeaway, Delivery) | ✅ Complete | `OrderType` enum, UI selector on new order form, displayed on order detail + list + receipts |
| **2** | Kitchen Slips & Customer Slips | ✅ Complete | Print receipt function with order type, per-item instructions, source. Kitchen view shows items + modifications |
| **3** | Card/POS Payment Charges (configurable %) | ✅ Complete | Auto-calculated 2.5% fee on card payments, configurable in Settings, shown in totals + receipts |
| **4** | PR / Complimentary Drinks | ✅ Complete | Toggle on order form, tracks inventory, excludes from revenue, purple PR badge on orders, filterable in reports |
| **5** | Menu Images / Quick Order Taking | ✅ Complete | `imageUrl` field on products, image display on order grid + product cards, tap-to-add interface |
| **6** | Multiple Devices & Shared Data | ✅ Complete | SQLite on VPS, JWT auth, role-based access, any browser/device, remote access via URL |
| **7** | Cash vs Card Sales | ✅ Complete | Payment method stored on every order, filterable in Finance ledger, shown in order list |
| **8** | Future Platform Integration | ✅ Ready | `OrderSource` enum (Walk-in, Phone, Foodpanda, Uber Eats, Website, Other), architecture supports adding webhook endpoints |
| **9** | Touchscreen / Tablet | ✅ Ready | Responsive grid, large tap targets (`h-8 w-8` buttons), `active:scale-[0.98]` press feedback, mobile-first layout |
| **10** | Scalability | ✅ Ready | Multi-location support, role-based access, modular architecture, configurable settings |
| **11** | Ongoing Support | ✅ Available | Development team accessible for issues, bug fixes, and feature additions |

---

## 6. Technical Infrastructure

### Server Details

| Component | Detail |
|-----------|--------|
| **Server** | Contabo VPS 10 SSD (Ubuntu 24.04) |
| **IP Address** | 173.212.211.175 |
| **App URL** | http://173.212.211.175:3111 |
| **Process Manager** | PM2 (auto-restart, memory limits) |
| **Web Server** | Nginx (reverse proxy, port 80 → 3111) |
| **Database** | SQLite (single file, zero config) |
| **Node.js** | v22.x |

### Deployment Pipeline

```
Developer pushes code
        │
        ▼
┌───────────────────┐
│   GitHub Repo     │
│   (master branch) │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  GitHub Actions   │
│  (auto-trigger)   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  SSH to VPS       │
│  1. git pull      │
│  2. npm ci        │
│  3. prisma generate│
│  4. prisma db push │
│  5. next build     │
│  6. pm2 restart    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Live App Updated  │
│  (zero downtime)   │
└───────────────────┘
```

### Backup System

| Setting | Value |
|---------|-------|
| **Frequency** | Daily at 3:00 AM |
| **Retention** | Unlimited (all backups kept) |
| **Method** | Compressed copy of database file |
| **Size** | ~87KB per backup |
| **Location** | `/var/www/iced-tea-house/backups/` |
| **Restore** | Copy backup file over `prod.db` |

### Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | JWT tokens in httpOnly cookies |
| **Password Hashing** | bcryptjs |
| **Session Duration** | 14 days |
| **Role-Based Access** | Owner > Manager > Staff hierarchy |
| **API Protection** | Server-side session validation on every request |
| **Audit Trail** | Every mutation logged with user, action, entity, timestamp |

---

## 7. Multi-Device & Access

### How It Works

```
┌─────────────────────────────────────────────────────┐
│                CENTRAL DATABASE                      │
│              (SQLite on VPS)                         │
│                                                      │
│   All data stored here:                             │
│   • Orders, Products, Inventory                     │
│   • Customers, Suppliers                            │
│   • Financial transactions                          │
│   • Audit logs, Notifications                       │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  Counter PC  │ │  Tablet  │ │  Owner Phone │
│  (Taking     │ │ (Kitchen │ │  (Checking   │
│   orders)    │ │  display)│ │   sales)     │
└──────────────┘ └──────────┘ └──────────────┘

All devices see the SAME live data.
No separate records. No syncing issues.
```

### Remote Access

Partners or owners in another country can:
1. Open browser on any device
2. Navigate to `http://173.212.211.175:3111`
3. Log in with their credentials
4. View all business data in real-time

---

## 8. Future Roadmap

### Phase 2 (Planned)

| Feature | Description |
|---------|-------------|
| **Foodpanda/Uber Eats Integration** | Webhook endpoints to receive external orders, map to order source |
| **Kitchen Display System (KDS)** | Real-time kitchen screen showing order queue with timer |
| **Thermal Printer Support** | Direct printing to receipt printers via WebSocket |
| **SMS Receipts** | Send order confirmations via SMS |
| **Customer Loyalty** | Points system, repeat customer tracking |

### Phase 3 (Future)

| Feature | Description |
|---------|-------------|
| **Multi-Branch** | Multiple locations with separate + consolidated reporting |
| **Accounting Export** | QuickBooks / Xero integration |
| **Inventory Forecasting** | AI-based demand prediction |
| **Mobile App** | Native iOS/Android app for staff |
| **Online Ordering** | Customer-facing ordering website |

---

## Appendix A: Database Schema (Simplified)

```
Business ─┬── User (auth, roles)
           ├── Location (multi-branch)
           ├── Category ──── Product (images, pricing, stock)
           │                    ├── OrderItem (instructions)
           │                    └── InventoryMovement
           ├── Customer ──── Order ─┬── OrderItem
           │                        ├── Payment
           │                        └── Sale
           ├── Supplier ──── Purchase ──── PurchaseItem
           ├── Expense
           ├── FinancialTransaction (ledger)
           ├── Notification
           └── AuditLog
```

## Appendix B: Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@icedteahouse.com | password123 |
| Manager | manager@icedteahouse.com | password123 |
| Staff | staff@icedteahouse.com | password123 |

---

*Document generated for Iced Tea House Business Operating System v1.0*
