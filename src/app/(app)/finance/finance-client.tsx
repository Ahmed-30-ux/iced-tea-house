"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TransactionTypeBadge } from "@/components/ui/status";
import { toast } from "sonner";

type LedgerRow = {
  id: string;
  date: string;
  type: string;
  category: string | null;
  description: string;
  referenceType: string | null;
  moneyIn: number;
  moneyOut: number;
  balance: number;
  paymentMethod: string | null;
};

export function FinanceClient({
  businessId,
  initialBalance,
  initialLedger,
}: {
  businessId: string;
  initialBalance: number;
  initialLedger: LedgerRow[];
}) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    return initialLedger.filter((t) => {
      const matchesType = typeFilter === "ALL" || t.type === typeFilter;
      const matchesMethod = methodFilter === "ALL" || (t.paymentMethod ?? "CASH") === methodFilter;
      const d = new Date(t.date);
      const matchesFrom = !dateFrom || d >= new Date(dateFrom + "T00:00:00");
      const matchesTo = !dateTo || d <= new Date(dateTo + "T23:59:59");
      return matchesType && matchesMethod && matchesFrom && matchesTo;
    });
  }, [initialLedger, typeFilter, methodFilter, dateFrom, dateTo]);

  const cashIn = filtered.reduce((s, t) => s + t.moneyIn, 0);
  const cashOut = filtered.reduce((s, t) => s + t.moneyOut, 0);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/finance/ledger?businessId=${businessId}&type=${typeFilter === "ALL" ? "" : typeFilter}&method=${methodFilter === "ALL" ? "" : methodFilter}&from=${dateFrom}&to=${dateTo}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transaction-ledger.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Ledger exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-36">
            <option value="ALL">All types</option>
            <option value="SALE">Sales</option>
            <option value="PURCHASE">Purchases</option>
            <option value="EXPENSE">Expenses</option>
            <option value="REFUND">Refunds</option>
            <option value="ADJUSTMENT">Adjustments</option>
            <option value="OTHER">Other</option>
          </Select>
          <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="w-36">
            <option value="ALL">All methods</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </Select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-amber-500 focus:outline-none"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-amber-500 focus:outline-none"
          />
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-amber-700">+{formatCurrency(cashIn)}</p>
              <p className="text-xs text-rose-600">-{formatCurrency(cashOut)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              CSV
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Money In</TableHead>
                <TableHead className="text-right">Money Out</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-slate-400">No transactions match your filters</TableCell></TableRow>
              )}
              {/* Show descending (newest first) */}
              {[...filtered].reverse().map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-xs text-slate-500">{formatDateTime(t.date)}</TableCell>
                  <TableCell><TransactionTypeBadge type={t.type} /></TableCell>
                  <TableCell>
                    <div className="max-w-[20rem]">
                      <p className="truncate text-slate-700">{t.description}</p>
                      {t.category && <p className="text-[10px] text-slate-400">{t.category}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{t.paymentMethod ? t.paymentMethod.split("_").join(" ").toLowerCase() : "—"}</TableCell>
                  <TableCell className={cn("text-right tabular-nums font-medium", t.moneyIn > 0 ? "text-amber-700" : "text-slate-400")}>
                    {t.moneyIn > 0 ? `+${formatCurrency(t.moneyIn)}` : "—"}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums font-medium", t.moneyOut > 0 ? "text-rose-600" : "text-slate-400")}>
                    {t.moneyOut > 0 ? `-${formatCurrency(t.moneyOut)}` : "—"}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums font-semibold", t.balance < 0 ? "text-rose-600" : "text-slate-800")}>
                    {formatCurrency(t.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}