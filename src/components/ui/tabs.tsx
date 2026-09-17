"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tabListVariants = cva(
  "inline-flex items-center gap-1 rounded-lg bg-stone-100 p-1 text-stone-600",
  {
    variants: {
      variant: {
        default: "",
        underline: "bg-transparent gap-0 p-0",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export const TabsContext = React.createContext<{ value: string; setValue: (v: string) => void }>({
  value: "",
  setValue: () => {},
});

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "underline";
  className?: string;
}) {
  return <div className={cn(tabListVariants({ variant }), variant === "underline" && "border-b border-slate-200", className)}>{children}</div>;
}

export function TabsTrigger({
  value,
  children,
  variant,
  className,
}: {
  value: string;
  children: React.ReactNode;
  variant?: "default" | "underline";
  className?: string;
}) {
  const { value: current, setValue } = React.useContext(TabsContext);
  const active = current === value;

  if (variant === "underline") {
    return (
      <button
        onClick={() => setValue(value)}
        className={cn(
          "relative px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-800",
          active && "text-stone-900",
          className
        )}
      >
        {children}
        <span
          className={cn(
            "absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-amber-700 transition-all",
            active ? "opacity-100" : "opacity-0"
          )}
        />
      </button>
    );
  }

  return (
    <button
      onClick={() => setValue(value)}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: current } = React.useContext(TabsContext);
  if (current !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}