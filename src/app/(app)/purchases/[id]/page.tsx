import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PurchaseStatusBadge, PaymentStatusBadge } from "@/components/ui/status";
import { PageHeader } from "@/components/page-header";
import { PurchaseActions } from "./purchase-actions";

export const dynamic = "force-dynamic";

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  if (!session?.businessId) notFound();

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { supplier: true, items: true, user: true },
  });
  if (!purchase || purchase.businessId !== session.businessId) notFound();

  const movements = await prisma.inventoryMovement.findMany({
    where: { businessId: session.businessId, referenceType: "PURCHASE", referenceId: purchase.id },
    orderBy: { createdAt: "desc" },
  });

  const payments = await prisma.financialTransaction.findMany({
    where: { businessId: session.businessId, referenceType: "PURCHASE", referenceId: purchase.id },
    orderBy: { date: "asc" },
  });

  const isReceived = purchase.status === "RECEIVED";

  return (
    <div>
      <PageHeader
        title={<span className="flex items-center gap-2">{purchase.purchaseNumber} <PurchaseStatusBadge status={purchase.status} /></span>}
        description={`${formatDateTime(purchase.purchaseDate)} · by ${purchase.user?.name ?? "—"}`}
      >
        <PurchaseActions purchaseId={purchase.id} status={purchase.status} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium text-slate-800">{i.productName}</TableCell>
                      <TableCell className="text-center tabular-nums">{i.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(i.unitCost)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(i.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="border-t border-slate-100 px-5 py-4">
              <div className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total cost</span><span className="tabular-nums">{formatCurrency(purchase.totalCost)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Paid</span><span className="tabular-nums text-amber-700">{formatCurrency(purchase.amountPaid)}</span>
                </div>
                {purchase.amountPaid < purchase.totalCost && (
                  <div className="flex justify-between text-rose-500">
                    <span>Balance due</span><span className="tabular-nums">{formatCurrency(purchase.totalCost - purchase.amountPaid)}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {purchase.notes && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{purchase.notes}</div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Supplier</span><span className="font-medium text-slate-800">{purchase.supplier?.name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Payment</span><PaymentStatusBadge status={purchase.paymentStatus} /></div>
              <div className="flex justify-between"><span className="text-slate-500">Method</span><span className="font-medium text-slate-800">{purchase.paymentMethod ? purchase.paymentMethod.split("_").join(" ").toLowerCase() : "—"}</span></div>
            </CardContent>
          </Card>

          {isReceived && (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Impact</CardTitle>
                <CardDescription>Stock added when received</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="truncate text-slate-700">{m.productName}</span>
                    <span className="font-semibold text-amber-700">+{m.quantity}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {payments.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-600">{t.type} · {formatDateTime(t.date)}</span>
                    <span className="font-semibold text-rose-600">-{formatCurrency(t.moneyOut)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}