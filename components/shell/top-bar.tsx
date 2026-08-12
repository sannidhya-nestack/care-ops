import { UserRound } from "lucide-react";
import { LiveClock } from "@/components/shell/live-clock";

export const CURRENT_AGENT = {
  name: "Maya Torres",
  role: "Support Ops",
} as const;

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-white/80 px-6 backdrop-blur-md">
      <p className="text-sm font-semibold text-slate-900">CareOps AI</p>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-800">
            <UserRound className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-slate-900">{CURRENT_AGENT.name}</p>
            <p className="text-[11px] text-muted-foreground">{CURRENT_AGENT.role}</p>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-border sm:block" />
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
          </span>
          <LiveClock />
        </div>
      </div>
    </header>
  );
}
