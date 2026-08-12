"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Database,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
} from "lucide-react";
import type { Ticket } from "@/data/tickets";
import { getOpenTickets } from "@/data/tickets";
import type { TriageResult } from "@/lib/ai-mock";
import { needsHumanReview, triageKpis, type TicketWithTriage } from "@/lib/triage";
import { CATEGORY_LABEL, teams } from "@/data/teams";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AIThinking,
  ConfidenceBar,
  CountUp,
  PageTransition,
  Shimmer,
  StreamingText,
} from "@/components/motion/ai-motion";

type Tab = "all" | "review" | "ready";

type InboxRow = {
  ticket: Ticket;
  triage: TriageResult | null;
  needsReview: boolean;
  reviewStatus: "pending" | "confirmed" | "overridden";
  overrideTeam?: string;
};

const CHANNEL_ICON = {
  email: Mail,
  app: MessageSquare,
  "phone-note": Phone,
} as const;

function PriorityChip({ priority }: { priority: "high" | "medium" | "low" }) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        priority === "high" && "bg-red-50 text-severity-high ring-1 ring-red-100",
        priority === "medium" && "bg-amber-50 text-severity-medium ring-1 ring-amber-100",
        priority === "low" && "bg-emerald-50 text-severity-low ring-1 ring-emerald-100"
      )}
    >
      {priority}
    </motion.span>
  );
}

function emptyKpis() {
  return {
    openTickets: 0,
    autoResolvedEligible: 0,
    avgConfidence: 0,
    ticketsInReview: 0,
  };
}

