"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendReceiptEmail } from "@/lib/email";
import { ok, fail, handleActionError, type ActionResult } from "@/lib/actions";

export async function sendOrderReceiptAction(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const businessId = session.businessId;
    if (!businessId) return fail("No business");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
        business: true,
      },
    });

    if (!order || order.businessId !== businessId) return fail("Order not found");

    if (order.status !== "COMPLETED") return fail("Receipts can only be sent for completed orders");

    const customerEmail = order.customer?.email;
    if (!customerEmail) return fail("Customer has no email address on file");

    const result = await sendReceiptEmail({
      to: customerEmail,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name ?? "Walk-in",
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        instructions: i.instructions,
      })),
      total: order.total,
      amountPaid: order.amountPaid,
      paymentStatus: order.paymentStatus,
      date: order.orderDate.toISOString(),
      businessName: order.business.name,
      orderType: order.orderType,
      isComplimentary: order.isComplimentary,
      cardFee: order.cardFee,
    });

    if (result.ok) {
      return ok({ sent: true, to: customerEmail });
    } else {
      return fail(result.error ?? "Failed to send email");
    }
  } catch (e) {
    return handleActionError(e);
  }
}
