"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Heart,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DEVICE_LABEL, type DeviceType } from "@/data/devices";
import { CATEGORY_LABEL, teams } from "@/data/teams";
import { MESSY_INBOUND, PIPELINE, type TriageStreamResult } from "@/lib/triage-rich";
import { enrichContext, RESIDENTS_SEED, STRUCTURED_EVENTS_FEED } from "@/lib/resident-enrichment";
import type { VitalAssessment } from "@/lib/ai-mock";
import { readSse } from "@/lib/stream";
import { pushActivity } from "@/lib/activity-store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { M3Card } from "@/components/ui/m3-card";
import {
  AIThinking,
  ConfidenceBar,
  CountUp,
  PageTransition,
  Shimmer,
  StreamingText,
} from "@/components/motion/ai-motion";
import { PipelineStepper } from "@/components/ai/live-ui";

export type QueueItem = {
  id: string;
  raw: string;
  channel?: "email" | "app" | "phone-note" | "device-event";
  arrivedAt: number;
  result: TriageStreamResult | null;
  enrichment?: ReturnType<typeof enrichContext>;
  vitalAssessment?: VitalAssessment | null;
  vitalLoading?: boolean;
  reviewStatus: "pending" | "confirmed" | "overridden";
  sendStatus: "idle" | "sending" | "sent";
  sentAt?: number;
};

type ParsedMsg = { from: string; subject: string; body: string };

function parseRaw(raw: string): ParsedMsg {
  const from = raw.match(/^From:\s*(.+)$/im)?.[1]?.trim() ?? "CareOps Platform API";
  const subject = raw.match(/^Subject:\s*(.+)$/im)?.[1]?.trim() ?? "Structured Device Event";
  const body = raw.replace(/^From:.*$/im, "").replace(/^Subject:.*$/im, "").trim();
  return { from, subject, body };
}

function formatSample(msg: (typeof MESSY_INBOUND)[number]) {
  return `From: ${msg.from}\nSubject: ${msg.subject}\n\n${msg.body}`;
}

function asPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(Math.min(100, Math.max(0, n)));
}

const CHANNEL_META = {
  email: { icon: Mail, label: "Email" },
  app: { icon: MessageSquare, label: "App" },
  "phone-note": { icon: Phone, label: "Phone note" },
  "device-event": { icon: Radio, label: "Device event" },
} as const;

