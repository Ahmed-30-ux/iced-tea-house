import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/utils";

export type ReportRange = { from: Date; to: Date };

export function reportRange(key: string, customFrom?: string, customTo?: string): ReportRange {
  const to = endOfDay(new Date());
  switch (key) {
    case "today":
      return { from: startOfDay(), to };
    case "week":
      const d1 = new Date();
      const day = d1.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = startOfDay(new Date(d1.setDate(d1.getDate() + diff)));
      return { from: monday, to };
    case "month":
      return { from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to };
    case "lastMonth": {
      const first = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      const last = new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59, 999);
      return { from: first, to: last };
    }
    case "custom":
      return {
        from: customFrom ? new Date(customFrom) : startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        to: customTo ? endOfDay(new Date(customTo)) : to,
      };
    default:
      return { from: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to };
  }
}

export async function getReportsData(businessId: string, range: ReportRange) {
  const [sales, orders, expenses, purchases, movementRows, customers, products, salesTxs] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, date: { gte: range.from, lte: range.to } },
      include: { product: { include: { category: true } } },
    }),
    prisma.order.findMany({
      where: { businessId, status: "COMPLETED", orderDate: { gte: range.from, lte: range.to } },
      include: { customer: true, items: true },
    }),
    prisma.expense.findMany({ where: { businessId, date: { gte: range.from, lte: range.to } } }),
    prisma.purchase.findMany({ where: { businessId, purchaseDate: { gte: range.from, lte: range.to } }, include: { supplier: true, items: true } }),
    prisma.inventoryMovement.findMany({ where: { businessId, createdAt: { gte: range.from, lte: range.to } }, include: { product: true } }),
    prisma.customer.findMany({
      where: { businessId, orders: { some: { orderDate: { gte: range.from, lte: range.to } } } },
      include: { orders: { where: { orderDate: { gte: range.from, lte: range.to }, status: { not: "CANCELLED" } } } },
    }),
    prisma.product.findMany({ where: { businessId } }),
    prisma.financialTransaction.findMany({ where: { businessId, date: { gte: range.from, lte: range.to } } }),
  ]);

  const revenue = sales.reduce((s, x) => s + x.revenue, 0);
  const refunds = salesTxs.filter((t) => t.type === "REFUND").reduce((s, t) => s + t.moneyOut, 0);
  const netSales = revenue - refunds;
  const cogs = orders.reduce((s, o) => s + o.totalCogs, 0);
  const grossProfit = netSales - cogs;
  const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - expensesTotal;
  const purchasesTotal = purchases.reduce((s, p) => s + p.totalCost, 0);

  // Product performance
  const productMap = new Map<string, { productId: string | null; name: string; units: number; revenue: number; cost: number; profit: number }>();
  for (const s of sales) {
    const cur = productMap.get(s.productName) ?? { productId: s.productId, name: s.productName, units: 0, revenue: 0, cost: 0, profit: 0 };
    cur.units += s.quantity;
    cur.revenue += s.revenue;
    cur.cost += s.cost;
    cur.profit += s.profit;
    productMap.set(s.productName, cur);
  }
  const productPerformance = Array.from(productMap.values())
    .map((p) => ({
      ...p,
      avgPrice: p.units ? Math.round((p.revenue / p.units) * 100) / 100 : 0,
      margin: p.revenue ? Math.round((p.profit / p.revenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Sales by day for report
  const dayMap = new Map<string, { label: string; sales: number; orders: number; profit: number }>();
  const dayCount = Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(range.from);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), sales: 0, orders: 0, profit: 0 });
  }
  for (const s of sales) {
    const key = s.date.toISOString().slice(0, 10);
    const cur = dayMap.get(key);
    if (cur) {
      cur.sales += s.revenue;
      cur.profit += s.profit;
    }
  }
  for (const o of orders) {
    const key = o.orderDate.toISOString().slice(0, 10);
    const cur = dayMap.get(key);
    if (cur) cur.orders += 1;
  }
  const salesByDay = Array.from(dayMap.values());

  // Expense breakdown
  const expenseMap = new Map<string, number>();
  for (const e of expenses) expenseMap.set(e.category, (expenseMap.get(e.category) ?? 0) + e.amount);
  const expenseBreakdown = Array.from(expenseMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Inventory movements
  const movementByProduct = new Map<string, { name: string; in: number; out: number }>();
  for (const m of movementRows) {
    const name = m.productName;
    const cur = movementByProduct.get(name) ?? { name, in: 0, out: 0 };
    if (m.quantity > 0) cur.in += m.quantity;
    else cur.out += Math.abs(m.quantity);
    movementByProduct.set(name, cur);
  }
  const inventoryReport = Array.from(movementByProduct.values()).sort((a, b) => b.in + b.out - (a.in + a.out));

  const customerReport = customers.map((c) => ({
    id: c.id,
    name: c.name,
    orders: c.orders.length,
    spent: c.orders.reduce((s, o) => s + o.total, 0),
  })).sort((a, b) => b.spent - a.spent);

  const financialReport = {
    revenue,
    refunds,
    netSales,
    cogs,
    grossProfit,
    expensesTotal,
    netProfit,
    purchasesTotal,
    cashIn: salesTxs.reduce((s, t) => s + t.moneyIn, 0),
    cashOut: salesTxs.reduce((s, t) => s + t.moneyOut, 0),
  };

  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    summary: {
      orderCount: orders.length,
      unitCount: sales.reduce((s, x) => s + x.quantity, 0),
      customerCount: customerReport.length,
      avgOrderValue: orders.length ? Math.round((netSales / orders.length) * 100) / 100 : 0,
    },
    salesReport: {
      salesByDay,
      productPerformance,
      revenue,
      netSales,
      refunds,
    },
    profitReport: {
      revenue,
      cogs,
      grossProfit,
      expenses: expensesTotal,
      netProfit,
      margin: netSales ? Math.round((grossProfit / netSales) * 1000) / 10 : 0,
    },
    productPerformance,
    inventoryReport: {
      rows: inventoryReport,
      lowStock: products.filter((p) => p.reorderLevel > 0 && p.currentStock <= p.reorderLevel),
      outOfStock: products.filter((p) => p.currentStock <= 0),
    },
    expenseReport: {
      rows: expenseBreakdown,
      total: expensesTotal,
      count: expenses.length,
    },
    purchaseReport: {
      rows: purchases.map((p) => ({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        supplier: p.supplier?.name ?? "—",
        itemCount: p.items.reduce((s, i) => s + i.quantity, 0),
        totalCost: p.totalCost,
        status: p.status,
        date: p.purchaseDate.toISOString(),
      })),
      total: purchasesTotal,
      count: purchases.length,
    },
    customerReport,
    financialReport,
  };
}

export type ReportsData = Awaited<ReturnType<typeof getReportsData>>;