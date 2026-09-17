"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SearchInput, EmptyState } from "@/components/ui/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StockStatusBadge } from "@/components/ui/status";
import { createProductAction, updateProductAction } from "@/actions/products";

type Row = {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  sellingPrice: number;
  costPrice: number;
  currentStock: number;
  reorderLevel: number;
  status: string;
  productCount: number;
};

type Category = { id: string; name: string };

export function ProductsClient({ initialProducts, categories }: { initialProducts: Row[]; categories: Category[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = initialProducts.filter((p) => {
    const q = query.toLowerCase();
    const matchesQ = !q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchesS = statusFilter === "ALL" || p.status === statusFilter;
    return matchesQ && matchesS;
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: Row) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const ProductForm = (
    <form
      action={async (formData: FormData) => {
        setSubmitting(true);
        if (editing) formData.append("id", editing.id);
        const res = editing ? await updateProductAction(null, formData) : await createProductAction(null, formData);
        setSubmitting(false);
        if (res.ok) {
          toast.success(editing ? "Product updated" : "Product created");
          setDialogOpen(false);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      }}
      className="space-y-4 px-5 py-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Product name</Label>
          <Input id="name" name="name" required defaultValue={editing?.name} placeholder="Peach Iced Tea" />
        </div>
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={editing?.sku ?? ""} placeholder="PIT-500" />
        </div>
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" defaultValue={editing?.category ?? ""}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sellingPrice">Selling price</Label>
          <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" min="0" required defaultValue={editing?.sellingPrice ?? ""} />
        </div>
        <div>
          <Label htmlFor="costPrice">Cost price</Label>
          <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" required defaultValue={editing?.costPrice ?? ""} />
        </div>
        <div>
          <Label htmlFor="reorderLevel">Reorder level</Label>
          <Input id="reorderLevel" name="reorderLevel" type="number" step="0.01" min="0" defaultValue={editing?.reorderLevel ?? 0} />
        </div>
        <div>
          <Label htmlFor="supplier">Supplier</Label>
          <Input id="supplier" name="supplier" placeholder="TeaCo Pakistan" />
        </div>
        {!editing && (
          <div>
            <Label htmlFor="openingStock">Opening stock</Label>
            <Input id="openingStock" name="openingStock" type="number" step="0.01" min="0" defaultValue={0} />
          </div>
        )}
        {editing && (
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={editing.status}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCONTINUED">Discontinued</option>
            </Select>
          </div>
        )}
      </div>
      <DialogFooter className="px-0">
        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : "Create product"}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search products..." className="max-w-xs flex-1" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISCONTINUED">Discontinued</option>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="No products found"
            description={query ? "Try a different search." : "Add your first product to start selling."}
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Product</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const margin = p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/products/${p.id}`} className="font-medium text-slate-800 hover:text-amber-800 hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-400">{p.sku ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-slate-600">{p.category}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(p.sellingPrice)}</TableCell>
                    <TableCell className="text-right text-slate-600 tabular-nums">{formatCurrency(p.costPrice)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={margin >= 50 ? "success" : margin >= 30 ? "secondary" : "warning"}>
                        {margin}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-medium tabular-nums">{formatNumber(p.currentStock)}</span>
                        <StockStatusBadge current={p.currentStock} reorder={p.reorderLevel} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.status === "ACTIVE" ? "success" : "neutral"}>{p.status.toLowerCase()}</Badge>
                        <button onClick={() => openEdit(p)} className="text-xs text-slate-400 hover:text-amber-700">Edit</button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editing ? "Adjust product details." : "Create a new product. Opening stock will be recorded as inventory."}
            </DialogDescription>
          </DialogHeader>
          {ProductForm}
        </DialogContent>
      </Dialog>
    </div>
  );
}