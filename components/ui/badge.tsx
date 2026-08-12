import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-teal-100 text-teal-800",
        secondary: "border-transparent bg-slate-100 text-slate-700",
        outline: "border-border text-foreground",
        high: "border-transparent bg-red-50 text-severity-high",
        medium: "border-transparent bg-amber-50 text-severity-medium",
        low: "border-transparent bg-emerald-50 text-severity-low",
        warn: "border-transparent bg-amber-50 text-amber-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
