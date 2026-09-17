import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  if (!session?.businessId) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        include: { items: true },
        orderBy: { orderDate: "desc" },
      },
    },
  });
  if (!customer || customer.businessId !== session.businessId) notFound();

  const activeOrders = customer.orders.filter((o) => o.status !== "CANCELLED");
  const totalSpent = activeOrders.reduce((s, o) => s + o.total, 0);
  const outstanding = activeOrders.reduce((s, o) => s + (o.total - o.amountPaid), 0);
  const lastOrder = activeOrders[0];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-lg font-bold text-white">
            {customer.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{customer.name}</h1>
            <p className="text-sm text-slate-500">
              {customer.phone ?? ""}{customer.phone && " · "}{customer.email ?? ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total Orders</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{activeOrders.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total Spent</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Last Order</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{lastOrder ? formatDateTime(lastOrder.orderDate) : "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Outstanding Balance</p>
          <p className={`mt-1 text-xl font-bold ${outstanding > 0 ? "text-rose-600" : "text-amber-700"}`}>
            {formatCurrency(outstanding)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Every order placed by this customer</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.orders.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-12 text-center text-slate-400">No orders for this customer yet</TableCell></TableRow>
              )}
              {customer.orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <a href={`/orders/${o.id}`} className="font-medium text-amber-800 hover:underline">{o.orderNumber}</a>
                  </TableCell>
                  <TableCell className="tabular-nums">{o.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCurrency(o.total)}</TableCell>
                  <TableCell className="text-right tabular-nums text-amber-700">{formatCurrency(o.amountPaid)}</TableCell>
                  <TableCell className="text-right tabular-nums text-rose-600">{formatCurrency(Math.max(0, o.total - o.amountPaid))}</TableCell>
                  <TableCell><PaymentStatusBadge status={o.paymentStatus} /></TableCell>
                  <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-right text-xs text-slate-500">{formatDateTime(o.orderDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}