"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Material-3 inspired elevated card — lifts on hover. */
export function M3Card({
  children,
  className,
  interactive = true,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <motion.div
      whileHover={interactive ? { y: -6, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "relative rounded-[28px] border border-slate-200/80 bg-white text-slate-900",
        "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.06)]",
        interactive &&
          "hover:shadow-[0_8px_16px_rgba(15,23,42,0.08),0_20px_40px_rgba(13,148,136,0.12)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function M3IconBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-teal-50 to-slate-100 text-teal-700 shadow-inner",
        className
      )}
    >
      {children}
    </div>
  );
}
