"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/utils";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <time className="tabular-nums text-sm font-medium text-slate-700" suppressHydrationWarning>
      {now ? formatClock(now) : "—:—:—"}
    </time>
  );
}
