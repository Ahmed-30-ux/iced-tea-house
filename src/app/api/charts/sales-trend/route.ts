import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSalesTrend } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const businessId = req.nextUrl.searchParams.get("businessId");
  const range = req.nextUrl.searchParams.get("range") ?? "30d";
  const csv = req.nextUrl.searchParams.get("csv");

  if (!session || !session.businessId || session.businessId !== businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cFrom = req.nextUrl.searchParams.get("from");
  const cTo = req.nextUrl.searchParams.get("to");
  const data = await getSalesTrend(businessId, range, cFrom ?? undefined, cTo ?? undefined);

  if (csv === "1") {
    const rows = ["date,label,sales,orders,profit"];
    for (const d of data) {
      rows.push(`${d.date},${d.label},${d.sales},${d.orders},${d.profit}`);
    }
    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="sales-trend-${range}.csv"`,
      },
    });
  }

  return NextResponse.json({ data });
}