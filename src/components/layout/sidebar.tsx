"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Receipt,
  Users,
  Wallet,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const navGroups = [
  {
    label: "Manage",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["OWNER", "MANAGER", "STAFF"] },
      { label: "Orders", href: "/orders", icon: ShoppingCart, roles: ["OWNER", "MANAGER", "STAFF"] },
      { label: "Products", href: "/products", icon: Package, roles: ["OWNER", "MANAGER", "STAFF"] },
      { label: "Inventory", href: "/inventory", icon: Boxes, roles: ["OWNER", "MANAGER"] },
      { label: "Purchases", href: "/purchases", icon: Truck, roles: ["OWNER", "MANAGER"] },
      { label: "Expenses", href: "/expenses", icon: Receipt, roles: ["OWNER", "MANAGER"] },
      { label: "Customers", href: "/customers", icon: Users, roles: ["OWNER", "MANAGER", "STAFF"] },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Finance", href: "/finance", icon: Wallet, roles: ["OWNER", "MANAGER"] },
      { label: "Reports", href: "/reports", icon: BarChart3, roles: ["OWNER", "MANAGER"] },
      { label: "Settings", href: "/settings", icon: Settings, roles: ["OWNER", "MANAGER"] },
    ],
  },
];

export function Sidebar({
  session,
  open,
  onClose,
  businessName,
}: {
  session: SessionUser;
  open: boolean;
  onClose: () => void;
  businessName: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[15.5rem] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0",
        open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-base">
            🧊
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-stone-900">{businessName}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700">Business OS</p>
          </div>
        </Link>
        <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items
                .filter((i) => i.roles.includes(session.role))
                .map((item) => {
                  const isActive =
                    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-amber-50 text-amber-800"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "text-amber-700" : "text-stone-400 group-hover:text-stone-600")} />
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-stone-100 p-3">
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-[11px] text-amber-700">Instagram</p>
          <p className="text-xs font-semibold text-amber-800">@icedteahouse</p>
        </div>
      </div>
    </aside>
  );
}