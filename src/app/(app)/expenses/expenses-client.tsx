"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Download } from "lucide-react";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DonutChart } from "@/components/charts/charts";
import { createExpenseAction } from "@/actions/expenses";

const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Salaries", "Marketing", "Transport", "Packaging", "Maintenance", "Supplies", "Other"];

type Row = {
  id: string;
  expenseNumber: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  date: string;
  notes: string | null;
  user: string;
};

export function ExpensesClient({
  initialExpenses,
  byCategory,
}: {
  initialExpenses: Row[];
  byCategory: { category: string; amount: number }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const filtered = initialExpenses.filter((e) => {
    const q = query.toLowerCase();
    const matchesQ = !q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.expenseNumber.toLowerCase().includes(q);
    const matchesC = catFilter === "ALL" || e.category === catFilter;
    return matchesQ && matchesC;
  });

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const exportCsv = () => {
    const rows = ["id,date,category,description,amount,payment_method,created_by"];
    for (const e of initialExpenses) {
      rows.push(`${e.expenseNumber},${e.date},${e.category},"${e.description.replaceAll('"', '""')}",${e.amount},${e.paymentMethod},${e.user}`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Expenses exported");
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-2">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search expenses..." className="max-w-xs flex-1" />
                <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="w-36">
                  <option value="ALL">All categories</option>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Filtered: <b className="text-slate-800">{formatCurrency(total)}</b></span>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button size="sm" onClick={() => setOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Expense
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-400">No expenses found</TableCell></TableRow>
                )}
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <p className="font-medium text-slate-800">{e.description}</p>
                      <p className="text-[11px] text-slate-400">{e.expenseNumber}</p>
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={e.category} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{e.paymentMethod.split("_").join(" ").toLowerCase()}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-rose-600">-{formatCurrency(e.amount)}</TableCell>
                    <TableCell className="text-xs text-slate-500">{e.user}</TableCell>
                    <TableCell className="text-right text-xs text-slate-500">{formatDateTime(e.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-slate-800">Last 30 days by category</h3>
            {byCategory.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No expenses</p>
            ) : (
              <DonutChart data={byCategory.map((c) => ({ name: c.category, value: c.amount }))} currency="PKR" showValue={true} />
            )}
          </div>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>This immediately affects your cash and net profit.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 px-5 py-4"
            action={async (formData) => {
              setBusy(true);
              const res = await createExpenseAction(null, formData);
              setBusy(false);
              if (res.ok) {
                toast.success("Expense recorded");
                setOpen(false);
                router.refresh();
              } else toast.error(res.error);
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exp-cat">Category</Label>
                <Select id="exp-cat" name="category" required defaultValue="Packaging">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="exp-method">Payment method</Label>
                <Select id="exp-method" name="paymentMethod" defaultValue="CASH">
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="exp-desc">Description</Label>
              <Input id="exp-desc" name="description" required placeholder="e.g. Ice purchase for the week" />
            </div>
            <div>
              <Label htmlFor="exp-amount">Amount</Label>
              <Input id="exp-amount" name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="exp-notes">Notes</Label>
              <Input id="exp-notes" name="notes" placeholder="Optional" />
            </div>
            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Rent: "bg-sky-50 text-sky-700",
    Utilities: "bg-amber-50 text-amber-700",
    Salaries: "bg-violet-50 text-violet-700",
    Marketing: "bg-pink-50 text-pink-700",
    Transport: "bg-amber-50 text-amber-800",
    Packaging: "bg-amber-50 text-amber-800",
    Maintenance: "bg-orange-50 text-orange-700",
    Supplies: "bg-slate-100 text-slate-600",
    Other: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", colors[category] ?? "bg-slate-100 text-slate-500")}>
      {category}
    </span>
  );
}