import nextDynamic from "next/dynamic";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StockStatusBadge } from "@/components/ui/status";

const ProductsClient = nextDynamic(
  () => import("./products-client").then((m) => ({ default: m.ProductsClient })),
  { loading: () => <div className="h-[400px] animate-pulse rounded-xl bg-slate-100" /> }
);

export const dynamic = "force-dynamic";

export const metadata = { title: "Products - Iced Tea House" };

export default async function ProductsPage() {
  const session = await getSession();
  if (!session?.businessId) return null;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: session.businessId },
      include: {
        category: true,
        _count: { select: { orderItems: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ where: { businessId: session.businessId }, orderBy: { name: "asc" } }),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category?.name ?? "—",
    sellingPrice: p.sellingPrice,
    costPrice: p.costPrice,
    currentStock: p.currentStock,
    reorderLevel: p.reorderLevel,
    status: p.status,
    productCount: p._count.orderItems,
  }));

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length} products · ${formatCurrency(products.reduce((s, p) => s + p.currentStock * p.sellingPrice, 0))} retail value`}
      />
      <ProductsClient
        initialProducts={rows}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}