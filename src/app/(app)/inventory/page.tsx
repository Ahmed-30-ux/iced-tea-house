import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInventorySummary } from "@/lib/analytics";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Boxes, TrendingDown, TrendingUp, AlertTriangle, PackageX, Wallet } from "lucide-react";
import { InventoryClient } from "./inventory-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session?.businessId) return null;

  const [summary, products, recentMovements] = await Promise.all([
    getInventorySummary(session.businessId),
    prisma.product.findMany({
      where: { businessId: session.businessId },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryMovement.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const stats = [
    { label: "Products", value: formatNumber(summary.totalProducts), icon: Boxes, color: "bg-sky-50 text-sky-600" },
    { label: "Stock Value", value: formatCurrency(summary.stockValue), sub: `${formatCurrency(summary.retailValue)} retail`, icon: Wallet, color: "bg-amber-50 text-amber-700" },
    { label: "Incoming", value: `+${formatNumber(summary.incoming)}`, sub: "purchases & returns", icon: TrendingUp, color: "bg-amber-50 text-amber-700" },
    { label: "Outgoing", value: `-${formatNumber(summary.outgoing)}`, sub: "sales & damage", icon: TrendingDown, color: "bg-rose-50 text-rose-600" },
    { label: "Low Stock", value: formatNumber(summary.low), icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
    { label: "Out of Stock", value: formatNumber(summary.outOfStock), icon: PackageX, color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={`Live stock levels across ${summary.totalProducts} products`}
      />

      <div className="stagger mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-lg font-bold tabular-nums text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
              {s.sub && <p className="text-[10px] text-slate-400">{s.sub}</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InventoryClient
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              category: p.category?.name ?? "—",
              currentStock: p.currentStock,
              reorderLevel: p.reorderLevel,
              costPrice: p.costPrice,
            }))}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Movements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentMovements.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No stock movements yet</p>
            )}
            {recentMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-slate-700">{m.productName}</p>
                  <p className="text-[11px] text-slate-400">{formatDateTime(m.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.quantity > 0 ? "success" : "danger"}>{m.type.toLowerCase()}</Badge>
                  <span className={`font-semibold tabular-nums ${m.quantity > 0 ? "text-amber-700" : "text-rose-600"}`}>
                    {m.quantity > 0 ? "+" : ""}{formatNumber(m.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}