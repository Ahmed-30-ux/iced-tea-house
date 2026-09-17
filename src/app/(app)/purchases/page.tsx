import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { PurchasesClient } from "./purchases-client";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const session = await getSession();
  if (!session?.businessId) return null;

  const [purchases, suppliers, products] = await Promise.all([
    prisma.purchase.findMany({
      where: { businessId: session.businessId },
      include: { supplier: true, items: true },
      orderBy: { purchaseDate: "desc" },
    }),
    prisma.supplier.findMany({ where: { businessId: session.businessId }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { businessId: session.businessId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const totalSpent = purchases.filter((p) => p.status === "RECEIVED").reduce((s, p) => s + p.totalCost, 0);
  const pendingValue = purchases.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.totalCost, 0);

  return (
    <div>
      <PageHeader
        title="Purchases"
        description={`${purchases.filter((p) => p.status === "RECEIVED").length} received · ${formatCurrency(totalSpent)} spent · ${formatCurrency(pendingValue)} pending`}
      />
      <PurchasesClient
        initialPurchases={purchases.map((p) => ({
          id: p.id,
          purchaseNumber: p.purchaseNumber,
          supplier: p.supplier?.name ?? "No supplier",
          itemCount: p.items.reduce((s, i) => s + i.quantity, 0),
          totalCost: p.totalCost,
          status: p.status,
          paymentStatus: p.paymentStatus,
          purchaseDate: p.purchaseDate.toISOString(),
        }))}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        products={products.map((p) => ({ id: p.id, name: p.name, costPrice: p.costPrice }))}
      />
    </div>
  );
}