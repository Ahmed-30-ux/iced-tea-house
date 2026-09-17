"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, roleAtLeast } from "@/lib/auth";
import { createOrder, completeOrder, cancelOrder, updateOrderStatus, addPayment } from "@/lib/business";
import { createOrderSchema, parseForm } from "@/lib/validations";
import { ok, fail, handleActionError, type ActionResult } from "@/lib/actions";

function num(v: any) {
  return parseFloat(v ?? "0");
}

export async function createOrderAction(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const itemsRaw = formData.getAll("itemName");
    const qtyRaw = formData.getAll("itemQty");
    const priceRaw = formData.getAll("itemPrice");
    const pidRaw = formData.getAll("itemProductId");

    const items = itemsRaw.map((name, i) => ({
      productId: String(pidRaw[i] ?? "") || null,
      productName: String(name),
      quantity: num(qtyRaw[i]),
      unitPrice: num(priceRaw[i]),
      costPrice: num(formData.getAll("itemCost")[i] ?? 0),
    }));

    const input = {
      customerId: String(formData.get("customerId") ?? "") || null,
      items,
      discount: num(formData.get("discount")),
      paymentMethod: String(formData.get("paymentMethod") ?? "") || null,
      paymentStatus: String(formData.get("paymentStatus") ?? "") || null,
      amountPaid: num(formData.get("amountPaid")),
      status: String(formData.get("status") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    };

    const parsed = createOrderSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid order");

    const order = await createOrder({ session, ...parsed.data });
    return ok(order);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function completeOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await completeOrder({ session, orderId });
    return ok({ orderId });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await cancelOrder({ session, orderId });
    return ok({ orderId });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function setOrderStatusAction(orderId: string, status: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await updateOrderStatus({ session, orderId, status });
    return ok({ orderId, status });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function addPaymentAction(
  orderId: string,
  amount: number,
  method: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await addPayment({ session, orderId, amount, method });
    return ok({ orderId });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const businessId = session.businessId;
    if (!businessId) return fail("No business");
    if (!roleAtLeast(session.role, "OWNER")) return fail("Only owners can delete orders");
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.businessId !== businessId) return fail("Order not found");
    if (order.status === "COMPLETED") return fail("Cannot delete a completed order. Cancel it instead.");
    await prisma.order.delete({ where: { id: orderId } });
    return ok({ orderId });
  } catch (e) {
    return handleActionError(e);
  }
}