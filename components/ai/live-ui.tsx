"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LiveDot({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-teal-800">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
      </span>
      {label}
    </span>
  );
}

export function PipelineStepper({
  steps,
  activeIndex,
}: {
  steps: string[];
  activeIndex: number;
}) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={step} className="flex items-center gap-2.5 text-xs">
            <motion.span
              animate={active ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: active ? Infinity : 0, duration: 1 }}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                done && "bg-teal-600 text-white",
                active && "bg-teal-100 text-teal-800 ring-2 ring-teal-400",
                !done && !active && "bg-slate-100 text-slate-400"
              )}
            >
              {done ? "✓" : i + 1}
            </motion.span>
            <span
              className={cn(
                "font-medium",
                active ? "text-teal-900" : done ? "text-slate-700" : "text-slate-400"
              )}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
