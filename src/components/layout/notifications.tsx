"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Package, ShoppingCart, Wallet, AlertTriangle } from "lucide-react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { formatCurrency, relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

const icons: Record<string, React.ReactNode> = {
  low_stock: <Package className="h-3.5 w-3.5 text-amber-600" />,
  out_of_stock: <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />,
  unpaid_order: <ShoppingCart className="h-3.5 w-3.5 text-rose-600" />,
  large_expense: <Wallet className="h-3.5 w-3.5 text-amber-600" />,
};

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    const res = await getNotifications();
    if (res.ok) setItems(res.data as Notification[]);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700",
          open && "bg-slate-50"
        )}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={async () => {
                    await markAllNotificationsRead();
                    load();
                  }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</p>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={async () => {
                    await markNotificationRead(n.id);
                    load();
                  }}
                  className={cn(
                    "flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                    !n.read && "bg-amber-50/40"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      n.read ? "bg-slate-100" : "bg-amber-100"
                    )}
                  >
                    {icons[n.type] ?? <span className="h-3.5 w-3.5 rounded-full bg-slate-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}