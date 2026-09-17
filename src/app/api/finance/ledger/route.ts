import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLedger } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!session || !session.businessId || session.businessId !== businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? undefined;
  const method = req.nextUrl.searchParams.get("method") ?? undefined;
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const ledger = await getLedger(businessId, { type: type || undefined, method: method || undefined });

  const filtered = ledger.filter((t) => {
    const d = new Date(t.date);
    if (from && d < new Date(from + "T00:00:00")) return false;
    if (to && d > new Date(to + "T23:59:59")) return false;
    return true;
  });

  const rows = ["date,type,category,description,reference,money_in,money_out,balance"];
  for (const t of filtered) {
    rows.push(
      `${t.date.toISOString()},${t.type},${t.category ?? ""},"${(t.description ?? "").replaceAll('"', '""')}",${t.referenceType ?? ""},${t.moneyIn},${t.moneyOut},${t.balance}`
    );
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="transaction-ledger.csv"',
    },
  });
}