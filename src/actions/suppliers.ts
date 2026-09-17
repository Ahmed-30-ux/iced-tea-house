"use server";

import { requireAuth } from "@/lib/auth";
import { createSupplier } from "@/lib/business";
import { ok, handleActionError } from "@/lib/actions";

export async function createSupplierAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    const supplier = await createSupplier({
      session,
      name: String(formData.get("name")),
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    });
    return ok(supplier);
  } catch (e) {
    return handleActionError(e);
  }
}