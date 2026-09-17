"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SearchInput, EmptyState } from "@/components/ui/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { PurchaseStatusBadge, PaymentStatusBadge } from "@/components/ui/status";
import { createPurchaseAction, receivePurchaseAction, cancelPurchaseAction } from "@/actions/purchases";

type Row = {
  id: string;
  purchaseNumber: string;
  supplier: string;
  itemCount: number;
  totalCost: number;
  status: string;
  paymentStatus: string;
  purchaseDate: string;
};

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; costPrice: number };

export function PurchasesClient({
  initialPurchases,
  suppliers,
  products,
}: {
  initialPurchases: Row[];
  suppliers: Supplier[];
  products: Product[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [terms, setTerms] = useState<{ productId: string; name: string; qty: string; cost: string }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paid, setPaid] = useState("0");
  const [notes, setNotes] = useState("");

  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));
  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));

  const addTerm = () => setTerms((t) => [...t, { productId: "", name: "", qty: "1", cost: "" }]);

  const selectProduct = (index: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setTerms((t) => t.map((term, i) => (i === index ? { ...term, productId, name: p.name, cost: String(p.costPrice) } : term)));
  };

  const total = terms.reduce((s, t) => s + Number(t.qty || 0) * Number(t.cost || 0), 0);

  const filtered = initialPurchases.filter((p) => {
    const q = query.toLowerCase();
    const matchesQ = !q || p.purchaseNumber.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q);
    const matchesS = statusFilter === "ALL" || p.status === statusFilter;
    return matchesQ && matchesS;
  });

  const submit = async (formData: FormData) => {
    if (!terms.length) {
      toast.error("Add at least one item");
      return;
    }
    setBusy(true);
    if (supplierId) formData.append("supplierId", supplierId);
    for (const t of terms) {
      formData.append("itemName", t.name);
      formData.append("itemQty", t.qty);
      formData.append("itemCost", t.cost);
      if (t.productId) formData.append("itemProductId", t.productId);
    }
    formData.append("paymentStatus", total <= Number(paid) ? "PAID" : "");
    formData.append("paymentMethod", paymentMethod);
    formData.append("amountPaid", paid);
    formData.append("notes", notes);
    const res = await createPurchaseAction(null, formData);
    setBusy(false);
    if (res.ok) {
      toast.success("Purchase created");
      setOpen(false);
      setTerms([]);
      setSupplierId(null);
      setPaid("0");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const receive = async (id: string) => {
    const res = await receivePurchaseAction(id);
    if (res.ok) {
      toast.success("Purchase received — inventory updated");
      router.refresh();
    } else toast.error(res.error);
  };

  const cancel = async (id: string) => {
    const res = await cancelPurchaseAction(id);
    if (res.ok) {
      toast.success("Purchase cancelled");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search purchases..." className="max-w-xs flex-1" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Purchase
        </Button>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="No purchases found"
            description="Record a purchase to restock your inventory."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Purchase</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-center">Units</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/purchases/${p.id}`} className="font-medium text-amber-800 hover:underline">
                      {p.purchaseNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">{p.supplier}</TableCell>
                  <TableCell className="text-center tabular-nums">{formatNumber(p.itemCount)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(p.totalCost)}</TableCell>
                  <TableCell><PaymentStatusBadge status={p.paymentStatus} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PurchaseStatusBadge status={p.status} />
                      {p.status === "PENDING" && (
                        <>
                          <button onClick={() => receive(p.id)} className="text-xs font-medium text-amber-700 hover:underline">
                            Receive
                          </button>
                          <button onClick={() => cancel(p.id)} className="text-xs text-slate-400 hover:text-rose-500">
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs text-slate-500">{formatDate(p.purchaseDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Purchase</DialogTitle>
            <DialogDescription>Stock increases only when the purchase is marked received.</DialogDescription>
          </DialogHeader>
          <form action={submit} className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier</Label>
                <Combobox
                  options={supplierOptions}
                  value={supplierId}
                  onSelect={setSupplierId}
                  placeholder="Select supplier"
                />
              </div>
              <div>
                <Label>Payment method</Label>
                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTerm}>
                  <Plus className="h-3.5 w-3.5" /> Add item
                </Button>
              </div>
              {terms.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                  Add products to this purchase
                </p>
              ) : (
                <div className="space-y-2">
                  {terms.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Combobox
                          options={productOptions}
                          value={t.productId || null}
                          onSelect={(v) => v && selectProduct(i, v)}
                          placeholder="Select product"
                        />
                      </div>
                      <Input
                        type="number"
                        min="1"
                        value={t.qty}
                        onChange={(e) => setTerms((terms) => terms.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))}
                        placeholder="Qty"
                        className="w-20"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={t.cost}
                        onChange={(e) => setTerms((terms) => terms.map((x, j) => (j === i ? { ...x, cost: e.target.value } : x)))}
                        placeholder="Cost"
                        className="w-24"
                      />
                      <button type="button" onClick={() => setTerms((terms) => terms.filter((_, j) => j !== i))} className="text-slate-300 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount paid</Label>
                <Input type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Total cost</span>
              <span className="text-lg font-bold tabular-nums text-slate-900">{formatCurrency(total)}</span>
            </div>

            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Create purchase
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}