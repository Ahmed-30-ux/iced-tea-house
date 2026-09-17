"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2, ShoppingCart, Package, Users, Truck, X } from "lucide-react";
import { globalSearch } from "@/actions/search";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type UnwrapResult<T> = T extends { ok: true; data: infer D } ? D : never;
type SearchResults = UnwrapResult<Awaited<ReturnType<typeof globalSearch>>>;

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await globalSearch(query);
      if (res.ok) setResults(res.data);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[10vh]">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, products, customers, purchases..."
            className="h-12 flex-1 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
            </div>
          )}
          {!loading && !query.trim() && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">
              Type to search across your business
            </p>
          )}
          {!loading && results && (
            <div className="space-y-3">
              {results.orders.length > 0 && (
                <ResultGroup title="Orders" icon={<ShoppingCart className="h-3.5 w-3.5" />}>
                  {results.orders.map((o) => (
                    <ResultRow key={o.id} href={`/orders/${o.id}`} title={o.orderNumber} sub={o.customer?.name ?? "Walk-in"} right={formatCurrency(o.total)} onClose={onClose} />
                  ))}
                </ResultGroup>
              )}
              {results.products.length > 0 && (
                <ResultGroup title="Products" icon={<Package className="h-3.5 w-3.5" />}>
                  {results.products.map((p) => (
                    <ResultRow key={p.id} href={`/products/${p.id}`} title={p.name} sub={p.sku ?? "No SKU"} right={`${p.currentStock} in stock`} onClose={onClose} />
                  ))}
                </ResultGroup>
              )}
              {results.customers.length > 0 && (
                <ResultGroup title="Customers" icon={<Users className="h-3.5 w-3.5" />}>
                  {results.customers.map((c) => (
                    <ResultRow key={c.id} href={`/customers/${c.id}`} title={c.name} sub={c.phone ?? c.email ?? ""} onClose={onClose} />
                  ))}
                </ResultGroup>
              )}
              {results.purchases.length > 0 && (
                <ResultGroup title="Purchases" icon={<Truck className="h-3.5 w-3.5" />}>
                  {results.purchases.map((p) => (
                    <ResultRow key={p.id} href={`/purchases/${p.id}`} title={p.purchaseNumber} sub={p.supplier?.name ?? ""} right={formatCurrency(p.totalCost)} onClose={onClose} />
                  ))}
                </ResultGroup>
              )}
              {results.orders.length === 0 &&
                results.products.length === 0 &&
                results.customers.length === 0 &&
                results.purchases.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-slate-400">No results for “{query}”</p>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 px-2 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {icon}
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({
  href,
  title,
  sub,
  right,
  onClose,
}: {
  href: string;
  title: string;
  sub?: string;
  right?: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">{title}</p>
        {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
      </div>
      {right && <span className={cn("ml-3 shrink-0 text-xs font-medium text-slate-500")}>{right}</span>}
    </Link>
  );
}