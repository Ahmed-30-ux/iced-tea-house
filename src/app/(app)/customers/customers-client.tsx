"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, UserPlus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput, EmptyState } from "@/components/ui/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createCustomerAction } from "@/actions/customers";

type Row = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  orderCount: number;
  totalSpent: number;
};

export function CustomersClient({ initialCustomers }: { initialCustomers: Row[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const filtered = initialCustomers.filter((c) => {
    const q = query.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search customers..." className="max-w-sm" />
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Add your first customer to track their order history."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Customer</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/customers/${c.id}`} className="font-medium text-slate-800 hover:text-amber-800 hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-600">{c.phone ?? "—"}</div>
                    {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{c.orderCount}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-slate-800">{formatCurrency(c.totalSpent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Track orders and spending per customer.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 px-5 py-4"
            action={async (formData) => {
              setBusy(true);
              const res = await createCustomerAction(null, formData);
              setBusy(false);
              if (res.ok) {
                toast.success("Customer added");
                setOpen(false);
                router.refresh();
              } else toast.error(res.error);
            }}
          >
            <div>
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" name="name" required placeholder="Customer name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="c-phone">Phone</Label>
                <Input id="c-phone" name="phone" placeholder="0300-0000000" />
              </div>
              <div>
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" name="email" type="email" placeholder="name@email.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="c-notes">Notes</Label>
              <Input id="c-notes" name="notes" placeholder="Optional" />
            </div>
            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Add customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}