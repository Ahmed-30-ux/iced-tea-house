import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ExpensesClient } from "./expenses-client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session?.businessId) return null;

  const [expenses, totals] = await Promise.all([
    prisma.expense.findMany({
      where: { businessId: session.businessId },
      include: { user: true },
      orderBy: { date: "desc" },
    }),
    prisma.expense.aggregate({
      where: { businessId: session.businessId },
      _sum: { amount: true },
    }),
  ]);

  const byCategory = await prisma.expense.groupBy({
    by: ["category"],
    where: { businessId: session.businessId, date: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } },
    _sum: { amount: true },
  });

  return (
    <div>
      <PageHeader
        title="Expenses"
        description={`${expenses.length} expenses · ${formatCurrency(totals._sum.amount ?? 0)} total`}
      />
      <ExpensesClient
        initialExpenses={expenses.map((e) => ({
          id: e.id,
          expenseNumber: e.expenseNumber,
          category: e.category,
          description: e.description,
          amount: e.amount,
          paymentMethod: e.paymentMethod,
          date: e.date.toISOString(),
          notes: e.notes,
          user: e.user?.name ?? "—",
        }))}
        byCategory={byCategory.map((c) => ({ category: c.category, amount: c._sum.amount ?? 0 }))}
      />
    </div>
  );
}