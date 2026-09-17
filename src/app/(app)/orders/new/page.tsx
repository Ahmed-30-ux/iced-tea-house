import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewOrderClient } from "./new-order-client";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const session = await getSession();
  if (!session?.businessId) redirect("/login");

  const [products, categories, customers] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: session.businessId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ where: { businessId: session.businessId }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({
      where: { businessId: session.businessId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <NewOrderClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        currentStock: p.currentStock,
        categoryId: p.categoryId,
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}