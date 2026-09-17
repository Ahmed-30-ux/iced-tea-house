# API Reference

Server Actions and library functions for the Iced Tea House Business OS.

---

## Server Actions

All actions are defined in `src/actions/*.ts` and use Next.js Server Actions (`"use server"`). They authenticate via `requireAuth()` and return `ActionResult<T>` with `{ ok: boolean, data?: T, error?: string }`.

### Auth — `src/actions/auth.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `loginAction` | `prevState, formData: { email, password }` | `ActionResult<{ redirect: string }>` | Authenticate user, create session, redirect to `/dashboard` |
| `logoutAction` | — | Redirect | Destroy session and redirect to `/login` |
| `registerUserAction` | `prevState, formData: { name, email, password?, role? }` | `ActionResult<User>` | Create a new user (requires authenticated session) |

### Orders — `src/actions/orders.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `createOrderAction` | `prevState, formData: { customerId?, items[], discount?, paymentMethod?, paymentStatus?, amountPaid?, status?, notes? }` | `ActionResult<Order>` | Create a new order with line items |
| `completeOrderAction` | `orderId: string` | `ActionResult<{ orderId }>` | Complete order: deduct inventory, compute COGS, record revenue + sales |
| `cancelOrderAction` | `orderId: string` | `ActionResult<{ orderId }>` | Cancel order: restore inventory, record refund outflow |
| `setOrderStatusAction` | `orderId: string, status: string` | `ActionResult<{ orderId, status }>` | Update order status (delegates to complete/cancel when appropriate) |
| `addPaymentAction` | `orderId: string, amount: number, method: string` | `ActionResult<{ orderId }>` | Record a payment against an order |
| `deleteOrderAction` | `orderId: string` | `ActionResult<{ orderId }>` | Delete order (OWNER role only, cannot delete completed orders) |

### Products — `src/actions/products.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `createProductAction` | `prevState, formData: { name, sku?, categoryId?, sellingPrice, costPrice, reorderLevel?, supplier?, openingStock? }` | `ActionResult<Product>` | Create product with optional opening stock |
| `updateProductAction` | `prevState, formData: { id, name, sku?, categoryId?, sellingPrice, costPrice, reorderLevel?, supplier?, status? }` | `ActionResult<Product>` | Update product details |
| `adjustInventoryAction` | `productId: string, quantity: number, type: string, notes?: string` | `ActionResult<{ productId }>` | Manual inventory adjustment (positive = in, negative = out) |

### Purchases — `src/actions/purchases.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `createPurchaseAction` | `prevState, formData: { supplierId?, items[], paymentStatus?, paymentMethod?, amountPaid?, notes? }` | `ActionResult<Purchase>` | Create purchase order with line items |
| `receivePurchaseAction` | `purchaseId: string` | `ActionResult<{ purchaseId }>` | Receive purchase: increase inventory, record money out |
| `cancelPurchaseAction` | `purchaseId: string` | `ActionResult<{ purchaseId }>` | Cancel a pending purchase |

### Expenses — `src/actions/expenses.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `createExpenseAction` | `prevState, formData: { category, description, amount, paymentMethod, notes? }` | `ActionResult<Expense>` | Record an expense and financial outflow |

### Customers — `src/actions/customers.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `createCustomerAction` | `prevState, formData: { name, phone?, email?, notes? }` | `ActionResult<Customer>` | Create a new customer |
| `updateCustomerAction` | `prevState, formData: { id, name, phone?, email?, notes? }` | `ActionResult<Customer>` | Update customer details |

### Suppliers — `src/actions/suppliers.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `createSupplierAction` | `prevState, formData: { name, phone?, email?, notes? }` | `ActionResult<Supplier>` | Create a new supplier |

### Categories — `src/actions/categories.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `createCategoryAction` | `prevState, formData: { name, description? }` | `ActionResult<Category>` | Create product category (unique per business) |
| `deleteCategoryAction` | `id: string` | `ActionResult<{ id }>` | Delete category (fails if products assigned) |

