"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { receivePurchaseAction, cancelPurchaseAction } from "@/actions/purchases";

export function PurchaseActions({ purchaseId, status }: { purchaseId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<any>, msg: string) => {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (res.ok) {
      toast.success(msg);
      router.refresh();
    } else toast.error(res.error);
  };

  if (status === "PENDING") {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => run("receive", () => receivePurchaseAction(purchaseId), "Purchase received — inventory updated")}
          disabled={!!busy}
        >
          {busy === "receive" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          Mark as received
        </Button>
        <Button
          variant="outline"
          className="border-rose-200 text-rose-600 hover:bg-rose-50"
          onClick={() => run("cancel", () => cancelPurchaseAction(purchaseId), "Purchase cancelled")}
          disabled={!!busy}
        >
          <X className="h-4 w-4" /> Cancel
        </Button>
      </div>
    );
  }
  return null;
}