"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, FileDown } from "lucide-react";
import { formatCurrency, formatNumber, formatDateTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportReportToPdf } from "@/lib/pdf-export";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ReportsData } from "@/lib/reports";

const ranges = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "custom", label: "Custom" },
];

export function ReportsClient({ data, activeRange }: { data: ReportsData; activeRange: string }) {
  const [tab, setTab] = useState("sales");
  const [exporting, setExporting] = useState(false);

  const getCsv = (rows: Record<string, any>[], filename: string) => {
    if (!rows.length) {
      toast.error("Nothing to export for this report");
      return;
    }
    const header = Object.keys(rows[0]).join(",");
    const body = rows.map((r) =>
      Object.values(r)
        .map((v) => (typeof v === "string" && v.includes(",") ? `"${v.replaceAll('"', '""')}"` : String(v)))
        .join(",")
    );
    const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported`);
  };

  const rangeLabel = ranges.find((r) => r.key === activeRange)?.label ?? "Report";

  const downloadPdf = () => {
    setExporting(true);
    try {
      exportReportToPdf(data, tab, rangeLabel);
    } finally {
      setExporting(false);
    }
  };

  const { summary, salesReport, profitReport, productPerformance, inventoryReport, expenseReport, purchaseReport, customerReport, financialReport } = data;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {ranges.map((r) => (
            <a
              key={r.key}
              href={r.key === "custom" ? "/reports" : `/reports?range=${r.key}`}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                activeRange === r.key && !(r.key === "custom") ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {r.label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadPdf} disabled={exporting}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            PDF
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Orders" value={formatNumber(summary.orderCount)} />
        <SummaryCard label="Units Sold" value={formatNumber(summary.unitCount)} />
        <SummaryCard label="Customers" value={formatNumber(summary.customerCount)} />
        <SummaryCard label="Avg Order Value" value={formatCurrency(summary.avgOrderValue)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="underline" className="mb-4 flex-wrap">
          <TabsTrigger value="sales" variant="underline">Sales</TabsTrigger>
          <TabsTrigger value="profit" variant="underline">Profit</TabsTrigger>
          <TabsTrigger value="products" variant="underline">Products</TabsTrigger>
          <TabsTrigger value="inventory" variant="underline">Inventory</TabsTrigger>
          <TabsTrigger value="expenses" variant="underline">Expenses</TabsTrigger>
          <TabsTrigger value="purchases" variant="underline">Purchases</TabsTrigger>
          <TabsTrigger value="customers" variant="underline">Customers</TabsTrigger>
          <TabsTrigger value="financial" variant="underline">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <ReportCard
            title="Sales Report"
            description={`${formatCurrency(salesReport.revenue)} gross · ${formatCurrency(salesReport.netSales)} net after ${formatCurrency(salesReport.refunds)} refunds`}
            action={<CSVButton onClick={() => getCsv(salesReport.productPerformance.map((p) => ({ product: p.name, units: p.units, revenue: p.revenue, profit: p.profit })), "sales-report")} />}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="mb-2 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Daily performance</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReport.salesByDay.map((d) => (
                      <TableRow key={d.label}>
                        <TableCell className="font-medium text-slate-700">{d.label}</TableCell>
                        <TableCell className="text-center">{d.orders}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(d.sales)}</TableCell>
                        <TableCell className="text-right tabular-nums text-amber-700">{formatCurrency(d.profit)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Revenue by product</p>
                <div className="space-y-1.5 rounded-lg border border-slate-100 p-3">
                  {salesReport.productPerformance.slice(0, 10).map((p, i) => {
                    const pct = salesReport.netSales > 0 ? (p.revenue / salesReport.netSales) * 100 : 0;
                    return (
                      <div key={p.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate text-slate-700">{p.name}</span>
                          <span className="font-medium tabular-nums text-slate-800">{formatCurrency(p.revenue)} <span className="text-xs text-slate-400">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full bg-amber-600" style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ReportCard>
        </TabsContent>

        <TabsContent value="profit">
          <ReportCard
            title="Profit Report"
            description={`Net margin ${profitReport.margin}%`}
            action={<CSVButton onClick={() => getCsv([{ revenue: profitReport.revenue, cogs: profitReport.cogs, grossProfit: profitReport.grossProfit, expenses: profitReport.expenses, netProfit: profitReport.netProfit }], "profit-report")} />}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <MetricBox label="Revenue" value={formatCurrency(profitReport.revenue)} color="text-amber-700" />
              <MetricBox label="COGS" value={formatCurrency(profitReport.cogs)} color="text-slate-700" />
              <MetricBox label="Gross Profit" value={formatCurrency(profitReport.grossProfit)} color="text-violet-600" />
              <MetricBox label="Operating Expenses" value={formatCurrency(profitReport.expenses)} color="text-rose-600" />
              <MetricBox label="Net Profit" value={formatCurrency(profitReport.netProfit)} color={profitReport.netProfit >= 0 ? "text-amber-700" : "text-rose-600"} />
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">How it's calculated</p>
              <p className="mt-1">Revenue {formatCurrency(profitReport.revenue)} - COGS {formatCurrency(profitReport.cogs)} = Gross Profit {formatCurrency(profitReport.grossProfit)}</p>
              <p>Gross Profit - Expenses {formatCurrency(profitReport.expenses)} = <b>Net Profit {formatCurrency(profitReport.netProfit)}</b></p>
            </div>
          </ReportCard>
        </TabsContent>

        <TabsContent value="products">
          <ReportCard
            title="Product Performance"
            description="Which products drive your business"
            action={<CSVButton onClick={() => getCsv(productPerformance.map((p) => ({ product: p.name, units: p.units, revenue: p.revenue, profit: p.profit, margin: p.margin })), "product-performance")} />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Units Sold</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productPerformance.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-400">No sales in this period</TableCell></TableRow>
                )}
                {productPerformance.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium text-slate-800">{p.name}</TableCell>
                    <TableCell className="text-center">{formatNumber(p.units)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(p.avgPrice)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(p.revenue)}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-700">{formatCurrency(p.profit)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.margin >= 50 ? "success" : p.margin >= 30 ? "secondary" : "warning"}>{p.margin}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="inventory">
          <ReportCard
            title="Inventory Report"
            description={`${inventoryReport.lowStock.length} low · ${inventoryReport.outOfStock.length} out of stock`}
            action={<CSVButton onClick={() => getCsv(inventoryReport.rows.map((r) => ({ product: r.name, incoming: r.in, outgoing: r.out })), "inventory-report")} />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Incoming</TableHead>
                  <TableHead className="text-right">Outgoing</TableHead>
                  <TableHead className="text-right">Net Movement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryReport.rows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-medium text-slate-800">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-700">+{formatNumber(r.in)}</TableCell>
                    <TableCell className="text-right tabular-nums text-rose-600">-{formatNumber(r.out)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatNumber(r.in - r.out)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="expenses">
          <ReportCard
            title="Expense Report"
            description={`${expenseReport.count} expenses · ${formatCurrency(expenseReport.total)} total`}
            action={<CSVButton onClick={() => getCsv(expenseReport.rows.map((r) => ({ category: r.category, amount: r.amount })), "expense-report")} />}
          >
            {expenseReport.rows.length === 0 ? (
              <p className="py-10 text-center text-slate-400">No expenses in this period</p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">By category</p>
                  <div className="space-y-2">
                    {expenseReport.rows.map((r) => {
                      const pct = expenseReport.total > 0 ? (r.amount / expenseReport.total) * 100 : 0;
                      return (
                        <div key={r.category}>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700">{r.category}</span>
                            <span className="font-medium tabular-nums">{formatCurrency(r.amount)} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-800">Biggest expense</p>
                  {expenseReport.rows[0] ? (
                    <>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{expenseReport.rows[0].category}</p>
                      <p className="text-slate-500">{formatCurrency(expenseReport.rows[0].amount)}</p>
                    </>
                  ) : (
                    <p className="mt-1 text-slate-500">No data</p>
                  )}
                </div>
              </div>
            )}
          </ReportCard>
        </TabsContent>

        <TabsContent value="purchases">
          <ReportCard
            title="Purchase Report"
            description={`${purchaseReport.count} purchases · ${formatCurrency(purchaseReport.total)} total`}
            action={<CSVButton onClick={() => getCsv(purchaseReport.rows.map((r) => ({ purchase: r.purchaseNumber, supplier: r.supplier, units: r.itemCount, total: r.totalCost, status: r.status })), "purchase-report")} />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-center">Units</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseReport.rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-slate-800">{p.purchaseNumber}</TableCell>
                    <TableCell className="text-slate-600">{p.supplier}</TableCell>
                    <TableCell className="text-center">{formatNumber(p.itemCount)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(p.totalCost)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "RECEIVED" ? "success" : p.status === "PENDING" ? "warning" : "neutral"}>{p.status.toLowerCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-500">{formatDateTime(p.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="customers">
          <ReportCard
            title="Customer Report"
            description="Your most valuable customers"
            action={<CSVButton onClick={() => getCsv(customerReport.map((r) => ({ customer: r.name, orders: r.orders, spent: r.spent })), "customer-report")} />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerReport.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="py-10 text-center text-slate-400">No customer activity in this period</TableCell></TableRow>
                )}
                {customerReport.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-slate-800">{c.name}</TableCell>
                    <TableCell className="text-center">{c.orders}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(c.spent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="financial">
          <ReportCard
            title="Financial Report"
            description="Complete financial picture for this period"
            action={<CSVButton onClick={() => getCsv([financialReport], "financial-report")} />}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <MetricBox label="Revenue" value={formatCurrency(financialReport.revenue)} color="text-amber-700" />
              <MetricBox label="Refunds" value={formatCurrency(financialReport.refunds)} color="text-rose-600" />
              <MetricBox label="Net Sales" value={formatCurrency(financialReport.netSales)} color="text-slate-800" />
              <MetricBox label="COGS" value={formatCurrency(financialReport.cogs)} color="text-slate-600" />
              <MetricBox label="Gross Profit" value={formatCurrency(financialReport.grossProfit)} color="text-violet-600" />
              <MetricBox label="Expenses" value={formatCurrency(financialReport.expensesTotal)} color="text-rose-600" />
              <MetricBox label="Purchases" value={formatCurrency(financialReport.purchasesTotal)} color="text-sky-600" />
              <MetricBox label="Net Profit" value={formatCurrency(financialReport.netProfit)} color={financialReport.netProfit >= 0 ? "text-amber-700" : "text-rose-600"} />
            </div>
          </ReportCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportCard({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function CSVButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Download className="h-3.5 w-3.5" /> CSV
    </Button>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}