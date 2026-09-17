"use client";

export function Label({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`mb-1 block text-xs font-medium text-slate-600 ${className ?? ""}`}>
      {children}
    </label>
  );
}