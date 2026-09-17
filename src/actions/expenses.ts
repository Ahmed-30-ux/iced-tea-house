"use server";

import { createExpense } from "@/lib/business";
import { requireAuth } from "@/lib/auth";
import { createExpenseSchema, parseForm } from "@/lib/validations";
import { ok, handleActionError } from "@/lib/actions";

function num(v: any) { return parseFloat(v ?? "0"); }

export async function createExpenseAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    const expense = await createExpense({
      session,
      category: String(formData.get("category")),
      description: String(formData.get("description")),
      amount: num(formData.get("amount")),
      paymentMethod: String(formData.get("paymentMethod")) || "CASH",
      notes: String(formData.get("notes") ?? "") || null,
    });
    return ok(expense);
  } catch (e) {
    return handleActionError(e);
  }
}