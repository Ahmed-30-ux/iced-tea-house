"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createPurchase, receivePurchase, cancelPurchase } from "@/lib/business";
import { createPurchaseSchema } from "@/lib/validations";
import { ok, fail, handleActionError } from "@/lib/actions";

function num(v: any) { return parseFloat(v ?? "0"); }

export async function createPurchaseAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    const itemsRaw = formData.getAll("itemName");
    const qtyRaw = formData.getAll("itemQty");
    const costRaw = formData.getAll("itemCost");
    const pidRaw = formData.getAll("itemProductId");

    const items = itemsRaw.map((name, i) => ({
      productId: String(pidRaw[i] ?? "") || null,
      productName: String(name),
      quantity: num(qtyRaw[i]),
      unitCost: num(costRaw[i]),
    }));

    const purchase = await createPurchase({
      session,
      supplierId: String(formData.get("supplierId") ?? "") || null,
      items,
      paymentStatus: String(formData.get("paymentStatus") ?? "") || undefined,
      paymentMethod: String(formData.get("paymentMethod") ?? "") || undefined,
      amountPaid: num(formData.get("amountPaid")),
      notes: String(formData.get("notes") ?? "") || null,
    });
    return ok(purchase);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function receivePurchaseAction(purchaseId: string) {
  try {
    const session = await requireAuth();
    await receivePurchase({ session, purchaseId });
    return ok({ purchaseId });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function cancelPurchaseAction(purchaseId: string) {
  try {
    const session = await requireAuth();
    await cancelPurchase({ session, purchaseId });
    return ok({ purchaseId });
  } catch (e) {
    return handleActionError(e);
  }
}