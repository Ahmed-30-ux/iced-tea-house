"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status";
import { SearchInput } from "@/components/ui/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

type Row = {
  id: string;
  orderNumber: string;
  customer: string;
  itemCount: number;
  total: number;
  paymentStatus: string;
  status: string;
  orderDate: string;
  paymentMethod: string | null;
  orderType: string;
  isComplimentary: boolean;
};

export function OrdersClient({ initialOrders }: { initialOrders: Row[] }) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? initialOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
          o.customer.toLowerCase().includes(query.toLowerCase())
      )
    : initialOrders;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Filter orders..." className="w-full max-w-xs" />
        <div className="hidden text-sm text-slate-400 sm:block">{filtered.length} results</div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-slate-400">No orders match your search</TableCell>
            </TableRow>
          )}
          {filtered.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link href={`/orders/${o.id}`} className="font-medium text-amber-800 hover:underline">
                  {o.orderNumber}
                </Link>
              </TableCell>
              <TableCell>{o.customer}</TableCell>
              <TableCell>
                <span className="text-xs">
                  {o.isComplimentary && <span className="mr-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">PR</span>}
                  {o.orderType === "DINE_IN" ? "Dine-in" : o.orderType === "TAKEAWAY" ? "Takeaway" : "Delivery"}
                </span>
              </TableCell>
              <TableCell>{o.itemCount}</TableCell>
              <TableCell><PaymentStatusBadge status={o.paymentStatus} /></TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{o.isComplimentary ? "FREE" : formatCurrency(o.total)}</TableCell>
              <TableCell><OrderStatusBadge status={o.status} /></TableCell>
              <TableCell className="text-right text-xs text-slate-500">{formatDateTime(o.orderDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}