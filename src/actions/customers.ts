"use server";

import { createCustomer, updateCustomer } from "@/lib/business";
import { requireAuth } from "@/lib/auth";
import { createCustomerSchema, parseForm } from "@/lib/validations";
import { ok, handleActionError } from "@/lib/actions";

export async function createCustomerAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    const customer = await createCustomer({
      session,
      name: String(formData.get("name")),
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    });
    return ok(customer);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateCustomerAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    const customer = await updateCustomer({
      session,
      id: String(formData.get("id")),
      name: String(formData.get("name")),
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    });
    return ok(customer);
  } catch (e) {
    return handleActionError(e);
  }
}