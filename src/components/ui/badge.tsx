import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-amber-50 text-amber-800",
        primary: "border-transparent bg-stone-800 text-white",
        secondary: "border-transparent bg-stone-100 text-stone-700",
        outline: "border-stone-200 text-stone-600",
        success: "border-transparent bg-amber-50 text-amber-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
        danger: "border-transparent bg-rose-50 text-rose-700",
        info: "border-transparent bg-sky-50 text-sky-700",
        violet: "border-transparent bg-violet-50 text-violet-700",
        neutral: "border-transparent bg-stone-100 text-stone-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };