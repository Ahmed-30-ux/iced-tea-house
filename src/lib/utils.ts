import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = "PKR") {
  const v = Number(amount ?? 0);
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: v % 1 === 0 ? 0 : 2,
  }).format(v);
}

export function formatNumber(value: number | null | undefined, digits = 0) {
  const v = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: v % 1 === 0 ? 0 : digits,
  }).format(v);
}

export function formatPercent(value: number | null | undefined) {
  const v = Number(value ?? 0);
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export function formatDate(date: Date | string | null | undefined, fmt = "MMM d, yyyy") {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  try {
    return format(d, fmt);
  } catch {
    return "—";
  }
}

export function formatDateTime(date: Date | string | null | undefined) {
  return formatDate(date, "MMM d, yyyy h:mm a");
}

export function relativeTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function truncate(str: string, len = 60) {
  return str.length > len ? str.slice(0, len - 1) + "…" : str;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function generateNumber(prefix: string) {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${stamp}-${rand}`;
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function startOfMonth(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function addMonths(d: Date, months: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

export function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}