export function TriageInbox() {
  const [items, setItems] = useState<InboxRow[]>([]);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrideFor, setOverrideFor] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const triagedItems = useMemo(
    () => items.filter((i): i is TicketWithTriage => i.triage !== null),
    [items]
  );

  const liveKpis = useMemo(() => {
    if (!demoLoaded) return emptyKpis();
    if (!triagedItems.length) {
      return {
        openTickets: items.length,
        autoResolvedEligible: 0,
        avgConfidence: 0,
        ticketsInReview: 0,
      };
    }
    return {
      ...triageKpis(triagedItems),
      openTickets: items.length,
    };
  }, [demoLoaded, items.length, triagedItems]);

  const filtered = useMemo(() => {
    if (tab === "review")
      return items.filter((i) => i.triage && i.needsReview && i.reviewStatus === "pending");
    if (tab === "ready")
      return items.filter((i) => i.triage && (!i.needsReview || i.reviewStatus !== "pending"));
    return items;
  }, [items, tab]);

  const selected =
    items.find((i) => i.ticket.id === selectedId) ?? filtered[0] ?? null;

  function loadDemo() {
    const tickets = getOpenTickets();
    setItems(
      tickets.map((ticket) => ({
        ticket,
        triage: null,
        needsReview: false,
        reviewStatus: "pending",
      }))
    );
    setSelectedId(tickets[0]?.id ?? null);
    setOverrideFor(null);
    setDemoLoaded(true);
    setTab("all");
  }

  async function runTriage(id: string) {
    setGenerating(true);
    setItems((prev) =>
      prev.map((i) => (i.ticket.id === id ? { ...i, triage: null } : i))
    );
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: id }),
      });
      const data = await res.json();
      if (!data?.category) return;
      setItems((prev) =>
        prev.map((i) => {
          if (i.ticket.id !== id) return i;
          const triage: TriageResult = {
            category: data.category,
            priority: data.priority,
            suggested_team: data.suggested_team,
            suggested_team_id: data.suggested_team_id,
            confidence: data.confidence,
            one_line_summary: data.one_line_summary,
            suggested_first_reply: data.suggested_first_reply,
            source: data.source ?? "mock",
          };
          const needsReview = needsHumanReview(i.ticket, triage);
          return {
            ...i,
            triage,
            needsReview,
            reviewStatus: needsReview ? ("pending" as const) : ("confirmed" as const),
          };
        })
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PageTransition>
      <div className="flex h-full flex-col gap-4 p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold text-slate-900">Smart Triage</h1>
          <Button type="button" variant="outline" onClick={loadDemo}>
            <Database className="h-4 w-4" />
            Load demo data
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Open tickets", value: liveKpis.openTickets, accent: true },
            { label: "Auto-resolved eligible", value: liveKpis.autoResolvedEligible },
            { label: "Avg confidence", value: liveKpis.avgConfidence, suffix: "%" },
            { label: "Tickets in review", value: liveKpis.ticketsInReview },
          ].map((k) => (
            <Card
              key={k.label}
              className={cn(
                "px-4 py-3",
                k.accent && "bg-gradient-to-br from-teal-50 to-white ring-1 ring-teal-100"
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {k.label}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-slate-900">
                {demoLoaded ? (
                  <CountUp value={k.value} suffix={k.suffix ?? ""} />
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </p>
            </Card>
          ))}
        </div>

        {!demoLoaded ? (
          <Card className="flex flex-1 items-center justify-center">
            <CardContent className="flex flex-col items-center px-8 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-slate-800">Inbox is empty</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Load demo tickets, pick one, then generate AI triage live.
              </p>
              <Button type="button" className="mt-5" size="lg" onClick={loadDemo}>
                <Database className="h-4 w-4" />
                Load demo data
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All inbox"],
                  ["review", "Needs review"],
                  ["ready", "Ready to route"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    tab === key
                      ? "bg-teal-700 text-white shadow-soft"
                      : "bg-white text-slate-600 ring-1 ring-border hover:bg-slate-50"
                  )}
                >
                  {label}
                  {key === "review" ? (
                    <span className="ml-1.5 tabular-nums opacity-80">
                      {liveKpis.ticketsInReview}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
              {/* LEFT — ticket requirements */}
              <Card className="flex min-h-[420px] flex-col overflow-hidden">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="text-base">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2.5 overflow-y-auto p-3">
                  {filtered.map((item, idx) => {
                    const Icon = CHANNEL_ICON[item.ticket.channel];
                    const selectedRow = item.ticket.id === selected?.ticket.id;
                    const done = !!item.triage;
                    return (
                      <button
                        key={item.ticket.id}
                        type="button"
                        onClick={() => setSelectedId(item.ticket.id)}
                        className={cn(
                          "w-full rounded-2xl border p-3.5 text-left transition-all",
                          selectedRow
                            ? "border-teal-300 bg-teal-50/50 shadow-soft"
                            : "border-border/70 bg-white hover:border-teal-200"
                        )}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx, 8) * 0.03 }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-slate-400" />
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {item.ticket.subject}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.ticket.customerName} · {item.ticket.account}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <p className="text-[11px] tabular-nums text-slate-500">
                                {formatRelativeTime(item.ticket.timestamp)}
                              </p>
                              {done ? (
                                <Badge className="bg-emerald-50 text-emerald-800">Triaged</Badge>
                              ) : (
                                <Badge variant="secondary">Awaiting AI</Badge>
                              )}
                            </div>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                            {item.ticket.rawText}
                          </p>
                        </motion.div>
                      </button>
                    );
                  })}
                  {!filtered.length ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No tickets in this view yet.
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              {/* RIGHT — AI output */}
              <Card className="flex min-h-[420px] flex-col overflow-hidden">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="text-base leading-snug">
                    {selected?.ticket.subject ?? "AI output"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
                  {!selected ? (
                    <p className="text-sm text-muted-foreground">Select a ticket.</p>
                  ) : (
                    <>
                      <div className="rounded-2xl bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-800">
                        {selected.ticket.rawText}
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        size="lg"
                        disabled={generating}
                        onClick={() => void runTriage(selected.ticket.id)}
                      >
                        <Sparkles className="h-4 w-4" />
                        {generating
                          ? "Generating…"
                          : selected.triage
                            ? "Re-run AI triage"
                            : "Generate with AI"}
                      </Button>

                      <AnimatePresence mode="wait">
                        {generating ? (
                          <motion.div
                            key="gen"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                          >
                            <AIThinking label="AI is analyzing ticket…" />
                            <Shimmer className="h-10" />
                            <Shimmer className="h-16" />
                            <Shimmer className="h-24" />
                          </motion.div>
                        ) : null}

                        {!generating && !selected.triage ? (
                          <motion.div
                            key="empty-out"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 text-center"
                          >
                            <Sparkles className="mb-2 h-5 w-5 text-teal-600" />
                            <p className="text-sm font-medium text-slate-700">
                              Output appears here
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Category, priority, confidence, and first reply generate on demand.
                            </p>
                          </motion.div>
                        ) : null}

                        {!generating && selected.triage ? (
                          <motion.div
                            key={selected.ticket.id + selected.triage.one_line_summary}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 }}
                              className="flex flex-wrap gap-1.5"
                            >
                              <Badge>{CATEGORY_LABEL[selected.triage.category]}</Badge>
                              <PriorityChip priority={selected.triage.priority} />
                              <Badge variant="secondary">{selected.triage.suggested_team}</Badge>
                              {selected.needsReview && selected.reviewStatus === "pending" ? (
                                <Badge variant="warn">Needs review</Badge>
                              ) : null}
                              {selected.ticket.sensitive ? (
                                <Badge variant="high">Family distress</Badge>
                              ) : null}
                              <Badge variant="outline">AI · {selected.triage.source}</Badge>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.15 }}
                            >
                              <ConfidenceBar value={selected.triage.confidence} />
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.25 }}
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Summary
                              </p>
                              <StreamingText
                                text={selected.triage.one_line_summary}
                                className="mt-1"
                                speed={16}
                              />
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="rounded-2xl border border-border/70 px-3.5 py-3"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Suggested first reply
                              </p>
                              <div className="mt-2">
                                <StreamingText
                                  text={selected.triage.suggested_first_reply}
                                  className="text-xs"
                                  speed={20}
                                />
                              </div>
                            </motion.div>

                            {selected.needsReview && selected.reviewStatus === "pending" ? (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="rounded-2xl bg-amber-50/80 p-3.5 ring-1 ring-amber-100"
                              >
                                <p className="text-xs font-semibold text-amber-950">
                                  Needs human review
                                </p>
                                <p className="mt-1 text-xs text-amber-900/80">
                                  {selected.ticket.sensitive ||
                                  selected.triage.category === "family_distress"
                                    ? "Family-distress routes to Care/Family Liaison — confirm before send."
                                    : "Confidence below 70%. Confirm or override before routing."}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      setItems((prev) =>
                                        prev.map((i) =>
                                          i.ticket.id === selected.ticket.id
                                            ? { ...i, reviewStatus: "confirmed" }
                                            : i
                                        )
                                      )
                                    }
                                  >
                                    Confirm route
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setOverrideFor((c) =>
                                        c === selected.ticket.id ? null : selected.ticket.id
                                      )
                                    }
                                  >
                                    Override team
                                  </Button>
                                </div>
                                {overrideFor === selected.ticket.id ? (
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {teams.map((t) => (
                                      <Button
                                        key={t.id}
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                          setItems((prev) =>
                                            prev.map((i) =>
                                              i.ticket.id === selected.ticket.id && i.triage
                                                ? {
                                                    ...i,
                                                    reviewStatus: "overridden",
                                                    overrideTeam: t.name,
                                                    triage: {
                                                      ...i.triage,
                                                      suggested_team: t.name,
                                                      suggested_team_id: t.id,
                                                    },
                                                  }
                                                : i
                                            )
                                          );
                                          setOverrideFor(null);
                                        }}
                                      >
                                        {t.name}
                                      </Button>
                                    ))}
                                  </div>
                                ) : null}
                              </motion.div>
                            ) : selected.triage ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.55 }}
                                className="rounded-2xl bg-teal-50/70 px-3.5 py-3 text-xs text-teal-900 ring-1 ring-teal-100"
                              >
                                Ready · {selected.overrideTeam ?? selected.triage.suggested_team}
                              </motion.div>
                            ) : null}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
