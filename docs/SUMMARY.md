# ICED TEA HOUSE — System at a Glance

## The Problem
Managing a tea house means juggling orders, inventory, finances, and staff — often with separate tools or manual tracking. Things get missed. Data is scattered. Decisions are delayed.

## The Solution
**One connected system** where every transaction automatically updates orders, inventory, finances, and reports — in real-time, from any device.

---

## How It Works (30-Second Overview)

```
   STAFF TAPS PRODUCT          SYSTEM AUTOMATICALLY
   ─────────────────          ─────────────────────
   "Mango Tea, extra ice"  →  ✓ Order created
   "Dine-in, Card"         →  ✓ Kitchen slip generated
                              ✓ 2.5% card fee calculated
                              ✓ Inventory tracked
                              ✓ Revenue recorded (or marked PR)
                              ✓ Profit calculated
                              ✓ Reports updated
                              ✓ Audit trail logged
```

---

## Key Features (What They Asked For → What We Built)

| They Need | We Built | Status |
|-----------|----------|--------|
| Dine-in / Takeaway / Delivery | Order type selector on every order | ✅ Done |
| Kitchen slip with modifications | Print receipt with per-item instructions ("extra ice", "no boba") | ✅ Done |
| Card payment charges (2.5%) | Auto-calculated, configurable % in Settings | ✅ Done |
| PR / Complimentary drinks | Toggle tracks inventory, excludes from revenue | ✅ Done |
| Menu pictures for quick ordering | Product images on tap-to-add grid | ✅ Done |
| Multiple devices, same data | Cloud-hosted, any browser, JWT auth | ✅ Done |
| Cash vs Card tracking | Payment method on every order, filterable reports | ✅ Done |
| Future Foodpanda integration | Order source field ready (Walk-in, Phone, Foodpanda, etc.) | ✅ Ready |
| Tablet/touch friendly | Responsive design, large tap targets, press feedback | ✅ Done |
| Scalable | Multi-location, roles, modular architecture | ✅ Done |

---

## Who Can Do What

```
OWNER     → Everything (settings, team, reports, delete orders)
MANAGER   → Orders, inventory, purchases, expenses, reports
STAFF     → Take orders, view products, record payments
```

---

## Access From Anywhere

```
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│  Counter   │  │  Kitchen   │  │  Manager   │  │  Partner   │
│  Computer  │  │  Tablet    │  │  Phone     │  │  Abroad    │
│            │  │            │  │            │  │            │
│ Take orders│  │ View queue │  │ Check sales│  │ View data  │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │               │
      └───────────────┴───────┬───────┴───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  http://173.212... │
                    │  Same live data    │
                    │  for everyone      │
                    └───────────────────┘
```

---

## Reports Available

- **Sales** — Daily/weekly/monthly revenue, order counts
- **Profit** — Gross profit, COGS, margins
- **Products** — Top sellers, slow movers
- **Inventory** — Stock levels, movement history
- **Expenses** — By category, trends
- **Purchases** — Supplier spend, order history
- **Customers** — Top spenders, order frequency
- **Financial** — Cash flow, balance sheet, ledger

**Export:** PDF (branded) or CSV (spreadsheet)

---

## Infrastructure

| What | How |
|------|-----|
| **Server** | Contabo VPS (Ubuntu, 10GB SSD) |
| **Uptime** | PM2 auto-restart, 24/7 |
| **Backups** | Daily at 3 AM, unlimited retention |
| **Deploy** | Push to GitHub → Auto-deploys in ~3 minutes |
| **Security** | JWT auth, role-based access, audit trail |
| **Support** | Ongoing development team available |

---

## One-Line Summary

> **Iced Tea House now has a professional business operating system where one tap on the screen updates everything — orders, kitchen, inventory, finances, and reports — accessible from any device, anywhere in the world.**