### Locations — `src/actions/locations.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `getLocationsAction` | — | `ActionResult<Location[]>` | Get all active locations |
| `createLocationAction` | `prevState, formData: { name, address?, phone? }` | `ActionResult<Location>` | Create a new location |
| `updateLocationAction` | `id: string, data: { name?, address?, phone? }` | `ActionResult<Location>` | Update location details |
| `deleteLocationAction` | `id: string` | `ActionResult<{ success: true }>` | Soft-delete (deactivate) a location |

### Settings — `src/actions/settings.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `updateBusinessInfoAction` | `prevState, formData: { name, tagline?, instagram?, currency? }` | `ActionResult<Business>` | Update business profile |
| `updateProfileAction` | `prevState, formData: { name, email }` | `ActionResult<{ success: true }>` | Update user name and email |
| `changePasswordAction` | `prevState, formData: { currentPassword, newPassword }` | `ActionResult<{ success: true }>` | Change password (min 6 chars) |

### Emails — `src/actions/emails.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `sendOrderReceiptAction` | `orderId: string` | `ActionResult<{ sent: true, to: string }>` | Send HTML receipt email for a completed order |

### Search — `src/actions/search.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `globalSearch` | `query: string` | `ActionResult<SearchData>` | Search orders, products, customers, and purchases by name/number/SKU |

### Notifications — `src/actions/notifications.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `getNotifications` | — | `ActionResult<Notification[]>` | Get latest 20 notifications |
| `markNotificationRead` | `id: string` | `ActionResult<{ success: true }>` | Mark single notification as read |
| `markAllNotificationsRead` | — | `ActionResult<{ success: true }>` | Mark all notifications as read |

### Seed — `src/actions/seed.ts`

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `seedDemoDataAction` | — | `ActionResult<{ seeded: true } \| { skipped: true }>` | Seed demo data (skips if data exists) |

---

## Library Functions

### Business Logic — `src/lib/business.ts`

Core business operations that enforce multi-tenancy, write audit logs, and trigger notifications.

| Function | Parameters | Return | Description |
|----------|-----------|--------|-------------|
| `writeAudit` | `businessId, user, action, entityType, entityId, details?` | `Promise<void>` | Write an audit log entry |
| `notify` | `businessId, type, title, message` | `Promise<void>` | Create a notification |
| `checkLowStock` | `businessId` | `Promise<Product[]>` | Check for low/out-of-stock products, create alerts |
| `createOrder` | `{ session, customerId?, items, discount?, paymentMethod?, ... }` | `Promise<Order>` | Create order, record payment, write audit |
| `addPayment` | `{ session, orderId, amount, method }` | `Promise<Order>` | Record payment, update payment status |
| `completeOrder` | `{ session, orderId }` | `Promise<void>` | Deduct inventory, compute COGS, record revenue + sales |
| `cancelOrder` | `{ session, orderId, reason? }` | `Promise<void>` | Reverse inventory, record refund, cancel order |
| `updateOrderStatus` | `{ session, orderId, status }` | `Promise<void>` | Update status (delegates to complete/cancel) |
| `createProduct` | `{ session, name, sku?, categoryId?, sellingPrice, costPrice, ... }` | `Promise<Product>` | Create product with optional opening stock |
| `updateProduct` | `{ session, id, name, sku?, ... }` | `Promise<Product>` | Update product fields |
| `adjustInventory` | `{ session, productId, quantity, type, notes? }` | `Promise<InventoryMovement>` | Manual stock adjustment |
| `createPurchase` | `{ session, supplierId?, items, ... }` | `Promise<Purchase>` | Create purchase order |
| `receivePurchase` | `{ session, purchaseId }` | `Promise<void>` | Increase inventory, record money out |
| `cancelPurchase` | `{ session, purchaseId }` | `Promise<void>` | Cancel a pending purchase |
| `createExpense` | `{ session, category, description, amount, ... }` | `Promise<Expense>` | Record expense and financial outflow |
| `createCustomer` | `{ session, name, phone?, email?, notes? }` | `Promise<Customer>` | Create customer |
| `updateCustomer` | `{ session, id, name, ... }` | `Promise<Customer>` | Update customer |
| `createSupplier` | `{ session, name, phone?, email?, notes? }` | `Promise<Supplier>` | Create supplier |
| `recordFinancialAdjustment` | `{ session, type, description, moneyIn, moneyOut, ... }` | `Promise<FinancialTransaction>` | Record manual financial adjustment |
| `getLastBalance` | `businessId` | `Promise<number>` | Get latest ledger balance |

