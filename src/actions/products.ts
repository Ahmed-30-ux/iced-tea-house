"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createProduct, updateProduct, adjustInventory } from "@/lib/business";
import { ok, fail, handleActionError } from "@/lib/actions";

function num(v: any) { return parseFloat(v ?? "0"); }

export async function createProductAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    const product = await createProduct({
      session,
      name: String(formData.get("name")),
      sku: String(formData.get("sku") ?? "") || null,
      categoryId: String(formData.get("categoryId") ?? "") || null,
      sellingPrice: num(formData.get("sellingPrice")),
      costPrice: num(formData.get("costPrice")),
      reorderLevel: num(formData.get("reorderLevel")),
      supplier: String(formData.get("supplier") ?? "") || null,
      openingStock: num(formData.get("openingStock")),
    });
    return ok(product);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateProductAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    const product = await updateProduct({
      session,
      id: String(formData.get("id")),
      name: String(formData.get("name")),
      sku: String(formData.get("sku") ?? "") || null,
      categoryId: String(formData.get("categoryId") ?? "") || null,
      sellingPrice: num(formData.get("sellingPrice")),
      costPrice: num(formData.get("costPrice")),
      reorderLevel: num(formData.get("reorderLevel")),
      supplier: String(formData.get("supplier") ?? "") || null,
      status: String(formData.get("status") ?? "") || undefined,
    });
    return ok(product);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function adjustInventoryAction(productId: string, quantity: number, type: string, notes?: string) {
  try {
    const session = await requireAuth();
    await adjustInventory({ session, productId, quantity, type, notes });
    return ok({ productId });
  } catch (e) {
    return handleActionError(e);
  }
}