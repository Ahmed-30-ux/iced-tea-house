"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { adjustInventoryAction } from "@/actions/products";

export function AdjustStockButton({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [type, setType] = useState("ADJUSTMENT");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" /> Adjust Stock
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock — {productName}</DialogTitle>
            <DialogDescription>Record a manual stock change. Use a negative value for outflows (damage, spillage, etc.).</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 px-5 py-4"
            action={async () => {
              const q = Number(qty);
              if (!q || isNaN(q)) {
                toast.error("Enter a valid quantity");
                return;
              }
              setBusy(true);
              const res = await adjustInventoryAction(productId, q, type, notes);
              setBusy(false);
              if (res.ok) {
                toast.success("Inventory adjusted");
                setOpen(false);
                router.refresh();
              } else {
                toast.error(res.error);
              }
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adjust-qty">Quantity</Label>
                <Input
                  id="adjust-qty"
                  type="number"
                  step="0.01"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="e.g. -2 or 10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adjust-type">Type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="ADJUSTMENT">Manual Adjustment</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="RETURN">Return</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="adjust-notes">Notes</Label>
              <Input id="adjust-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why is this adjusting?" />
            </div>
            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Apply adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}