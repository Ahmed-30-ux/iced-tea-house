"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export function MovementTrendChart({
  data,
}: {
  data: { label: string; in: number; out: number; balance: number }[];
}) {
  const chartData = data.map((d) => ({
    label: d.label,
    in: d.in,
    out: -d.out,
  }));

  if (!chartData.length) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
        No stock movements recorded yet
      </div>
    );
  }

  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} dy={8} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(value: any, name: any) => [String(value), name]}
          />
          <Bar dataKey="in" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={26} name="In" />
          <Bar dataKey="out" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={26} name="Out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}