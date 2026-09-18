import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderDetailClient } from "./order-detail-client";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.businessId) notFound();

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      payments: true,
      user: true,
    },
  });

  if (!order || order.businessId !== session.businessId) notFound();

  const movements = await prisma.inventoryMovement.findMany({
    where: { businessId: session.businessId, referenceType: "ORDER", referenceId: order.id },
    orderBy: { createdAt: "desc" },
  });

  const shifts = await prisma.financialTransaction.findMany({
    where: { businessId: session.businessId, referenceType: "ORDER", referenceId: order.id },
    orderBy: { date: "asc" },
  });

  return (
    <OrderDetailClient
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer?.name ?? "Walk-in",
        customerId: order.customerId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        orderType: order.orderType,
        isComplimentary: order.isComplimentary,
        cardFee: order.cardFee,
        source: order.source,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        totalCogs: order.totalCogs,
        grossProfit: order.grossProfit,
        amountPaid: order.amountPaid,
        notes: order.notes,
        orderDate: order.orderDate.toISOString(),
        items: order.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          costPrice: i.costPrice,
          lineTotal: i.lineTotal,
          instructions: i.instructions,
        })),
        payments: order.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          date: p.date.toISOString(),
        })),
        createdBy: order.user?.name ?? "—",
      }}
      movements={movements.map((m) => ({
        id: m.id,
        type: m.type,
        productName: m.productName,
        quantity: m.quantity,
        balanceAfter: m.balanceAfter,
        createdAt: m.createdAt.toISOString(),
      }))}
      shifts={shifts.map((t) => ({
        id: t.id,
        type: t.type,
        moneyIn: t.moneyIn,
        moneyOut: t.moneyOut,
        date: t.date.toISOString(),
      }))}
    />
  );
}