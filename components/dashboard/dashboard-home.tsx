"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  MessageCircleHeart,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { readActivity, type ActivityStats } from "@/lib/activity-store";
import { CountUp, PageTransition } from "@/components/motion/ai-motion";
import { LiveDot } from "@/components/ai/live-ui";
import { M3Card, M3IconBadge } from "@/components/ui/m3-card";

const MODULES = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    blurb: "Live session command center",
  },
  {
    title: "Install Copilot",
    href: "/install",
    icon: Wrench,
    blurb: "Onboard · room vision · placement",
  },
  {
    title: "Smart Triage",
    href: "/triage",
    icon: Inbox,
    blurb: "Connect inbox · classify live",
  },
  {
    title: "Ops Copilot",
    href: "/copilot",
    icon: LifeBuoy,
    blurb: "Grounded answers from knowledge",
  },
  {
    title: "Patient & Family Connect",
    href: "/family",
    icon: MessageCircleHeart,
    blurb: "Alert → humane family update",
  },
  {
    title: "Compliance Guardian",
    href: "/guardian",
    icon: ShieldCheck,
    blurb: "Live PHI scan · audit log",
  },
] as const;

const FLOW = ["Onboard", "Triage", "Resolve", "Communicate", "Protect"] as const;

export function DashboardHome() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const sync = () => setStats(readActivity());
    sync();
    window.addEventListener("careops-activity", sync);
    window.addEventListener("storage", sync);
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      window.removeEventListener("careops-activity", sync);
      window.removeEventListener("storage", sync);
      clearInterval(t);
    };
  }, []);

  const s = stats ?? {
    ticketsTriaged: 0,
    avgConfidence: 0,
    draftsWritten: 0,
    phiRisksCaught: 0,
    events: [],
  };

  return (
    <PageTransition>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              CareOps AI
            </p>
            <h1 className="font-display text-3xl font-semibold text-slate-900">Dashboard</h1>
          </div>
          <LiveDot />
        </div>

        <M3Card
          interactive={false}
          className="overflow-hidden bg-gradient-to-r from-teal-800 to-teal-700 text-white"
        >
          <div className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100">
              Demo flow
            </p>
            <p className="mt-1 font-display text-xl font-semibold sm:text-2xl">
              {FLOW.join(" → ")}
            </p>
          </div>
        </M3Card>

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">All modules</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.href + m.title} href={m.href} className="block">
                  <M3Card className="h-full p-5">
                    <div className="flex items-start gap-3">
                      <M3IconBadge>
                        <Icon className="h-5 w-5" />
                      </M3IconBadge>
                      <div>
                        <p className="font-display text-base font-semibold text-slate-900">
                          {m.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{m.blurb}</p>
                      </div>
                    </div>
                  </M3Card>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Tickets triaged", value: s.ticketsTriaged },
            { label: "Avg confidence", value: s.avgConfidence, suffix: "%" },
            { label: "Drafts written", value: s.draftsWritten },
            { label: "PHI risks caught", value: s.phiRisksCaught },
          ].map((k) => (
            <M3Card key={k.label} className="px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {k.label}
              </p>
              <p className="mt-1 font-display text-3xl font-semibold text-slate-900">
                <CountUp value={k.value} suffix={k.suffix ?? ""} />
              </p>
            </M3Card>
          ))}
        </div>

        <M3Card interactive={false}>
          <div className="p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Recent activity</h2>
            {!s.events.length ? (
              <p className="text-sm text-slate-500">
                Open a module above — session activity shows here.
              </p>
            ) : (
              <ul className="space-y-2">
                {s.events.slice(0, 8).map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{ev.label}</p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">{ev.kind}</p>
                    </div>
                    <p className="shrink-0 text-[11px] tabular-nums text-slate-500">
                      {rel(now, ev.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </M3Card>
      </div>
    </PageTransition>
  );
}

function rel(now: number, at: number) {
  const sec = Math.max(0, Math.round((now - at) / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  return `${Math.round(sec / 3600)}h ago`;
}
