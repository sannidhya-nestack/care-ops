"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  MessageCircleHeart,
  ShieldCheck,
  Wrench,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vitals", label: "Vital Intelligence", icon: Activity },
  { href: "/install", label: "Install Copilot", icon: Wrench },
  { href: "/triage", label: "Smart Triage", icon: Inbox },
  { href: "/copilot", label: "Ops Copilot", icon: LifeBuoy },
  { href: "/family", label: "Patient & Family Connect", icon: MessageCircleHeart },
  { href: "/guardian", label: "Compliance Guardian", icon: ShieldCheck },
] as const;

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border/80 bg-gradient-to-b from-[#f7fafb] to-[#eef4f5]">
      <div className="flex items-center justify-between px-5 pb-4 pt-6">
        <Link href="/" onClick={onClose} className="block hover:opacity-90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-soft">
              <Layers className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="font-display text-xl leading-tight text-slate-900">CareOps AI</p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pt-2">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all",
                active ? "bg-white shadow-soft ring-1 ring-teal-700/10" : "hover:bg-white/70"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  active ? "bg-teal-700 text-white" : "bg-teal-50 text-teal-700"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className={cn("text-sm font-semibold", active ? "text-slate-900" : "text-slate-700")}>
                {item.label}
              </p>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

