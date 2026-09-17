import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockStatusBadge } from "@/components/ui/status";
import { MovementTrendChart } from "./product-chart";
import { AdjustStockButton } from "./adjust-stock";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  if (!session?.businessId) notFound();

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product || product.businessId !== session.businessId) notFound();

  const [movements, sales, orderLines, purchaseLines] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where: { businessId: session.businessId, productId: product.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.sale.findMany({
      where: { businessId: session.businessId, productId: product.id },
      orderBy: { date: "desc" },
      include: { order: { include: { customer: true } } },
    }),
    prisma.orderItem.findMany({
      where: { productId: product.id },
      include: { order: { include: { customer: true } } },
      orderBy: { order: { orderDate: "desc" } },
      take: 15,
    }),
    prisma.purchaseItem.findMany({
      where: { productId: product.id },
      include: { purchase: true },
      orderBy: { purchase: { purchaseDate: "desc" } },
      take: 15,
    }),
  ]);

  const unitsSold = sales.reduce((s, x) => s + x.quantity, 0);
  const revenue = sales.reduce((s, x) => s + x.revenue, 0);
  const profit = sales.reduce((s, x) => s + x.profit, 0);
  const stockValue = product.currentStock * product.costPrice;

  // group movements by day for the chart
  const trendMap = new Map<string, { label: string; in: number; out: number; balance: number }>();
  for (const m of movements.slice().reverse()) {
    const key = m.createdAt.toISOString().slice(0, 10);
    const label = m.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const cur = trendMap.get(key) ?? { label, in: 0, out: 0, balance: m.balanceAfter };
    if (m.quantity > 0) cur.in += m.quantity;
    else cur.out += Math.abs(m.quantity);
    cur.balance = m.balanceAfter;
    trendMap.set(key, cur);
  }

  const margin = product.sellingPrice > 0 ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100) : 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600/15 to-amber-600/15 text-2xl">
            🧋
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
              <StockStatusBadge current={product.currentStock} reorder={product.reorderLevel} />
              <Badge variant={product.status === "ACTIVE" ? "success" : "neutral"}>{product.status.toLowerCase()}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {product.sku && <span className="font-mono">{product.sku} · </span>}
              {product.category?.name ?? "Uncategorized"}
              {product.supplier ? ` · Supplier: ${product.supplier}` : ""}
            </p>
          </div>
        </div>
        <AdjustStockButton productId={product.id} productName={product.name} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Current Stock" value={formatNumber(product.currentStock)} sub={`${formatCurrency(stockValue)} at cost`} />
        <StatCard label="Selling Price" value={formatCurrency(product.sellingPrice)} sub={`${margin}% margin`} />
        <StatCard label="Cost Price" value={formatCurrency(product.costPrice)} />
        <StatCard label="Units Sold" value={formatNumber(unitsSold)} sub="all time" />
        <StatCard label="Revenue" value={formatCurrency(revenue)} sub={`+${formatCurrency(profit)} profit`} accent="text-amber-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement</CardTitle>
            <CardDescription>Incoming, outgoing and balance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <MovementTrendChart data={Array.from(trendMap.values())} />
            <div className="mt-4 space-y-1">
              {movements.slice(0, 12).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Badge variant={m.quantity > 0 ? "success" : "danger"}>{m.type.toLowerCase()}</Badge>
                    <span className="text-xs text-slate-500">{formatDateTime(m.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={m.quantity > 0 ? "text-amber-700" : "text-rose-600"}>
                      {m.quantity > 0 ? "+" : ""}{formatNumber(m.quantity)}
                    </span>
                    <span className="text-xs text-slate-400">bal {formatNumber(m.balanceAfter)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Orders containing this product</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderLines.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-400">No orders yet</TableCell></TableRow>
                )}
                {orderLines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-slate-700">{l.order.orderNumber}</TableCell>
                    <TableCell className="text-slate-500">{l.order.customer?.name ?? "Walk-in"}</TableCell>
                    <TableCell className="text-center">{formatNumber(l.quantity)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(l.lineTotal)}</TableCell>
                    <TableCell className="text-right text-xs text-slate-500">{formatDateTime(l.order.orderDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Purchases</CardTitle>
            <CardDescription>Restocking history</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseLines.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-400">No purchases yet</TableCell></TableRow>
                )}
                {purchaseLines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-slate-700">{l.purchase.purchaseNumber}</TableCell>
                    <TableCell className="text-center">{formatNumber(l.quantity)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(l.unitCost)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(l.lineTotal)}</TableCell>
                    <TableCell className="text-right text-xs text-slate-500">{formatDateTime(l.purchase.purchaseDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Units sold</span><span className="font-medium">{formatNumber(unitsSold)}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Revenue generated</span><span className="font-medium">{formatCurrency(revenue)}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Estimated profit</span><span className="font-medium text-amber-700">{formatCurrency(profit)}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Average order size</span><span className="font-medium">{sales.length ? formatNumber(revenue / sales.length) : "—"} {formatCurrency(0).replace("0", "")}units</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Reorder level</span><span className="font-medium">{formatNumber(product.reorderLevel)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Stock value at cost</span><span className="font-medium">{formatCurrency(stockValue)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums tracking-tight text-slate-900 ${accent ?? ""}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}