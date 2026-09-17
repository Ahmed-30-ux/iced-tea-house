import { Badge } from "@/components/ui/badge";

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "info" | "secondary" | "warning" | "success" | "default" | "danger" | "violet" }> = {
    PENDING: { label: "Pending", variant: "warning" },
    CONFIRMED: { label: "Confirmed", variant: "info" },
    PREPARING: { label: "Preparing", variant: "info" },
    READY: { label: "Ready", variant: "violet" },
    COMPLETED: { label: "Completed", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "danger" },
  };
  const s = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" }> = {
    PAID: { label: "Paid", variant: "success" },
    PARTIALLY_PAID: { label: "Partial", variant: "warning" },
    UNPAID: { label: "Unpaid", variant: "danger" },
  };
  const s = map[status] ?? { label: status, variant: "info" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function PaymentMethodBadge({ method }: { method: string | null }) {
  const map: Record<string, string> = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
    CARD: "Card",
    OTHER: "Other",
  };
  return <span className="text-sm text-slate-600">{method ? map[method] ?? method : "—"}</span>;
}

export function PurchaseStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "warning" | "success" | "danger" | "neutral" }> = {
    PENDING: { label: "Pending", variant: "warning" },
    RECEIVED: { label: "Received", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "neutral" },
  };
  const s = map[status] ?? { label: status, variant: "neutral" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function StockStatusBadge({ current, reorder }: { current: number; reorder: number }) {
  if (current <= 0) return <Badge variant="danger">Out of stock</Badge>;
  if (reorder > 0 && current <= reorder) return <Badge variant="warning">Low stock</Badge>;
  return <Badge variant="success">In stock</Badge>;
}

export function TransactionTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; variant: "success" | "danger" | "info" | "neutral" | "secondary" }> = {
    SALE: { label: "Sale", variant: "success" },
    PURCHASE: { label: "Purchase", variant: "neutral" },
    EXPENSE: { label: "Expense", variant: "danger" },
    REFUND: { label: "Refund", variant: "danger" },
    ADJUSTMENT: { label: "Adjustment", variant: "info" },
    OTHER: { label: "Other", variant: "secondary" },
  };
  const s = map[type] ?? { label: type, variant: "secondary" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}