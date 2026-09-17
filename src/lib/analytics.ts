import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  addDays,
  addMonths,
} from "@/lib/utils";

export type DateRange = { from: Date; to: Date };

export function getRange(key: string, customFrom?: string, customTo?: string): DateRange {
  const to = endOfDay(new Date());
  switch (key) {
    case "today":
      return { from: startOfDay(), to };
    case "week":
      return { from: startOfWeek(), to };
    case "month":
      return { from: startOfMonth(), to };
    case "7d":
      return { from: startOfDay(addDays(new Date(), -6)), to };
    case "30d":
      return { from: startOfDay(addDays(new Date(), -29)), to };
    case "3m":
      return { from: startOfDay(addMonths(new Date(), -2)), to };
    case "year":
      return { from: new Date(new Date().getFullYear(), 0, 1), to };
    case "custom":
      return {
        from: customFrom ? new Date(customFrom) : startOfDay(addDays(new Date(), -6)),
        to: customTo ? endOfDay(new Date(customTo)) : to,
      };
    default:
      return { from: startOfDay(addDays(new Date(), -6)), to };
  }
}

export async function getFinancialMetrics(businessId: string, range: DateRange) {
  const [salesTxs, purchaseTxs, expenseTxs, refundTxs, orders, expenses, purchases] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { businessId, date: { gte: range.from, lte: range.to }, OR: [{ type: "SALE" }, { type: "REFUND" }] },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId, date: { gte: range.from, lte: range.to }, type: "PURCHASE" },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId, date: { gte: range.from, lte: range.to }, type: "EXPENSE" },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId, date: { gte: range.from, lte: range.to }, type: "REFUND" },
    }),
    prisma.order.findMany({
      where: { businessId, status: "COMPLETED", orderDate: { gte: range.from, lte: range.to } },
    }),
    prisma.expense.findMany({
      where: { businessId, date: { gte: range.from, lte: range.to } },
    }),
    prisma.purchase.findMany({
      where: { businessId, purchaseDate: { gte: range.from, lte: range.to }, status: "RECEIVED" },
    }),
  ]);

  const revenue = salesTxs.reduce((s, t) => s + t.moneyIn, 0);
  const refunds = refundTxs.reduce((s, t) => s + t.moneyOut, 0);
  const netSales = revenue - refunds;
  const cogs = orders.reduce((s, o) => s + o.totalCogs, 0);
  const grossProfit = netSales - cogs;
  const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const purchasesTotal = purchases.reduce((s, p) => s + p.totalCost, 0);
  const cashIn = salesTxs.reduce((s, t) => s + t.moneyIn, 0);
  const cashOut = purchaseTxs.reduce((s, t) => s + t.moneyOut, 0) + expensesTotal + refunds;
  const netProfit = grossProfit - expensesTotal;

  return {
    revenue,
    refunds,
    netSales,
    cogs,
    grossProfit,
    expenses: expensesTotal,
    purchases: purchasesTotal,
    cashIn,
    cashOut,
    netProfit,
    orderCount: orders.length,
    avgOrderValue: orders.length ? Math.round((netSales / orders.length) * 100) / 100 : 0,
  };
}

