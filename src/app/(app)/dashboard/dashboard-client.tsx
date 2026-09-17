"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { SalesTrendChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";

type TrendPoint = { label: string; sales: number; orders: number; profit: number };

const ranges = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "3m", label: "3 Months" },
];

export function DashboardRangeSwitch() {
  return (
    <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 lg:flex">
      <Calendar className="h-3.5 w-3.5" />
      Today's overview
    </div>
  );
}

export async function fetchTrend(businessId: string, rangeKey: string): Promise<TrendPoint[]> {
  try {
    const res = await fetch(`/api/charts/sales-trend?businessId=${businessId}&range=${rangeKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export function TrendChartLoader({ businessId }: { businessId: string }) {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetchTrend(businessId, range);
    setData(d);
    setLoading(false);
  }, [businessId, range]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                range === r.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const res = await fetch(`/api/charts/sales-trend?businessId=${businessId}&range=${range}&csv=1`);
            if (!res.ok) {
              toast.error("Failed to export");
              return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `sales-trend-${range}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Sales trend exported");
          }}
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          </div>
        )}
        <SalesTrendChart data={data.length ? data : [{ label: "No data", sales: 0, orders: 0, profit: 0 }]} />
      </div>
    </div>
  );
}