import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { CustomersClient } from "./customers-client";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await getSession();
  if (!session?.businessId) return null;

  const customers = await prisma.customer.findMany({
    where: { businessId: session.businessId },
    include: {
      orders: {
        where: { status: { not: "CANCELLED" } },
        select: { total: true, status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    orderCount: c.orders.length,
    totalSpent: c.orders.reduce((s, o) => s + o.total, 0),
    lastOrder: c.orders.length ? null : null,
  }));

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${customers.length} customers · ${formatCurrency(rows.reduce((s, r) => s + r.totalSpent, 0))} lifetime value`}
      />
      <CustomersClient initialCustomers={rows} />
    </div>
  );
}