### Analytics — `src/lib/analytics.ts`

Dashboard analytics and real-time metrics.

| Function | Parameters | Return | Description |
|----------|-----------|--------|-------------|
| `getRange` | `key, customFrom?, customTo?` | `DateRange` | Resolve range key ("today", "week", "month", "7d", "30d", "3m", "year", "custom") to date range |
| `getFinancialMetrics` | `businessId, range` | `Metrics` | Revenue, COGS, gross profit, expenses, net profit, AOV |
| `getDashboardData` | `businessId` | `DashboardData` | Full dashboard: KPIs, low stock, recent orders, top products, sales trend, expenses, insights |
| `getSalesTrend` | `businessId, rangeKey, customFrom?, customTo?` | `TrendPoint[]` | Daily/monthly sales, orders, profit trend |
| `getSalesByHour` | `businessId` | `HourlyData[]` | Sales aggregated by hour of day |
| `getSalesByDay` | `businessId` | `DailyData[]` | Sales aggregated by day of week |
| `getCategoryRevenue` | `businessId` | `CategoryRevenue[]` | Revenue by product category |
| `getProductPerformance` | `businessId` | `ProductPerf[]` | Product performance metrics |
| `getInventorySummary` | `businessId` | `InventorySummary` | Stock value, retail value, incoming/outgoing, low/out counts |
| `getLedger` | `businessId, filter?` | `LedgerEntry[]` | Financial ledger with running balance |
| `getAccountsStatus` | `businessId` | `AccountsStatus` | Accounts receivable and payable totals |
| `generateInsights` | `businessId, today, now` | `Insight[]` | Automated business insights |

### Reports — `src/lib/reports.ts`

Comprehensive report data generation.

| Function | Parameters | Return | Description |
|----------|-----------|--------|-------------|
| `reportRange` | `key, customFrom?, customTo?` | `ReportRange` | Resolve range key ("today", "week", "month", "lastMonth", "custom") |
| `getReportsData` | `businessId, range` | `ReportsData` | Full report: sales, profit, products, inventory, expenses, purchases, customers, financial |

### PDF Export — `src/lib/pdf-export.ts`

Client-side PDF report generation (runs in browser).

| Function | Parameters | Return | Description |
|----------|-----------|--------|-------------|
| `exportReportToPdf` | `data: ReportsData, tab: string, rangeLabel: string` | `void` | Generate and download branded PDF for the given report tab (sales, profit, products, inventory, expenses, purchases, customers, financial) |

### Email — `src/lib/email.ts`

Email generation and sending via Nodemailer.

| Function | Parameters | Return | Description |
|----------|-----------|--------|-------------|
| `generateReceiptHtml` | `options: ReceiptEmailOptions` | `string` | Generate styled HTML receipt email |
| `sendReceiptEmail` | `options: ReceiptEmailOptions` | `Promise<{ ok: boolean, error? }>` | Send receipt email via SMTP (falls back to console.log if SMTP not configured) |

---

## Data Model

See `prisma/schema.prisma` for the full schema. Key entities:

- **Business** — Multi-tenant root entity
- **User** — Authenticated users (OWNER / MANAGER / STAFF)
- **Location** — Business locations
- **Category** — Product categories
- **Product** — Products with pricing, stock, SKU
- **Customer** — Customer directory
- **Supplier** — Supplier directory
- **Order** / **OrderItem** — Sales orders with line items
- **Purchase** / **PurchaseItem** — Supplier purchase orders
- **Expense** — Business expenses
- **InventoryMovement** — Stock movement log (SALE, PURCHASE, ADJUSTMENT, RETURN, DAMAGE)
- **FinancialTransaction** — General ledger (SALE, PURCHASE, EXPENSE, REFUND, ADJUSTMENT)
- **Payment** — Payment records
- **Sale** — Revenue records per order item
- **Notification** — System notifications
- **AuditLog** — Audit trail
