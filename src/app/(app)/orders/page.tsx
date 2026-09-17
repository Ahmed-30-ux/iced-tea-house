import Link from "next/link";
import nextDynamic from "next/dynamic";
import { Plus, ShoppingCart, Filter, X } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { OrderStatusBadge, PaymentStatusBadge, PaymentMethodBadge } from "@/components/ui/status";

const OrdersClient = nextDynamic(
  () => import("./orders-client").then((m) => ({ default: m.OrdersClient })),
  { loading: () => <div className="h-[200px] animate-pulse rounded-xl bg-slate-100" /> }
);

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders - Iced Tea House" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;

  if (!session?.businessId) return (
    <div className="py-16 text-center text-slate-500">Signed out. Please <Link className="text-amber-700 underline" href="/login">sign in</Link>.</div>
  );

  const where: any = { businessId: session.businessId };
  if (sp.q) {
    where.OR = [{ orderNumber: { contains: sp.q } }, { customer: { name: { contains: sp.q } } }];
  }
  if (sp.status) where.status = sp.status;
  if (sp.payment) where.paymentStatus = sp.payment;

  const [orders, totals] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { orderDate: "desc" },
      include: { customer: true, items: true },
    }),
    prisma.order.aggregate({
      where: { businessId: session.businessId },
      _sum: { total: true, totalCogs: true },
    }),
  ]);

  const counts = await prisma.order.groupBy({
    by: ["status"],
    where: { businessId: session.businessId },
    _count: true,
  });
  const statusCount = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div>
      <PageHeader title="Orders" description={`${orders.length} orders · ${formatCurrency(totals._sum.total ?? 0)} total sales`}>
        <Link href="/orders/new">
          <Button>
            <Plus className="h-4 w-4" /> New Order
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: "Pending", key: "PENDING" },
          { label: "Confirmed", key: "CONFIRMED" },
          { label: "Preparing", key: "PREPARING" },
          { label: "Ready", key: "READY" },
          { label: "Completed", key: "COMPLETED" },
          { label: "Cancelled", key: "CANCELLED" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/orders?status=${s.key}`}
            className={cn(
              "rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-amber-300 hover:shadow-sm",
              sp.status === s.key && "border-amber-500 ring-1 ring-amber-500"
            )}
          >
            <p className="text-lg font-bold tabular-nums text-slate-800">{statusCount[s.key] ?? 0}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <OrdersClient initialOrders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.customer?.name ?? "Walk-in",
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        total: o.total,
        paymentStatus: o.paymentStatus,
        status: o.status,
        orderDate: o.orderDate.toISOString(),
        paymentMethod: o.paymentMethod,
      }))} />

      <Card className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                  No orders found
                </TableCell>
              </TableRow>
            )}
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link href={`/orders/${o.id}`} className="font-medium text-amber-800 hover:underline">
                    {o.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{o.customer?.name ?? "Walk-in"}</TableCell>
                <TableCell>{o.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <PaymentStatusBadge status={o.paymentStatus} />
                    <span className="text-[10px] text-slate-400"><PaymentMethodBadge method={o.paymentMethod} /></span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-slate-800">
                  {formatCurrency(o.total)}
                </TableCell>
                <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                <TableCell className="text-right text-xs text-slate-500">{formatDateTime(o.orderDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}