function VitalsMiniChart({ hrCurrent }: { hrCurrent: number }) {
  const data = [
    { time: "18:00", hr: 72 },
    { time: "19:00", hr: 74 },
    { time: "20:00", hr: 70 },
    { time: "21:00", hr: Math.max(55, hrCurrent - 12) },
    { time: "21:15", hr: Math.max(58, hrCurrent - 6) },
    { time: "21:30", hr: hrCurrent },
    { time: "21:45", hr: Math.min(135, hrCurrent + 4) },
  ];

  return (
    <div className="h-32 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
          <YAxis domain={[50, 140]} stroke="#94a3b8" fontSize={10} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
          />
          <Line
            type="monotone"
            dataKey="hr"
            stroke="#f43f5e"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#e11d48" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TriageBoard() {
  const [connected, setConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [simulate, setSimulate] = useState(false);
  const [paste, setPaste] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [streamReply, setStreamReply] = useState("");
  const [activeSample, setActiveSample] = useState<number | null>(null);
  const feedIdx = useRef(0);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const selected = queue.find((q) => q.id === selectedId) ?? queue[0] ?? null;

  const kpis = useMemo(() => {
    const done = queue.filter((q) => q.result);
    const review = done.filter(
      (q) =>
        q.result &&
        (q.result.confidence < 70 ||
          q.result.category === "family_distress" ||
          q.result.sentiment === "negative" ||
          q.vitalAssessment?.escalation) &&
        q.reviewStatus === "pending"
    ).length;
    const avg = done.length
      ? Math.round(done.reduce((s, q) => s + (q.result?.confidence ?? 0), 0) / done.length)
      : 0;
    const vitalsRun = queue.filter((q) => q.vitalAssessment).length;
    const eventsProcessed = queue.filter((q) => q.channel === "device-event").length;
    return { open: queue.length, triaged: done.length, avg, review, vitalsRun, eventsProcessed };
  }, [queue]);

  useEffect(() => {
    if (!simulate || !connected) return;
    const t = setInterval(() => {
      const isEvent = feedIdx.current % 2 === 1;
      feedIdx.current += 1;

      if (isEvent) {
        const evt = STRUCTURED_EVENTS_FEED[feedIdx.current % STRUCTURED_EVENTS_FEED.length]!;
        const id = `event-${Date.now()}`;
        const raw = evt.rawText;
        const enrichment = enrichContext(raw);

        setQueue((prev) => [
          {
            id,
            raw,
            channel: "device-event",
            arrivedAt: Date.now(),
            result: null,
            enrichment,
            reviewStatus: "pending",
            sendStatus: "idle",
          },
          ...prev,
        ]);
        setSelectedId(id);
        void runTriage(id, raw, "device-event");
        void runVitalAssessment(id, enrichment, raw);
      } else {
        const msg = MESSY_INBOUND[feedIdx.current % MESSY_INBOUND.length]!;
        const raw = formatSample(msg);
        const id = `live-${Date.now()}`;
        const enrichment = enrichContext(raw);
        setQueue((prev) => [
          {
            id,
            raw,
            channel: msg.channel,
            arrivedAt: Date.now(),
            result: null,
            enrichment,
            reviewStatus: "pending",
            sendStatus: "idle",
          },
          ...prev,
        ]);
        setSelectedId(id);
        void runTriage(id, raw, msg.channel);
      }
    }, 6000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulate, connected]);

  async function runVitalAssessment(id: string, enrichment: ReturnType<typeof enrichContext>, rawText: string) {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, vitalLoading: true } : q))
    );
    try {
      const hrMatch = rawText.match(/hr:\s*(\d+)/i);
      const hrVal = hrMatch ? parseInt(hrMatch[1]!) : 118;
      const res = await fetch("/api/vital-assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentName: enrichment.resident.name,
          immobilityDurationMins: 45,
          heartRate: hrVal,
          spo2: 94,
          contextText: rawText,
          stream: false,
        }),
      });
      const result = (await res.json()) as VitalAssessment;
      setQueue((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          return {
            ...q,
            vitalAssessment: result,
            vitalLoading: false,
            reviewStatus: result.escalation ? "pending" : q.reviewStatus,
          };
        })
      );
    } catch {
      setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, vitalLoading: false } : q)));
    }
  }

  async function runTriage(id: string, raw: string, channel?: string) {
    setRunning(true);
    setStepIndex(0);
    setStreamReply("");
    const enrichment = enrichContext(raw);

    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, result: null, enrichment } : q))
    );

    if (/immobility|presence|no_motion|bed|hr|vital|fall/i.test(raw) || channel === "device-event") {
      void runVitalAssessment(id, enrichment, raw);
    }

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: `${raw}\n[ENRICHED CONTEXT]: ${enrichment.historySummary}`,
          channel,
          stream: true,
        }),
      });
      await readSse(res, (event, data) => {
        if (event === "step") {
          const d = data as { index: number };
          setStepIndex(d.index);
        }
        if (event === "result") {
          const rawResult = data as TriageStreamResult;
          const result: TriageStreamResult = {
            ...rawResult,
            confidence: asPct(rawResult.confidence),
            urgency_score: asPct(rawResult.urgency_score),
          };
          const needs =
            result.confidence < 70 ||
            result.category === "family_distress" ||
            result.sentiment === "negative";
          setQueue((prev) =>
            prev.map((q) =>
              q.id === id
                ? {
                    ...q,
                    result,
                    reviewStatus: needs ? "pending" : "confirmed",
                    sendStatus: "idle",
                  }
                : q
            )
          );
          setStreamReply(result.suggested_reply);
          pushActivity("triage", result.one_line_summary, { confidence: result.confidence });
        }
      });
      setStepIndex(PIPELINE.length);
    } finally {
      setRunning(false);
    }
  }

  function loadSample(index: number) {
    const msg = MESSY_INBOUND[index];
    if (!msg) return;
    const raw = formatSample(msg);
    setActiveSample(index);
    setPaste(raw);
    pasteRef.current?.focus();
    pasteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function classifySample(index: number) {
    const msg = MESSY_INBOUND[index];
    if (!msg || running) return;
    const raw = formatSample(msg);
    setActiveSample(index);
    setPaste(raw);
    const id = `sample-${Date.now()}`;
    const enrichment = enrichContext(raw);
    setQueue((prev) => [
      {
        id,
        raw,
        channel: msg.channel,
        arrivedAt: Date.now(),
        result: null,
        enrichment,
        reviewStatus: "pending",
        sendStatus: "idle",
      },
      ...prev,
    ]);
    setSelectedId(id);
    void runTriage(id, raw, msg.channel);
  }

  function ingestPaste() {
    if (!paste.trim() || running) return;
    const id = `paste-${Date.now()}`;
    const enrichment = enrichContext(paste);
    setQueue((prev) => [
      {
        id,
        raw: paste,
        channel: "email",
        arrivedAt: Date.now(),
        result: null,
        enrichment,
        reviewStatus: "pending",
        sendStatus: "idle",
      },
      ...prev,
    ]);
    setSelectedId(id);
    void runTriage(id, paste, "email");
  }

  async function sendWithAgent(id: string) {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, sendStatus: "sending" } : q))
    );
    await new Promise((r) => setTimeout(r, 1200));
    setQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              sendStatus: "sent",
              sentAt: Date.now(),
              reviewStatus: "confirmed",
            }
          : q
      )
    );
    pushActivity("triage", "AI agent sent drafted reply to customer", { ticketId: id });
  }

  return (
    <PageTransition className="min-h-full bg-slate-100/70 p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                CareOps AI · Smart Triage & Vital Intelligence
              </h1>
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800 font-medium">
                Live Pipeline
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Multi-channel ticket triage + Platform Event & Vital Context Fusion (Fall-detection & connected care)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={connected ? "outline" : "default"}
              size="sm"
              onClick={() => (connected ? setConnected(false) : setShowConnect(true))}
            >
              <Link2 className="h-3.5 w-3.5" />
              {connected ? "Connected · CareOps Platform API" : "Connect platform events"}
            </Button>
            {connected ? (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
                <input
                  type="checkbox"
                  checked={simulate}
                  onChange={(e) => setSimulate(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                Simulate event feed
              </label>
            ) : null}
          </div>
        </header>

        {/* KPIs including Vital Assessments & Platform Events */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <M3Card interactive={false} className="p-4">
            <p className="text-xs font-medium text-slate-500">Queue items</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              <CountUp value={kpis.open} />
            </p>
            <p className="text-[10px] text-slate-400">Total in session</p>
          </M3Card>

          <M3Card interactive={false} className="p-4">
            <p className="text-xs font-medium text-slate-500">Triaged with AI</p>
            <p className="mt-1 text-2xl font-bold text-teal-700">
              <CountUp value={kpis.triaged} />
            </p>
            <p className="text-[10px] text-slate-400">Processed through pipeline</p>
          </M3Card>

          <M3Card interactive={false} className="p-4">
            <p className="text-xs font-medium text-slate-500">Events Ingested</p>
            <p className="mt-1 text-2xl font-bold text-indigo-700">
              <CountUp value={kpis.eventsProcessed} />
            </p>
            <p className="text-[10px] text-slate-400">Platform device events</p>
          </M3Card>

          <M3Card interactive={false} className="p-4">
            <p className="text-xs font-medium text-slate-500">Vital Assessments</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">
              <CountUp value={kpis.vitalsRun} />
            </p>
            <p className="text-[10px] text-slate-400">HR/Immobility classifier</p>
          </M3Card>

          <M3Card interactive={false} className="p-4">
            <p className="text-xs font-medium text-slate-500">Avg confidence</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{kpis.avg}%</p>
            <p className="text-[10px] text-slate-400">Extraction accuracy</p>
          </M3Card>

          <M3Card interactive={false} className="p-4">
            <p className="text-xs font-medium text-slate-500">Human review</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              <CountUp value={kpis.review} />
            </p>
            <p className="text-[10px] text-slate-400">Requires confirmation</p>
          </M3Card>
        </div>

        {/* Sample Inbound Messages & Platform Events */}
        <M3Card interactive={false}>
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold">
                  Sample Inbound Messages & Platform Events
                </h2>
                <p className="text-xs text-slate-500">
                  Click a card to load into input · Use “Classify now” to execute AI pipeline
                </p>
              </div>
              <Badge variant="outline">Email · App · Phone · Device Event</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {MESSY_INBOUND.map((msg, i) => {
                const meta = CHANNEL_META[msg.channel];
                const Icon = meta.icon;
                const selectedSample = activeSample === i;
                return (
                  <div
                    key={`${msg.from}-${msg.subject}`}
                    className={cn(
                      "rounded-2xl border p-3.5 transition flex flex-col justify-between",
                      selectedSample
                        ? "border-teal-400 bg-teal-50/70 ring-2 ring-teal-200"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => loadSample(i)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{msg.subject}</p>
                      <p className="mt-0.5 text-xs text-slate-500">From {msg.from}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-700 line-clamp-3">{msg.body}</p>
                    </button>
                    <div className="mt-3 flex gap-2 pt-2 border-t border-slate-100">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[11px]"
                        onClick={() => loadSample(i)}
                      >
                        Load input
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 text-[11px]"
                        disabled={running}
                        onClick={() => classifySample(i)}
                      >
                        <Sparkles className="h-3 w-3" />
                        Classify
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </M3Card>

        {/* Main Work Area: Input & Queue + AI Extraction & Vital Assessment */}
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          {/* Left Column: Input and Queue List */}
          <div className="space-y-4">
            <M3Card interactive={false}>
              <div className="space-y-3 p-5">
                <div>
                  <h2 className="font-display text-lg font-semibold">Paste or stream ticket / event</h2>
                  <p className="text-xs text-slate-500">
                    Loaded from sample above, or paste raw email / app note / platform device JSON
                  </p>
                </div>
                <textarea
                  ref={pasteRef}
                  value={paste}
                  onChange={(e) => {
                    setPaste(e.target.value);
                    setActiveSample(null);
                  }}
                  rows={6}
                  placeholder="Click a sample card above — or paste raw inbound text / event data here…"
                  className="w-full rounded-[16px] border border-slate-200 px-3 py-2.5 font-mono text-sm leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                <Button type="button" disabled={!paste.trim() || running} onClick={ingestPaste}>
                  <Sparkles className="h-4 w-4" />
                  Classify & Enrich with AI
                </Button>
              </div>
            </M3Card>

            <M3Card interactive={false} className="overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold flex items-center justify-between">
                <span>Inbound Queue {queue.length ? `(${queue.length})` : ""}</span>
                <span className="text-xs font-normal text-slate-500">Click item for side-by-side fusion</span>
              </div>
              <div className="max-h-[460px] space-y-2 overflow-y-auto p-3">
                {!queue.length ? (
                  <p className="px-2 py-6 text-center text-sm text-slate-500">
                    No messages in queue. Click “Classify” on a sample above to start.
                  </p>
                ) : (
                  <AnimatePresence initial={false}>
                    {queue.map((item) => {
                      const parsed = parseRaw(item.raw);
                      const isSel = selected?.id === item.id;
                      const ChannelIcon = CHANNEL_META[item.channel || "email"]?.icon || Mail;

                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelectedId(item.id)}
                          className={cn(
                            "w-full rounded-2xl border p-3.5 text-left transition",
                            isSel
                              ? "border-teal-400 bg-teal-50/60 ring-1 ring-teal-300"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                                <ChannelIcon className="h-3 w-3" />
                              </span>
                              <p className="truncate text-sm font-semibold text-slate-900">{parsed.subject}</p>
                            </div>
                            <Badge
                              variant={
                                item.sendStatus === "sent"
                                  ? "secondary"
                                  : item.result
                                    ? "secondary"
                                    : "outline"
                              }
                              className={cn(
                                "shrink-0 text-[10px]",
                                item.sendStatus === "sent" && "bg-emerald-50 text-emerald-800"
                              )}
                            >
                              {item.sendStatus === "sent"
                                ? "Sent"
                                : item.sendStatus === "sending"
                                  ? "Sending…"
                                  : item.result
                                    ? "Triaged"
                                    : "Awaiting"}
                            </Badge>
                          </div>

                          <p className="mt-1 text-xs font-medium text-slate-500">
                            From {parsed.from}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700 line-clamp-2">
                            {parsed.body}
                          </p>

                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100/80 pt-2 text-[10px] text-slate-400">
                            <span>{new Date(item.arrivedAt).toLocaleTimeString()}</span>
                            {item.vitalAssessment ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                                {item.vitalAssessment.assessment.toUpperCase()}
                              </span>
                            ) : null}
                            {item.result ? (
                              <span>{asPct(item.result.confidence)}% confidence</span>
                            ) : null}
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </M3Card>
          </div>

          {/* Right Column: Message + Device Fusion & Vital Classifier */}
          <M3Card interactive={false}>
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-display text-lg font-semibold">Message + Device Fusion</h2>
                <Badge variant="outline" className="text-teal-800 bg-teal-50 border-teal-200">
                  CareOps Connected Care
                </Badge>
              </div>

              {!selected ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">Select a queue item</p>
                  <p className="mt-1 text-xs text-slate-500">
                    See side-by-side human message vs sensor device status & vital classifier
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Side-by-Side Fusion Panel: Human Message vs Sensor Status */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Left: What human/device reported */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                        <MessageSquare className="h-4 w-4 text-slate-600" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Inbound Ticket Payload
                        </span>
                      </div>
                      {(() => {
                        const p = parseRaw(selected.raw);
                        return (
                          <div className="mt-2 space-y-1 text-xs">
                            <p className="font-semibold text-slate-900">{p.subject}</p>
                            <p className="text-slate-500">Sender: {p.from}</p>
                            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-700">
                              {p.body}
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Right: What sensors & resident context show */}
                    <div className="rounded-2xl border border-teal-200/80 bg-teal-50/40 p-3.5">
                      <div className="flex items-center gap-2 border-b border-teal-200/60 pb-2">
                        <Cpu className="h-4 w-4 text-teal-700" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-teal-900">
                          Enriched Device & Resident
                        </span>
                      </div>
                      {selected.enrichment ? (
                        <div className="mt-2 space-y-1.5 text-xs text-slate-800">
                          <p className="font-semibold text-slate-900">
                            {selected.enrichment.resident.name}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Account: <span className="font-mono">{selected.enrichment.resident.account}</span> · {selected.enrichment.resident.room}
                          </p>
                          <div className="mt-2 rounded-xl bg-white p-2 border border-teal-100 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-slate-700">
                                {DEVICE_LABEL[selected.enrichment.device.type]}
                              </span>
                              <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                                {selected.enrichment.device.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              S/N: {selected.enrichment.device.serial} · Last comm: {selected.enrichment.device.lastCommAgo}
                            </p>
                          </div>
                          <p className="mt-2 text-[11px] leading-relaxed text-slate-600 italic">
                            "{selected.enrichment.resident.recentEvents[0]}"
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-slate-500">Assembling enrichment context…</div>
                      )}
                    </div>
                  </div>

                  {/* Vital Intelligence Classifier Card (Michael's Flagship Feature) */}
                  <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/30 p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 fill-rose-600 text-rose-600" />
                        <h3 className="font-display text-sm font-semibold text-slate-900">
                          Vital Intelligence Classifier (HR + Immobility Fusion)
                        </h3>
                      </div>
                      <Badge className="bg-rose-100 text-rose-800 text-[10px] font-semibold">
                        Decision Support
                      </Badge>
                    </div>

                    {selected.vitalLoading ? (
                      <div className="mt-3 space-y-2">
                        <AIThinking label="Fusing presence sensor immobility with resident heart-rate time-series…" />
                        <Shimmer className="h-16" />
                      </div>
                    ) : selected.vitalAssessment ? (
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              Assessment Classification
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge className="bg-rose-600 text-white font-bold text-xs">
                                {selected.vitalAssessment.assessment.toUpperCase()}
                              </Badge>
                              <Badge
                                variant={
                                  selected.vitalAssessment.urgency === "critical" ? "warn" : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {selected.vitalAssessment.urgency.toUpperCase()} URGENCY
                              </Badge>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-700">
                              <StreamingText text={selected.vitalAssessment.reasoning} />
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                            <p className="text-[11px] font-semibold text-slate-700">
                              Wearable Heart Rate (24h Window)
                            </p>
                            <VitalsMiniChart hrCurrent={selected.vitalAssessment.hr_summary.current} />
                            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                              <span>Baseline: {selected.vitalAssessment.hr_summary.baseline} bpm</span>
                              <span>Current: {selected.vitalAssessment.hr_summary.current} bpm</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200/80 text-xs">
                          <p className="font-semibold text-amber-950">Recommended Action:</p>
                          <p className="mt-0.5 text-amber-900">{selected.vitalAssessment.recommended_action}</p>
                        </div>

                        <p className="text-[10px] text-slate-400 italic">
                          * Decision-support indicator prompts human welfare check — NOT a medical diagnosis.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        No active immobility or heart-rate anomaly detected on this ticket.
                      </p>
                    )}
                  </div>

                  {/* Existing Stepper & Reply Draft Section */}
                  {running ? (
                    <div className="space-y-3">
                      <PipelineStepper steps={[...PIPELINE]} activeIndex={Math.max(0, stepIndex)} />
                      <AIThinking label="Extracting entities & drafting context-aware reply…" />
                      <Shimmer className="h-16" />
                    </div>
                  ) : null}

                  {selected.result && !running ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 pt-2 border-t border-slate-100"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        <Badge>{CATEGORY_LABEL[selected.result.category]}</Badge>
                        <Badge variant="secondary">{selected.result.priority}</Badge>
                        <Badge
                          variant={
                            selected.result.sentiment === "negative" ? "warn" : "secondary"
                          }
                        >
                          {selected.result.sentiment}
                        </Badge>
                        {selected.result.device_mentioned ? (
                          <Badge className="bg-teal-50 text-teal-800">
                            {DEVICE_LABEL[selected.result.device_mentioned]}
                          </Badge>
                        ) : null}
                        {selected.reviewStatus === "pending" ? (
                          <Badge variant="warn">Needs Human Review</Badge>
                        ) : null}
                      </div>

                      <ConfidenceBar value={selected.result.confidence} />

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Urgency Score
                        </p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            className="h-full rounded-full bg-amber-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${selected.result.urgency_score}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-slate-800">{selected.result.one_line_summary}</p>
                      <p className="text-xs text-slate-500">
                        Customer/home: {selected.result.home_or_customer ?? "—"} · Team:{" "}
                        {selected.result.routed_team}
                      </p>

                      <div className="rounded-2xl border border-slate-200 px-3.5 py-3">
                        <p className="text-[11px] font-semibold uppercase text-slate-500">
                          Context-Fused Suggested Reply
                        </p>
                        <StreamingText text={streamReply || selected.result.suggested_reply} />

                        {selected.sendStatus === "sending" ? (
                          <div className="mt-3">
                            <AIThinking label="AI agent sending reply on inbound channel…" />
                          </div>
                        ) : null}

                        {selected.sendStatus === "sent" ? (
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-100">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                              <p className="font-semibold">Reply sent by AI agent</p>
                              <p className="text-xs text-emerald-800/80">
                                Routed to {selected.result.routed_team} · customer notified on{" "}
                                {selected.channel ?? "email"} channel
                                {selected.sentAt
                                  ? ` · ${new Date(selected.sentAt).toLocaleTimeString()}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              disabled={selected.sendStatus === "sending"}
                              onClick={() => void sendWithAgent(selected.id)}
                            >
                              <Send className="h-4 w-4" />
                              Send with AI agent
                            </Button>
                            <p className="w-full text-[11px] text-slate-500">
                              Agent confirms triage, delivers the drafted reply, and closes the loop.
                            </p>
                          </div>
                        )}
                      </div>

                      {selected.reviewStatus === "pending" ? (
                        <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
                          <p className="text-xs font-semibold text-amber-950">Human Review & Override</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                setQueue((prev) =>
                                  prev.map((q) =>
                                    q.id === selected.id
                                      ? { ...q, reviewStatus: "confirmed" }
                                      : q
                                  )
                                )
                              }
                            >
                              Confirm Triage
                            </Button>
                            {teams.map((t) => (
                              <Button
                                key={t.id}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setQueue((prev) =>
                                    prev.map((q) =>
                                      q.id === selected.id && q.result
                                        ? {
                                            ...q,
                                            reviewStatus: "overridden",
                                            result: {
                                              ...q.result,
                                              routed_team: t.name,
                                              routed_team_id: t.id,
                                            },
                                          }
                                        : q
                                    )
                                  )
                                }
                              >
                                {t.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <Link
                            href={`/copilot?q=${encodeURIComponent(selected.result.one_line_summary)}`}
                          >
                            Ask Ops Copilot
                          </Link>
                        </Button>
                        {selected.result.category === "family_distress" ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href="/family?alert=al-05">Draft family update</Link>
                          </Button>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              )}
            </div>
          </M3Card>
        </div>

        {/* Inbox / Platform Connect Modal */}
        {showConnect ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <M3Card interactive={false} className="w-full max-w-md p-6">
              <h3 className="font-display text-xl font-semibold">Connect platform event feed</h3>
              <p className="mt-1 text-sm text-slate-500">
                Connects CareOps AI to your device event bus API (Gateway, Motion, Bed/Chair presence, Wearable vitals).
              </p>
              <div className="mt-4 space-y-2">
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  defaultValue="https://api.careops-platform.local/v1/events"
                />
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  type="password"
                  defaultValue="••••••••"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowConnect(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setConnected(true);
                    setSimulate(true);
                    setShowConnect(false);
                  }}
                >
                  Connect & Start Stream
                </Button>
              </div>
            </M3Card>
          </div>
        ) : null}
      </div>
    </PageTransition>
  );
}
