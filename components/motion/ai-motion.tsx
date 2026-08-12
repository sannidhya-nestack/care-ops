"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AIThinking({
  label = "AI is analyzing…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-slate-50 px-4 py-3",
        className
      )}
    >
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-teal-500 to-teal-700"
            animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-teal-900">{label}</p>
    </div>
  );
}

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-2xl bg-[linear-gradient(90deg,#f1f5f9_0%,#e2e8f0_40%,#f1f5f9_80%)] bg-[length:200%_100%]",
        className
      )}
    />
  );
}

export function StreamingText({
  text,
  className,
  speed = 12,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  return (
    <motion.p
      className={cn("whitespace-pre-wrap text-sm leading-relaxed text-slate-800", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {text.split("").map((ch, i) => (
        <motion.span
          key={`${i}-${ch}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: Math.min(i, 80) / speed }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.p>
  );
}

export function CountUp({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {value}
        {suffix}
      </motion.span>
    </motion.span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = value > 0 && value <= 1 ? Math.round(value * 100) : Math.round(value);
  const tone =
    pct >= 70 ? "bg-teal-600" : pct >= 50 ? "bg-amber-500" : "bg-severity-high";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Confidence
        </p>
        <p
          className={cn(
            "font-display text-xl font-semibold tabular-nums",
            pct >= 70 ? "text-teal-800" : "text-amber-800"
          )}
        >
          {pct}%
        </p>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={cn("h-full rounded-full", tone)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("min-h-0 w-full", className)}
    >
      {children}
    </motion.div>
  );
}
