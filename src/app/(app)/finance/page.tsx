import nextDynamic from "next/dynamic";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFinancialMetrics, getRange, getAccountsStatus, getLedger } from "@/lib/analytics";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { TransactionTypeBadge } from "@/components/ui/status";

const FinanceClient = nextDynamic(
  () => import("./finance-client").then((m) => ({ default: m.FinanceClient })),
  { loading: () => <div className="h-[400px] animate-pulse rounded-xl bg-slate-100" /> }
);

export const dynamic = "force-dynamic";

export const metadata = { title: "Finance - Iced Tea House" };

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  if (!session?.businessId) return null;

  const rangeKey = sp.range ?? "month";
  const range = getRange(rangeKey);
  const [metrics, accounts] = await Promise.all([
    getFinancialMetrics(session.businessId, range),
    getAccountsStatus(session.businessId),
  ]);

  const balance = await prisma.financialTransaction.findFirst({
    where: { businessId: session.businessId },
    orderBy: { date: "desc" },
  });

  const cards = [
    { label: "Total Revenue", value: metrics.netSales, color: "text-amber-700", sub: `${metrics.orderCount} orders` },
    { label: "COGS", value: metrics.cogs, color: "text-slate-700", sub: `${formatCurrency(metrics.grossProfit)} gross profit` },
    { label: "Gross Profit", value: metrics.grossProfit, color: "text-violet-600" },
    { label: "Operating Expenses", value: metrics.expenses, color: "text-rose-600" },
    { label: "Net Profit", value: metrics.netProfit, color: metrics.netProfit >= 0 ? "text-amber-700" : "text-rose-600" },
  ];

  return (
    <div>
      <PageHeader title="Finance" description={`Business performance · ${range.from.toLocaleDateString()} — ${range.to.toLocaleDateString()}`}>
        <FinanceRangeSwitch active={rangeKey} />
      </PageHeader>

      <div className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">{c.label}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums tracking-tight ${c.color}`}>{formatCurrency(c.value)}</p>
            {c.sub && <p className="mt-0.5 text-[11px] text-slate-400">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs font-medium text-amber-800">Cash In</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-amber-900">+{formatCurrency(metrics.cashIn)}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <p className="text-xs font-medium text-rose-700">Cash Out</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-rose-800">-{formatCurrency(metrics.cashOut)}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs font-medium text-amber-700">Accounts Receivable</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-amber-800">{formatCurrency(accounts.accountsReceivable)}</p>
          <p className="text-[11px] text-amber-600">{accounts.countReceivable} unpaid orders</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <p className="text-xs font-medium text-sky-700">Accounts Payable</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-sky-800">{formatCurrency(accounts.accountsPayable)}</p>
          <p className="text-[11px] text-sky-600">{accounts.countPayable} unpaid purchases</p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Running Cash / Bank Balance</p>
          <p className="text-2xl font-bold tabular-nums text-slate-900">{formatCurrency(balance?.balance ?? 0)}</p>
        </div>
        <p className="text-xs text-slate-400">Latest balance across all ledger entries</p>
      </div>

      <FinanceClient
        businessId={session.businessId}
        initialBalance={balance?.balance ?? 0}
        initialLedger={(await getLedger(session.businessId)).map((t) => ({ ...t, date: t.date.toISOString() }))}
      />
    </div>
  );
}

function FinanceRangeSwitch({ active }: { active: string }) {
  const ranges = [
    { key: "7d", label: "7 Days" },
    { key: "month", label: "This Month" },
    { key: "3m", label: "3 Months" },
    { key: "year", label: "This Year" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
      {ranges.map((r) => (
        <a
          key={r.key}
          href={`/finance?range=${r.key}`}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${active === r.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          {r.label}
        </a>
      ))}
    </div>
  );
}