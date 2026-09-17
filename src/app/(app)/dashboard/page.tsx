import Link from "next/link";
import nextDynamic from "next/dynamic";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Wallet,
  Receipt,
  Boxes,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Plus,
  Calendar,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/analytics";
import { formatCurrency, formatNumber, formatDate, formatPercent, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DonutChart } from "@/components/charts/charts";
import { OrderStatusBadge, PaymentStatusBadge, StockStatusBadge } from "@/components/ui/status";

const TrendChartLoader = nextDynamic(
  () => import("./dashboard-client").then((m) => ({ default: m.TrendChartLoader })),
  { loading: () => <div className="h-[280px] animate-pulse rounded-xl bg-slate-100" /> }
);

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard - Iced Tea House" };

function DashboardRangeSwitch() {
  return (
    <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 lg:flex">
      <Calendar className="h-3.5 w-3.5" />
      Today's overview
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || !session.businessId) return null;

  const data = await getDashboardData(session.businessId);
  const currency = "PKR";

  const kpis = [
    {
      label: "Today's Sales",
      value: data.kpis.todaySales,
      compare: `vs yesterday`,
      delta: data.kpis.todaySalesPct,
      icon: ShoppingCart,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Today's Orders",
      value: `${data.kpis.todayOrders} orders`,
      compare: `vs yesterday`,
      delta: data.kpis.todayOrdersPct,
      icon: ArrowUpRight,
      color: "bg-sky-50 text-sky-600",
    },
    {
      label: "Gross Profit (7d)",
      value: data.kpis.grossProfit,
      compare: "vs prev week",
      delta: data.kpis.grossProfitPct,
      icon: Wallet,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Expenses (7d)",
      value: data.kpis.expenses,
      compare: "vs prev week",
      delta: data.kpis.expensesPct,
      icon: Receipt,
      color: "bg-rose-50 text-rose-600",
      invert: true,
    },
    {
      label: "Net Profit (7d)",
      value: data.kpis.netProfit,
      compare: "vs prev week",
      delta: data.kpis.netProfitPct,
      icon: Wallet,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Low Stock Items",
      value: `${data.kpis.lowStockCount} items`,
      compare: data.kpis.cashBalance > 0 ? `Cash balance ${formatCurrency(data.kpis.cashBalance)}` : "No balance yet",
      delta: data.lowStockItems.length > 0 ? -100 : 0,
      icon: Boxes,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Good day, ${session.name.split(" ")[0]} 👋`}
        description={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      >
        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 md:flex">
          <span className="h-2 w-2 rounded-full bg-amber-600" />
          Business operating live
        </div>
        <DashboardRangeSwitch />
      </PageHeader>

      {/* KPI Grid */}
      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isUp = kpi.delta >= 0;
          return (
            <Card key={kpi.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", kpi.color)}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                        isUp ? "text-amber-700" : "text-rose-600"
                      )}
                    >
                      {kpi.invert && kpi.delta !== -100 ? (
                        isUp ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />
                      ) : (
                        isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                      )}
                      {kpi.delta === -100 ? (data.lowStockItems.length > 0 ? "Alert" : "") : formatPercent(kpi.delta)}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                    {kpi.label.includes("Sales") || kpi.label.includes("Gross") || kpi.label.includes("Expenses") || kpi.label.includes("Net Profit") ? formatCurrency(Number(kpi.value)) : String(kpi.value)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{kpi.compare}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales overview + trend */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Sales, orders and profit over time</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChartLoader businessId={session.businessId} />
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-amber-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-700" />
            <h3 className="text-sm font-semibold text-amber-900">Business Insights</h3>
          </div>
          <ul className="space-y-2">
            {data.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    insight.type === "positive" && "bg-amber-600",
                    insight.type === "negative" && "bg-rose-500",
                    insight.type === "info" && "bg-sky-500"
                  )}
                />
                {insight.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Products <span className="font-normal text-slate-400">(30 days)</span></CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No sales recorded yet</p>
            ) : (
              <div className="space-y-1">
                {data.topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">{formatNumber(p.units)} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-slate-800">{formatCurrency(p.revenue)}</p>
                      <p className="text-xs font-medium text-amber-700">+{formatCurrency(p.profit)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {data.expensesByCat.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No expenses yet</p>
            ) : (
              <DonutChart
                data={data.expensesByCat.slice(0, 6).map((e) => ({ name: e.category, value: e.amount }))}
                currency="PKR"
                showValue={true}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/orders" className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-2">
            <div className="divide-y divide-slate-50">
              {data.recentOrders.map((o) => (
                <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{o.orderNumber}</p>
                    <p className="truncate text-xs text-slate-400">
                      {o.customer?.name ?? "Walk-in"} · {o.items.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="hidden sm:block">
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-800">{formatCurrency(o.total)}</p>
                    <p className="text-xs text-slate-400">{formatDate(o.orderDate, "MMM d")}</p>
                  </div>
                </Link>
              ))}
              {data.recentOrders.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inventory alerts */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Inventory Alerts</CardTitle>
            <Badge variant="warning">{data.lowStockItems.length} items</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.lowStockItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400">
                <p className="text-xl">✓</p>
                <p className="mt-1">All stock levels are healthy</p>
              </div>
            ) : (
              data.lowStockItems.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{formatNumber(p.currentStock)} in stock · reorder at {formatNumber(p.reorderLevel)}</p>
                  </div>
                  <StockStatusBadge current={p.currentStock} reorder={p.reorderLevel} />
                </div>
              ))
            )}
            <Link href="/inventory" className="flex items-center gap-1 pt-1 text-xs font-medium text-amber-700 hover:text-amber-800">
              Go to inventory <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}