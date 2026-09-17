"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockStatusBadge } from "@/components/ui/status";
import { SearchInput } from "@/components/ui/shared";
import { Select } from "@/components/ui/select";

type Row = {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  currentStock: number;
  reorderLevel: number;
  costPrice: number;
};

export function InventoryClient({ products }: { products: Row[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = query.toLowerCase();
      const matchesQ = !q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
      let matchesF = true;
      if (filter === "LOW") matchesF = p.reorderLevel > 0 && p.currentStock <= p.reorderLevel && p.currentStock > 0;
      if (filter === "OUT") matchesF = p.currentStock <= 0;
      if (filter === "OK") matchesF = !(p.reorderLevel > 0 && p.currentStock <= p.reorderLevel && p.currentStock > 0) && p.currentStock > 0;
      return matchesQ && matchesF;
    });
  }, [products, query, filter]);

  const totalValue = products.reduce((s, p) => s + p.currentStock * p.costPrice, 0);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {filtered.length} products · value {formatCurrency(totalValue)}
        </p>
        <div className="flex gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search stock..." className="max-w-xs" />
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-32">
            <option value="ALL">All items</option>
            <option value="LOW">Low stock</option>
            <option value="OUT">Out of stock</option>
            <option value="OK">Healthy</option>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Current Stock</TableHead>
              <TableHead className="text-right">Reorder Level</TableHead>
              <TableHead className="text-right">Stock Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400">No inventory items match</TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const ratio = p.reorderLevel > 0 ? (p.currentStock / p.reorderLevel) * 100 : 100;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/products/${p.id}`} className="font-medium text-slate-800 hover:text-amber-800 hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-400">{p.sku ?? ""}</p>
                  </TableCell>
                  <TableCell className="text-slate-600">{p.category}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold tabular-nums text-slate-800">{formatNumber(p.currentStock)}</span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            p.currentStock <= 0 ? "bg-rose-500" : ratio <= 100 ? "bg-amber-500" : "bg-amber-600"
                          )}
                          style={{ width: `${Math.min(100, Math.max(8, ratio))}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-500">{formatNumber(p.reorderLevel)}</TableCell>
                  <TableCell className="text-right tabular-nums text-slate-700">{formatCurrency(p.currentStock * p.costPrice)}</TableCell>
                  <TableCell><StockStatusBadge current={p.currentStock} reorder={p.reorderLevel} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}