export async function getDashboardData(businessId: string) {
  const [today, yesterday, weekRange, prevRange, lastTx, now] = await Promise.all([
    getFinancialMetrics(businessId, getRange("today")),
    getFinancialMetrics(businessId, { from: startOfDay(addDays(new Date(), -1)), to: endOfDay(addDays(new Date(), -1)) }),
    getFinancialMetrics(businessId, getRange("week")),
    getFinancialMetrics(businessId, { from: startOfWeek(addDays(new Date(), -7)), to: endOfDay(addDays(new Date(), -7)) }),
    prisma.financialTransaction.findFirst({ where: { businessId }, orderBy: { date: "desc" } }),
    new Date(),
  ]);

  const pct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / Math.abs(prev)) * 1000) / 10);

  const lowStock = await prisma.product.findMany({
    where: { businessId, status: "ACTIVE", reorderLevel: { gt: 0 } },
  });
  const lowStockItems = lowStock
    .filter((p) => p.currentStock <= p.reorderLevel)
    .sort((a, b) => a.currentStock / (a.reorderLevel || 1) - b.currentStock / (b.reorderLevel || 1))
    .slice(0, 6);

  const recentOrders = await prisma.order.findMany({
    where: { businessId },
    orderBy: { orderDate: "desc" },
    take: 8,
    include: { customer: true, items: true },
  });

  const topProducts = await prisma.sale.groupBy({
    by: ["productId", "productName"],
    where: { businessId, date: { gte: getRange("30d").from } },
    _sum: { quantity: true, revenue: true, profit: true },
    _count: true,
    orderBy: { _sum: { revenue: "desc" } },
    take: 6,
  });

  const salesTrend = await getSalesTrend(businessId, "30d");

  const expensesByCat = await prisma.expense.groupBy({
    by: ["category"],
    where: { businessId, date: { gte: getRange("30d").from } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const insights = await generateInsights(businessId, today, now);

  return {
    kpis: {
      todaySales: today.netSales,
      todaySalesPct: pct(today.netSales, yesterday.netSales),
      todayOrders: today.orderCount,
      todayOrdersPct: pct(today.orderCount, yesterday.orderCount),
      grossProfit: weekRange.grossProfit,
      grossProfitPct: pct(weekRange.grossProfit, prevRange.grossProfit),
      expenses: weekRange.expenses,
      expensesPct: pct(weekRange.expenses, prevRange.expenses),
      netProfit: weekRange.netProfit,
      netProfitPct: pct(weekRange.netProfit, prevRange.netProfit),
      aov: weekRange.avgOrderValue,
      aovPct: pct(weekRange.avgOrderValue, prevRange.avgOrderValue),
      cashBalance: lastTx?.balance ?? 0,
      lowStockCount: lowStockItems.length,
    },
    lowStockItems,
    recentOrders,
    topProducts: topProducts.map((p) => ({
      id: p.productId,
      name: p.productName,
      units: p._sum.quantity ?? 0,
      revenue: p._sum.revenue ?? 0,
      profit: p._sum.profit ?? 0,
    })),
    salesTrend,
    expensesByCat: expensesByCat.map((e) => ({ category: e.category, amount: e._sum.amount ?? 0 })),
    insights,
  };
}

export async function getSalesTrend(businessId: string, rangeKey: string, customFrom?: string, customTo?: string) {
  const range = getRange(rangeKey, customFrom, customTo);
  const sales = await prisma.sale.findMany({
    where: { businessId, date: { gte: range.from, lte: range.to } },
  });
  const orders = await prisma.order.findMany({
    where: { businessId, status: "COMPLETED", orderDate: { gte: range.from, lte: range.to } },
  });

  const days = Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
  const points: { date: string; label: string; sales: number; orders: number; profit: number }[] = [];

  if (days <= 31) {
    for (let i = 0; i < days; i++) {
      const dayStart = startOfDay(addDays(range.from, i));
      const dayEnd = endOfDay(dayStart);
      const daySales = sales.filter((s) => s.date >= dayStart && s.date <= dayEnd);
      const dayOrders = orders.filter((o) => o.orderDate >= dayStart && o.orderDate <= dayEnd);
      points.push({
        date: dayStart.toISOString(),
        label: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sales: Math.round(daySales.reduce((s, x) => s + x.revenue, 0)),
        orders: dayOrders.length,
        profit: Math.round(daySales.reduce((s, x) => s + x.profit, 0)),
      });
    }
  } else {
    const months = Math.ceil(days / 30);
    let cursor = range.from;
    while (cursor < range.to) {
      const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
      const e = mEnd > range.to ? range.to : mEnd;
      const mSales = sales.filter((s) => s.date >= cursor && s.date <= e);
      const mOrders = orders.filter((o) => o.orderDate >= cursor && o.orderDate <= e);
      points.push({
        date: cursor.toISOString(),
        label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        sales: Math.round(mSales.reduce((s, x) => s + x.revenue, 0)),
        orders: mOrders.length,
        profit: Math.round(mSales.reduce((s, x) => s + x.profit, 0)),
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    void months;
  }
  return points;
}

export async function getSalesByHour(businessId: string) {
  const sales = await prisma.sale.findMany({
    where: { businessId, date: { gte: startOfDay(addMonths(new Date(), -1)) } },
  });
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, "0")}:00`,
    sales: 0,
    orders: 0,
  }));
  for (const s of sales) {
    const h = s.date.getHours();
    hours[h].sales += s.revenue;
    hours[h].orders += 1;
  }
  return hours;
}

export async function getSalesByDay(businessId: string) {
  const sales = await prisma.sale.findMany({
    where: { businessId, date: { gte: startOfWeek(addDays(new Date(), -35)) } },
  });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = dayNames.map((label) => ({ label, sales: 0 }));
  for (const s of sales) {
    days[s.date.getDay()].sales += s.revenue;
  }
  return days;
}

export async function getCategoryRevenue(businessId: string) {
  const sales = await prisma.sale.findMany({
    where: { businessId, date: { gte: getRange("3m").from } },
    include: { product: { include: { category: true } } },
  });
  const map = new Map<string, { revenue: number; profit: number; units: number }>();
  for (const s of sales) {
    const cat = s.product?.category?.name ?? "Uncategorized";
    const cur = map.get(cat) ?? { revenue: 0, profit: 0, units: 0 };
    cur.revenue += s.revenue;
    cur.profit += s.profit;
    cur.units += s.quantity;
    map.set(cat, cur);
  }
  return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
}

export async function getProductPerformance(businessId: string) {
  const sales = await prisma.sale.findMany({
    where: { businessId },
    include: { product: true },
  });
  const map = new Map<string, { productId: string | null; name: string; units: number; revenue: number; profit: number; avgPrice: number }>();
  for (const s of sales) {
    const cur = map.get(s.productName) ?? { productId: s.productId, name: s.productName, units: 0, revenue: 0, profit: 0, avgPrice: 0 };
    cur.units += s.quantity;
    cur.revenue += s.revenue;
    cur.profit += s.profit;
    map.set(s.productName, cur);
  }
  const arr = Array.from(map.values()).map((p) => ({
    ...p,
    avgPrice: p.units ? Math.round(p.revenue / p.units) : 0,
    margin: p.revenue ? Math.round((p.profit / p.revenue) * 1000) / 10 : 0,
  }));
  arr.sort((a, b) => b.revenue - a.revenue);
  return arr;
}

export async function getInventorySummary(businessId: string) {
  const products = await prisma.product.findMany({ where: { businessId } });
  const movements = await prisma.inventoryMovement.groupBy({
    by: ["type", "productId"],
    where: { businessId },
    _sum: { quantity: true },
  });

  const stockValue = products.reduce((s, p) => s + p.currentStock * p.costPrice, 0);
  const retailValue = products.reduce((s, p) => s + p.currentStock * p.sellingPrice, 0);
  const incoming = movements.filter((m) => ["PURCHASE", "RETURN"].includes(m.type)).reduce((s, m) => s + (m._sum.quantity ?? 0), 0);
  const outgoing = movements.filter((m) => ["SALE", "DAMAGE"].includes(m.type)).reduce((s, m) => s + Math.abs(m._sum.quantity ?? 0), 0);
  const low = products.filter((p) => p.reorderLevel > 0 && p.currentStock <= p.reorderLevel && p.currentStock > 0).length;
  const outOfStock = products.filter((p) => p.currentStock <= 0).length;

  return {
    totalProducts: products.length,
    stockValue,
    retailValue,
    incoming,
    outgoing,
    low,
    outOfStock,
  };
}

export async function getLedger(businessId: string, filter?: { type?: string; method?: string }) {
  const txs = await prisma.financialTransaction.findMany({
    where: {
      businessId,
      ...(filter?.type ? { type: filter.type as any } : {}),
      ...(filter?.method ? { paymentMethod: filter.method as any } : {}),
    },
    orderBy: { date: "asc" },
  });
  // recompute running balance from earliest
  let bal = 0;
  return txs.map((t) => {
    bal = Math.round((bal + t.moneyIn - t.moneyOut) * 100) / 100;
    return { ...t, balance: bal };
  });
}

export async function getAccountsStatus(businessId: string) {
  const receivables = await prisma.order.findMany({
    where: { businessId, status: { not: "CANCELLED" }, paymentStatus: { not: "PAID" } },
  });
  const payables = await prisma.purchase.findMany({
    where: { businessId, status: { not: "CANCELLED" }, paymentStatus: { not: "PAID" } },
  });
  const accountsReceivable = receivables.reduce((s, o) => s + (o.total - o.amountPaid), 0);
  const accountsPayable = payables.reduce((s, p) => s + (p.totalCost - p.amountPaid), 0);
  return {
    accountsReceivable: Math.round(accountsReceivable * 100) / 100,
    accountsPayable: Math.round(accountsPayable * 100) / 100,
    countReceivable: receivables.length,
    countPayable: payables.length,
  };
}

export async function generateInsights(businessId: string, today: any, now: Date) {
  const insights: { type: "positive" | "negative" | "info"; text: string }[] = [];

  const [products, lowStockProducts, sales30, sales7, salesPrev7, aov30, aovPrev30, expensesThisMonth, expensesPrevMonth, ordersByDay] = await Promise.all([
    prisma.product.findMany({ where: { businessId, status: "ACTIVE" } }),
    prisma.product.findMany({ where: { businessId, status: "ACTIVE", reorderLevel: { gt: 0 } } }),
    prisma.sale.findMany({ where: { businessId, date: { gte: getRange("30d").from } } }),
    prisma.sale.findMany({ where: { businessId, date: { gte: getRange("week").from } } }),
    prisma.sale.findMany({ where: { businessId, date: { lt: getRange("week").from, gte: addDays(getRange("week").from, -7) } } }),
    prisma.order.findMany({ where: { businessId, status: { not: "CANCELLED" }, orderDate: { gte: getRange("30d").from } } }),
    prisma.order.findMany({
      where: { businessId, status: { not: "CANCELLED" }, orderDate: { lt: getRange("30d").from, gte: addDays(getRange("30d").from, -30) } },
    }),
    prisma.expense.findMany({ where: { businessId, date: { gte: startOfMonth() } } }),
    prisma.expense.findMany({
      where: { businessId, date: { lt: startOfMonth(), gte: startOfMonth(addMonths(new Date(), -1)) } },
    }),
    prisma.sale.findMany({ where: { businessId, date: { gte: getRange("week").from } } }),
  ]);

  // Top product share
  if (sales30.length >= 5) {
    const byProduct = new Map<string, number>();
    for (const s of sales30) byProduct.set(s.productName, (byProduct.get(s.productName) ?? 0) + s.revenue);
    const total = sales30.reduce((t, s) => t + s.revenue, 0);
    const top = [...byProduct.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && total > 0) {
      const share = Math.round((top[1] / total) * 100);
      insights.push({
        type: "positive",
        text: `${top[0]} generated ${share}% of sales in the last 30 days.`,
      });
    }
  }

  // AOV trend
  const aov = aov30.length ? aov30.reduce((s, o) => s + o.total, 0) / aov30.length : 0;
  const aovPrev = aovPrev30.length ? aovPrev30.reduce((s, o) => s + o.total, 0) / aovPrev30.length : 0;
  if (aov > 0 && aovPrev > 0) {
    const delta = ((aov - aovPrev) / aovPrev) * 100;
    if (Math.abs(delta) >= 5) {
      insights.push({
        type: delta > 0 ? "positive" : "negative",
        text: `Average order value ${delta > 0 ? "increased" : "decreased"} ${Math.abs(delta).toFixed(0)}% vs the prior 30 days (${Math.round(aov)} vs ${Math.round(aovPrev)} ${today.currency ?? "PKR"}).`,
      });
    }
  }

  // Low stock
  const lowCount = lowStockProducts.filter((p) => p.currentStock <= p.reorderLevel).length;
  if (lowCount > 0) {
    insights.push({
      type: "negative",
      text: `${lowCount} product${lowCount === 1 ? "" : "s"} ${lowCount === 1 ? "is" : "are"} at or below reorder level.`,
    });
  }

  // Expense category increase
  const thisMonth = new Map<string, number>();
  for (const e of expensesThisMonth) thisMonth.set(e.category, (thisMonth.get(e.category) ?? 0) + e.amount);
  const prevMonth = new Map<string, number>();
  for (const e of expensesPrevMonth) prevMonth.set(e.category, (prevMonth.get(e.category) ?? 0) + e.amount);
  let bestExpInsight: string | null = null;
  for (const [cat, amount] of thisMonth) {
    const prev = prevMonth.get(cat) ?? 0;
    if (prev > 0) {
      const delta = ((amount - prev) / prev) * 100;
      if (delta >= 18) bestExpInsight = `${cat} expenses increased ${delta.toFixed(0)}% this month.`;
    }
  }
  if (bestExpInsight) insights.push({ type: "negative", text: bestExpInsight });

  // Best sales day this week
  if (ordersByDay.length) {
    const byDay = new Map<number, number>();
    for (const s of ordersByDay) {
      const d = s.date.getDay();
      byDay.set(d, (byDay.get(d) ?? 0) + s.revenue);
    }
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const best = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] > 0) {
      insights.push({ type: "info", text: `${dayNames[best[0]]} generated your highest sales this week (${Math.round(best[1])} ${today.currency ?? "PKR"}).` });
    }
  }

  if (!insights.length) {
    insights.push({
      type: "info",
      text: "Start recording orders to see automated business insights here.",
    });
  }

  return insights.slice(0, 5);
}