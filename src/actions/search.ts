"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handleActionError, type ActionResult } from "@/lib/actions";

export type SearchData = {
  orders: {
    id: string;
    orderNumber: string;
    total: number;
    customer: { name: string | null } | null;
  }[];
  products: { id: string; name: string; sku: string | null; currentStock: number }[];
  customers: { id: string; name: string; phone: string | null; email: string | null }[];
  purchases: {
    id: string;
    purchaseNumber: string;
    totalCost: number;
    supplier: { name: string | null } | null;
  }[];
};

export async function globalSearch(query: string): Promise<ActionResult<SearchData>> {
  try {
    const session = await requireAuth();
    if (!session.businessId || !query.trim()) return ok({ orders: [], products: [], customers: [], purchases: [] });
    const q = query.trim();
    const [orders, products, customers, purchases] = await Promise.all([
      prisma.order.findMany({
        where: { businessId: session.businessId, OR: [{ orderNumber: { contains: q } }, { customer: { name: { contains: q } } }] },
        orderBy: { orderDate: "desc" },
        take: 10,
        include: { customer: true },
      }),
      prisma.product.findMany({
        where: { businessId: session.businessId, OR: [{ name: { contains: q } }, { sku: { contains: q } }] },
        take: 10,
      }),
      prisma.customer.findMany({
        where: { businessId: session.businessId, OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] },
        take: 10,
      }),
      prisma.purchase.findMany({
        where: { businessId: session.businessId, OR: [{ purchaseNumber: { contains: q } }, { supplier: { name: { contains: q } } }] },
        take: 10,
        include: { supplier: true },
      }),
    ]);
    return ok({
      orders: orders.map((o) => ({ id: o.id, orderNumber: o.orderNumber, total: o.total, customer: o.customer ? { name: o.customer.name } : null })),
      products: products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, currentStock: p.currentStock })),
      customers: customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email })),
      purchases: purchases.map((p) => ({ id: p.id, purchaseNumber: p.purchaseNumber, totalCost: p.totalCost, supplier: p.supplier ? { name: p.supplier.name } : null })),
    });
  } catch (e) {
    return handleActionError(e);
  }
}