"use client";

import { memo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid #e8e0d8",
  boxShadow: "0 10px 30px rgba(44,24,16,0.08)",
  fontSize: "12px",
  background: "white",
  color: "#2c1810",
};

export const SalesTrendChart = memo(function SalesTrendChart({
  data,
  height = 280,
  compact = false,
}: {
  data: { label: string; sales: number; orders: number; profit: number }[];
  height?: number;
  compact?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: compact ? -12 : 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8860b" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#b8860b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5a2b" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#8b5a2b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} dy={8} interval={compact ? "preserveStartEnd" : undefined} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: any, name?: any) => {
          if (name === "orders") return [value, "Orders"];
          return [new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value), name === "sales" ? "Sales" : "Profit"];
        }} />
        <Area type="monotone" dataKey="sales" stroke="#b8860b" strokeWidth={2.5} fill="url(#salesFill)" dot={false} activeDot={{ r: 4 }} />
        <Area type="monotone" dataKey="profit" stroke="#8b5a2b" strokeWidth={2} fill="url(#profitFill)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

const COLORS = ["#b8860b", "#d4a24c", "#8b5a2b", "#c27c4a", "#b85c5c", "#6b8e6b", "#a07050", "#d4c4a0"];

export const DonutChart = memo(function DonutChart({
  data,
  height = 220,
  currency = "PKR",
  showValue = false,
}: {
  data: { name: string; value: number }[];
  height?: number;
  currency?: string;
  showValue?: boolean;
}) {
  const format = (v: number) => showValue
    ? new Intl.NumberFormat("en-PK", { style: "currency", currency, maximumFractionDigits: 0 }).format(v)
    : String(Math.round(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2} strokeWidth={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [format(value), ""]} />
        <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }} />
      </PieChart>
    </ResponsiveContainer>
  );
});

export const BarTrendChart = memo(function BarTrendChart({
  data,
  dataKey = "value",
  color = "#b8860b",
  height = 260,
  label,
}: {
  data: any[];
  dataKey?: string;
  color?: string;
  height?: number;
  label?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} dy={8} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: any, _name?: any) => {
          return [label ? label : `Value: ${new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value)}`, ""];
        }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const SalesByHourChart = memo(function SalesByHourChart({ data }: { data: { label: string; sales: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} dy={8} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="sales" fill="#d4a24c" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const MiniSparkline = memo(function MiniSparkline({ data }: { data: { label: string; sales: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey="sales" stroke="#b8860b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
});