import nextDynamic from "next/dynamic";
import { getSession } from "@/lib/auth";
import { getReportsData, reportRange } from "@/lib/reports";
import { PageHeader } from "@/components/page-header";

const ReportsClient = nextDynamic(
  () => import("./reports-client").then((m) => ({ default: m.ReportsClient })),
  { loading: () => <div className="h-[400px] animate-pulse rounded-xl bg-slate-100" /> }
);

export const dynamic = "force-dynamic";

export const metadata = { title: "Reports - Iced Tea House" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  if (!session?.businessId) return null;

  const rangeKey = sp.range ?? "month";
  const range = reportRange(rangeKey, sp.from, sp.to);
  const data = await getReportsData(session.businessId, range);

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`${new Date(range.from).toLocaleDateString()} — ${new Date(range.to).toLocaleDateString()}`}
      />
      <ReportsClient
        data={
          {
            ...data,
            range: { from: range.from.toISOString(), to: range.to.toISOString() },
          } as any
        }
        activeRange={rangeKey}
      />
    </div>
  );
}