"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Undo2, CheckCircle2, Banknote, Printer, Mail, Utensils, Package, Truck, Gift, MessageSquare } from "lucide-react";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge, TransactionTypeBadge } from "@/components/ui/status";
import { PageHeader } from "@/components/page-header";
import {
  completeOrderAction,
  cancelOrderAction,
  setOrderStatusAction,
  addPaymentAction,
} from "@/actions/orders";
import { sendOrderReceiptAction } from "@/actions/emails";

type OrderData = {
  id: string;
  orderNumber: string;
  customer: string;
  customerId: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  orderType: string;
  isComplimentary: boolean;
  cardFee: number;
  source: string;
  subtotal: number;
  discount: number;
  total: number;
  totalCogs: number;
  grossProfit: number;
  amountPaid: number;
  notes: string | null;
  orderDate: string;
  items: { id: string; productName: string; quantity: number; unitPrice: number; costPrice: number; lineTotal: number; instructions: string | null }[];
  payments: { id: string; amount: number; method: string; date: string }[];
  createdBy: string;
};

const statusFlow = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

export function OrderDetailClient({
  order,
  movements,
  shifts,
}: {
  order: OrderData;
  movements: { id: string; type: string; productName: string; quantity: number; balanceAfter: number; createdAt: string }[];
  shifts: { id: string; type: string; moneyIn: number; moneyOut: number; date: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(order.total - order.amountPaid > 0 ? (order.total - order.amountPaid).toFixed(0) : "");
  const terminal = order.status === "COMPLETED" || order.status === "CANCELLED";

  const run = async (key: string, fn: () => Promise<any>, success: string) => {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (res.ok) {
      toast.success(success);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const awaitingPayment = order.total - order.amountPaid;

  const printReceipt = () => {
    const win = window.open("", "_blank", "width=280,height=600");
    if (!win) return;
    const typeLabel = order.orderType === "DINE_IN" ? "Dine-in" : order.orderType === "TAKEAWAY" ? "Takeaway" : "Delivery";
    const itemsHtml = order.items
      .map(
        (i) =>
          `<tr><td>${i.productName} × ${i.quantity}${i.instructions ? `<br><small style="color:#b8860b">  ${i.instructions}</small>` : ""}</td><td style="text-align:right">${formatCurrency(i.quantity * i.unitPrice)}</td></tr>`
      )
      .join("");
    win.document.write(`
      <html><head><title>${order.orderNumber}</title><style>
        body{font-family:monospace;font-size:12px;padding:16px}
        h1{font-size:16px} table{width:100%;border-collapse:collapse;margin-top:8px}
        hr{border:none;border-top:1px dashed #000;margin:8px 0}
        .tot{font-weight:bold} .r{text-align:right}
      </style></head><body>
        <h1>ICED TEA HOUSE</h1>
        <div>@icedteahouse</div><hr>
        <div><b>${order.orderNumber}</b> · ${typeLabel}</div>
        <div>${formatDateTime(order.orderDate)}</div>
        <div>Customer: ${order.customer}</div>
        <div>Source: ${order.source.split("_").join(" ")}</div>
        ${order.isComplimentary ? '<div style="color:#7c3aed;font-weight:bold">★ PR / COMPLIMENTARY</div>' : ""}<hr>
        <table>${itemsHtml}</table><hr>
        <div>Subtotal: <span class="r" style="float:right">${formatCurrency(order.subtotal)}</span></div>
        ${order.discount > 0 ? `<div>Discount: <span class="r" style="float:right">-${formatCurrency(order.discount)}</span></div>` : ""}
        ${order.cardFee > 0 ? `<div>Card fee: <span class="r" style="float:right">${formatCurrency(order.cardFee)}</span></div>` : ""}
        <div class="tot">TOTAL: <span class="r" style="float:right">${order.isComplimentary ? "FREE" : formatCurrency(order.total)}</span></div>
        <div>Paid: <span class="r" style="float:right">${formatCurrency(order.amountPaid)}</span></div>
        <div>Status: ${order.status === "COMPLETED" ? "COMPLETED" : order.status} · ${order.paymentStatus}</div>
        <hr><center>Thank you! Visit @icedteahouse</center>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const sendReceipt = async () => {
    setBusy("email");
    const res = await sendOrderReceiptAction(order.id);
    setBusy(null);
    if (res.ok) {
      toast.success(`Receipt sent to ${res.data.to}`);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {order.orderNumber}
            <OrderStatusBadge status={order.status} />
          </span>
        }
        description={`Created ${formatDateTime(order.orderDate)} by ${order.createdBy}`}
      >
        <Button variant="outline" size="sm" onClick={printReceipt} disabled={terminal && order.status !== "COMPLETED"}>
          <Printer className="h-3.5 w-3.5" /> Receipt
        </Button>
        {order.status === "COMPLETED" && (
          <Button variant="outline" size="sm" onClick={sendReceipt} disabled={busy === "email"}>
            {busy === "email" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
            Send Receipt
          </Button>
        )}
        <Link href="/orders" className="text-sm text-slate-500 hover:text-slate-700">Back to orders</Link>
      </PageHeader>

      {/* Status flow */}
      {!terminal && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <span className="mr-1 text-xs font-medium text-slate-500">Move to:</span>
          {statusFlow.filter((s) => s !== "COMPLETED" && s !== "CANCELLED").map((s) => (
            <button
              key={s}
              onClick={() => run(`st-${s}`, () => setOrderStatusAction(order.id, s), `Order marked ${s.toLowerCase()}`)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                order.status === s
                  ? "border-amber-600 bg-amber-50 text-amber-800"
                  : "border-slate-200 text-slate-600 hover:border-amber-300"
              )}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          <div className="mx-2 hidden h-4 w-px bg-slate-200 sm:block" />
          {order.status !== "COMPLETED" && (
            <Button size="sm" onClick={() => run("complete", () => completeOrderAction(order.id), "Order completed — inventory and revenue updated")} disabled={!!busy}>
              {busy === "complete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Complete order
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={() => run("cancel", () => cancelOrderAction(order.id), "Order cancelled — inventory and finances reversed")}
            disabled={!!busy}
          >
            {busy === "cancel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
            {order.status === "COMPLETED" ? "Cancel & refund" : "Cancel order"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium text-slate-800">
                        {i.productName}
                        {i.instructions && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
                            <MessageSquare className="h-3 w-3" />
                            {i.instructions}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{i.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(i.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(i.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="border-t border-slate-100 px-5 py-4">
              <div className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span><span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount</span><span className="tabular-nums">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.cardFee > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Card fee (2.5%)</span><span className="tabular-nums">{formatCurrency(order.cardFee)}</span>
                  </div>
                )}
                {order.isComplimentary && (
                  <div className="flex justify-between text-purple-600">
                    <span>PR / Complimentary</span><span className="tabular-nums font-semibold">FREE</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total</span><span className="tabular-nums">{order.isComplimentary ? "FREE" : formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Paid</span><span className="tabular-nums text-amber-700">{formatCurrency(order.amountPaid)}</span>
                </div>
                {awaitingPayment > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Balance due</span><span className="tabular-nums">{formatCurrency(awaitingPayment)}</span>
                  </div>
                )}
                {order.status === "COMPLETED" && (
                  <>
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 text-slate-500">
                      <span>COGS</span><span className="tabular-nums">{formatCurrency(order.totalCogs)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-amber-800">
                      <span>Gross Profit</span><span className="tabular-nums">{formatCurrency(order.grossProfit)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Payments</CardTitle>
                <CardDescription><PaymentStatusBadge status={order.paymentStatus} /> · {order.paymentMethod ? order.paymentMethod.split("_").join(" ").toLowerCase() : "no method"}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {order.payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No payments recorded yet</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {order.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-slate-600">{p.method.split("_").join(" ").toLowerCase()}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums text-slate-800">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(p.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" && (
                <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={String(awaitingPayment)}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-amber-500 focus:outline-none sm:w-36"
                  />
                  <Button
                    size="sm"
                    disabled={busy === "pay" || !payAmount}
                    onClick={() => run("pay", () => addPaymentAction(order.id, Number(payAmount), "CASH"), "Payment recorded")}
                  >
                    {busy === "pay" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Banknote className="h-3.5 w-3.5" />}
                    Record payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: order info + activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-medium text-slate-800">{order.customer}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium text-slate-800">{formatDateTime(order.orderDate)}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Type</span>
                <span className="flex items-center gap-1 font-medium text-slate-800">
                  {order.orderType === "DINE_IN" && <Utensils className="h-3.5 w-3.5 text-amber-600" />}
                  {order.orderType === "TAKEAWAY" && <Package className="h-3.5 w-3.5 text-blue-600" />}
                  {order.orderType === "DELIVERY" && <Truck className="h-3.5 w-3.5 text-green-600" />}
                  {order.orderType === "DINE_IN" ? "Dine-in" : order.orderType === "TAKEAWAY" ? "Takeaway" : "Delivery"}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">Source</span><span className="font-medium text-slate-800">{order.source.split("_").join(" ").toLowerCase()}</span></div>
              {order.isComplimentary && (
                <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
                  <Gift className="h-4 w-4" /> PR / Complimentary Order
                </div>
              )}
              <div className="flex justify-between"><span className="text-slate-500">Payment</span><PaymentStatusBadge status={order.paymentStatus} /></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><OrderStatusBadge status={order.status} /></div>
              <div className="flex justify-between"><span className="text-slate-500">Created by</span><span className="font-medium text-slate-800">{order.createdBy}</span></div>
              {order.notes && (
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{order.notes}</div>
              )}
            </CardContent>
          </Card>

          {order.status === "COMPLETED" && (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Impact</CardTitle>
                <CardDescription>Stock changes from this order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="truncate text-slate-700">{m.productName}</span>
                    <span className={cn("font-semibold tabular-nums", m.quantity < 0 ? "text-rose-600" : "text-amber-700")}>
                      {m.quantity < 0 ? "" : "+"}{m.quantity}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(shifts.length > 0 || movements.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {shifts.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <TransactionTypeBadge type={t.type} />
                    <span className={cn("tabular-nums font-medium", t.moneyIn > 0 ? "text-amber-700" : "text-rose-600")}>
                      {t.moneyIn > 0 ? "+" : "-"}{formatCurrency(t.moneyIn > 0 ? t.moneyIn : t.moneyOut)}
                    </span>
                  </div>
                ))}
                {shifts.length === 0 && movements.length === 0 && (
                  <p className="py-2 text-center text-xs text-slate-400">No financial or inventory activity yet</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}