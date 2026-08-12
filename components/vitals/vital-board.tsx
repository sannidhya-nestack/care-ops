"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  Cpu,
  Heart,
  Layers,
  MessageCircle,
  Play,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
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
import { VITALS_RESIDENTS_SEED, type VitalResident } from "@/data/vitalsDemo";
import type { ShiftHandoffResult, VitalAssessment, VitalEWSResult } from "@/lib/ai-mock";
import { readSse } from "@/lib/stream";
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

export function VitalIntelligenceBoard() {
  const [residents] = useState<VitalResident[]>(VITALS_RESIDENTS_SEED);
  const [selectedId, setSelectedId] = useState<string>("res-01");
  const [activeTab, setActiveTab] = useState<"vital-fusion" | "ews-signals" | "trends" | "sbar-handoff">("vital-fusion");

  const [ewsResults, setEwsResults] = useState<Record<string, VitalEWSResult>>({});
  const [ewsLoading, setEwsLoading] = useState<Record<string, boolean>>({});

  const [vitalAssessments, setVitalAssessments] = useState<Record<string, VitalAssessment>>({});
  const [vitalAssessLoading, setVitalAssessLoading] = useState<Record<string, boolean>>({});
  const [assessStep, setAssessStep] = useState<Record<string, string>>({});

  const [handoffs, setHandoffs] = useState<Record<string, ShiftHandoffResult>>({});
  const [handoffLoading, setHandoffLoading] = useState<Record<string, boolean>>({});

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const selected = residents.find((r) => r.id === selectedId) || residents[0]!;

  // On initial mount, compute EWS & Vital Assess for initial selected resident
  useEffect(() => {
    residents.forEach((r) => {
      if (!ewsResults[r.id] && !ewsLoading[r.id]) {
        void calculateEWS(r);
      }
    });
    void selectResident(residents[0]!, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function calculateEWS(resData: VitalResident) {
    setEwsLoading((prev) => ({ ...prev, [resData.id]: true }));
    try {
      const res = await fetch("/api/vital-ews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident: {
            id: resData.id,
            name: resData.name,
            currentHR: resData.currentHR,
            baselineHR: resData.baselineHR,
            currentSpO2: resData.currentSpO2,
            baselineSpO2: resData.baselineSpO2,
            immobilityMins: resData.immobilityMins,
            restingHR3DayTrend: resData.restingHR3DayTrend,
          },
          stream: false,
        }),
      });
      const data = (await res.json()) as VitalEWSResult;
      setEwsResults((prev) => ({ ...prev, [resData.id]: data }));
    } catch {
      // fallback handled server side
    } finally {
      setEwsLoading((prev) => ({ ...prev, [resData.id]: false }));
    }
  }

  async function runVitalAssessStream(resData: VitalResident) {
    setVitalAssessLoading((prev) => ({ ...prev, [resData.id]: true }));
    setAssessStep((prev) => ({
      ...prev,
      [resData.id]: "Reading presence sensor immobility & wearable vitals...",
    }));

    try {
      const res = await fetch("/api/vital-assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentName: resData.name,
          immobilityDurationMins: resData.immobilityMins,
          heartRate: resData.currentHR,
          spo2: resData.currentSpO2,
          contextText: resData.activeEvent?.description || "",
          stream: true,
        }),
      });

      await readSse(res, (event, data) => {
        if (event === "step") {
          const d = data as { label: string };
          setAssessStep((prev) => ({ ...prev, [resData.id]: d.label }));
        }
        if (event === "result") {
          const result = data as VitalAssessment;
          setVitalAssessments((prev) => ({ ...prev, [resData.id]: result }));
        }
      });
    } catch {
      // fallback
    } finally {
      setVitalAssessLoading((prev) => ({ ...prev, [resData.id]: false }));
    }
  }

  async function triggerHandoff(resData: VitalResident) {
    setHandoffLoading((prev) => ({ ...prev, [resData.id]: true }));
    const currentEWS = ewsResults[resData.id];
    try {
      const res = await fetch("/api/shift-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident: {
            name: resData.name,
            room: resData.room,
            conditions: resData.conditions,
            currentHR: resData.currentHR,
            baselineHR: resData.baselineHR,
            currentSpO2: resData.currentSpO2,
            immobilityMins: resData.immobilityMins,
            ews_score: currentEWS?.ews_score ?? 6,
            risk_band: currentEWS?.risk_band ?? "high",
          },
          stream: false,
        }),
      });
      const data = (await res.json()) as ShiftHandoffResult;
      setHandoffs((prev) => ({ ...prev, [resData.id]: data }));
    } catch {
      // fallback
    } finally {
      setHandoffLoading((prev) => ({ ...prev, [resData.id]: false }));
    }
  }

  async function selectResident(resData: VitalResident, doScroll = true) {
    setSelectedId(resData.id);
    void calculateEWS(resData);
    void runVitalAssessStream(resData);
    if (doScroll && analysisRef.current) {
      analysisRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Worklist sorting: ranked by risk band (critical > high > med > low) then score
  const rankedResidents = [...residents].sort((a, b) => {
    const ewsA = ewsResults[a.id]?.ews_score ?? (a.currentHR > 100 ? 8 : 2);
    const ewsB = ewsResults[b.id]?.ews_score ?? (b.currentHR > 100 ? 8 : 2);
    return ewsB - ewsA;
  });

  const highRiskCount = rankedResidents.filter((r) => {
    const ews = ewsResults[r.id]?.risk_band;
    return ews === "critical" || ews === "high" || r.currentHR > 100;
  }).length;

  function copyHandoffText(h: ShiftHandoffResult) {
    const text = `CAREOPS AI SHIFT HANDOFF (SBAR)\nResident: ${h.resident_name}\n\n[SITUATION]\n${h.situation}\n\n[BACKGROUND]\n${h.background}\n\n[ASSESSMENT]\n${h.assessment}\n\n[RECOMMENDATION]\n${h.recommendation}`;
    void navigator.clipboard.writeText(text);
    setCopiedId(h.resident_id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const currentAssessment = vitalAssessments[selected.id];
  const isAssessing = vitalAssessLoading[selected.id];
  const currentEWS = ewsResults[selected.id];

  return (
    <PageTransition className="min-h-full bg-slate-100/70 p-3 sm:p-5">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header — Mobile-First Caregiver Surface Style */}
        <header className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-soft">
                <Heart className="h-6 w-6 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-bold text-slate-900">
                    Vital Intelligence & Deterioration EWS
                  </h1>
                  <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800 font-semibold text-[11px]">
                    Live AI Stream
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Decision-support surveillance · Prompts human check (Not a clinical diagnosis)
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800 font-semibold px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping mr-1.5" />
              {highRiskCount} Flagged Acuity Checks
            </Badge>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 border-t border-slate-100 pt-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
              <span className="text-[10px] font-medium text-slate-500">Monitored Residents</span>
              <p className="font-bold text-slate-900 text-lg">
                <CountUp value={residents.length} />
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 p-2.5 border border-rose-100">
              <span className="text-[10px] font-medium text-rose-700">Acuity Risk Checks</span>
              <p className="font-bold text-rose-800 text-lg">
                <CountUp value={highRiskCount} />
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-100">
              <span className="text-[10px] font-medium text-amber-800">Active HR Drifts</span>
              <p className="font-bold text-amber-900 text-lg">
                <CountUp value={2} />
              </p>
            </div>
            <div className="rounded-xl bg-teal-50 p-2.5 border border-teal-100">
              <span className="text-[10px] font-medium text-teal-800">EWS Model Adaptation</span>
              <p className="font-bold text-teal-900 text-base">NEWS2-Adapted</p>
            </div>
          </div>
        </header>

        {/* 1. DETERIORATION EARLY-WARNING SCORE WORKLIST (Acuity Ranked) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-slate-800">
                Deterioration Early-Warning Worklist (Ranked by Acuity)
              </h2>
              <p className="text-xs text-slate-500">
                Click any resident card to launch live SSE streaming AI analysis
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Alarm-Fatigue Protection
            </Badge>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {rankedResidents.map((r) => {
              const ews = ewsResults[r.id];
              const isSelected = selected.id === r.id;
              const isCritical = ews?.risk_band === "critical" || r.currentHR > 110;
              const isHigh = ews?.risk_band === "high" || r.currentHR > 100;
              const isLoading = vitalAssessLoading[r.id];

              return (
                <M3Card key={r.id} className="overflow-hidden">
                  <div
                    onClick={() => void selectResident(r, true)}
                    className={cn(
                      "group cursor-pointer p-4 transition-all relative",
                      isSelected
                        ? "bg-gradient-to-r from-teal-50/90 to-emerald-50/60 ring-2 ring-teal-500 shadow-md"
                        : "bg-white hover:border-slate-300 hover:shadow-sm"
                    )}
                  >
                    {isSelected ? (
                      <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <Sparkles className="h-3 w-3 animate-spin" />
                        ACTIVE ANALYSIS
                      </span>
                    ) : null}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-extrabold text-white text-base shadow-xs transition-transform group-hover:scale-105",
                            isCritical
                              ? "bg-rose-600"
                              : isHigh
                                ? "bg-amber-500"
                                : "bg-teal-600"
                          )}
                        >
                          {ews ? ews.ews_score : r.currentHR > 100 ? 7 : 2}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                              {r.name}
                            </h3>
                            <Badge
                              className={cn(
                                "text-[10px] font-semibold",
                                isCritical
                                  ? "bg-rose-100 text-rose-800"
                                  : isHigh
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-teal-100 text-teal-800"
                              )}
                            >
                              {(ews?.risk_band || (isHigh ? "high" : "low")).toUpperCase()} RISK
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {r.room} · {r.mobilityLevel}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pt-4 sm:pt-0">
                        <span className="font-bold text-slate-900 text-sm">{r.currentHR} bpm</span>
                        <p className="text-[11px] text-slate-500">SpO2: {r.currentSpO2}%</p>
                      </div>
                    </div>

                    {/* Contributing Signals Chips */}
                    {ews?.contributing_signals ? (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                        {ews.contributing_signals.map(
                          (sig: { signal: string; value: string; baseline: string; deviation: string }, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2.5 py-0.5 text-[10px] font-medium text-slate-700"
                            >
                              <Activity className="h-3 w-3 text-slate-500" />
                              {sig.signal}: <strong className="text-slate-900">{sig.value}</strong> ({sig.deviation})
                            </span>
                          )
                        )}
                      </div>
                    ) : null}

                    {/* Interactive Action Prompt Footer */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-teal-700 group-hover:text-teal-900">
                      <span>{isLoading ? "Running AI analysis…" : "Analyze Live AI →"}</span>
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </M3Card>
              );
            })}
          </div>
        </section>

        {/* 2, 3, 4. DYNAMIC LIVE AI ANALYSIS CONSOLE (Scroll target on click) */}
        <div ref={analysisRef} className="pt-2">
          <M3Card
            interactive={false}
            className="p-5 space-y-4 border-teal-300 ring-2 ring-teal-400/30 shadow-lg bg-gradient-to-b from-white to-slate-50/60"
          >
            {/* Console Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                    Live AI Analysis Console
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900">{selected.name}</h2>
                <p className="text-xs text-slate-500">
                  {selected.room} · Account: <span className="font-mono">{selected.account}</span> · Baseline HR: {selected.baselineHR} bpm
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void runVitalAssessStream(selected)}
                  disabled={isAssessing}
                  className="text-xs"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isAssessing && "animate-spin")} />
                  Re-Analyze Live AI
                </Button>
                <Button
                  size="sm"
                  disabled={handoffLoading[selected.id]}
                  onClick={() => void triggerHandoff(selected)}
                  className="text-xs"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Generate SBAR Handoff
                </Button>
              </div>
            </div>

            {/* Interactive Tab Navigation */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-200/80 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("vital-fusion")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "vital-fusion"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <Heart className="h-3.5 w-3.5 fill-current" />
                1. Vital Fusion & Immobility
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ews-signals")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "ews-signals"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                2. EWS Signals (NEWS2)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("trends")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "trends"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                3. 3-Day Trend Surveillance
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sbar-handoff")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "sbar-handoff"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                4. SBAR Shift Handoff
              </button>
            </div>

            {/* TAB CONTENT PANELS */}
            <AnimatePresence mode="wait">
              {/* TAB 1: Vital Fusion & Immobility Analysis (Michael's Flagship) */}
              {activeTab === "vital-fusion" && (
                <motion.div
                  key="tab-vital-fusion"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-4"
                >
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 fill-rose-600 text-rose-600" />
                        <h3 className="font-semibold text-xs text-slate-900">
                          Heart-Rate & Active-IR Bed Presence Immobility Window (24h)
                        </h3>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Immobility: {selected.immobilityMins}m
                      </Badge>
                    </div>

                    <div className="h-44 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selected.timeSeries24h} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                          <YAxis domain={[50, 140]} stroke="#94a3b8" fontSize={10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="hr"
                            name="Heart Rate (bpm)"
                            stroke="#e11d48"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#e11d48" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="spo2"
                            name="SpO2 (%)"
                            stroke="#0284c7"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#0284c7" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* AI Streamed Assessment Card */}
                  <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-rose-600" />
                        <h3 className="font-display text-sm font-semibold text-slate-900">
                          Vital Intelligence Classifier Output
                        </h3>
                      </div>
                      <Badge className="bg-rose-100 text-rose-800 text-[10px] font-semibold">
                        Decision Support Only
                      </Badge>
                    </div>

                    {isAssessing ? (
                      <div className="space-y-2">
                        <AIThinking label={assessStep[selected.id] || "Fusing heart rate with immobility duration..."} />
                        <Shimmer className="h-16" />
                      </div>
                    ) : currentAssessment ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              Classification Output
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge className="bg-rose-600 text-white font-bold text-xs">
                                {currentAssessment.assessment.toUpperCase()}
                              </Badge>
                              <Badge variant="warn" className="text-[10px]">
                                {currentAssessment.urgency.toUpperCase()} URGENCY
                              </Badge>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-700">
                              <StreamingText text={currentAssessment.reasoning} />
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                            <ConfidenceBar value={currentAssessment.confidence} />
                            <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                              <p>Current HR: <strong>{currentAssessment.hr_summary.current} bpm</strong></p>
                              <p>Baseline: <strong>{currentAssessment.hr_summary.baseline} bpm</strong></p>
                              <p>Trend: <strong className="text-rose-700">{currentAssessment.hr_summary.trend.toUpperCase()}</strong></p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl bg-amber-50 p-3 border border-amber-200/80 text-xs">
                          <p className="font-semibold text-amber-950">Recommended Action:</p>
                          <p className="mt-0.5 text-amber-900">{currentAssessment.recommended_action}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: EWS Signal Breakdown (NEWS2 Adapted) */}
              {activeTab === "ews-signals" && (
                <motion.div
                  key="tab-ews-signals"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-3"
                >
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        <h3 className="font-display text-sm font-semibold text-amber-950">
                          Adapted Deterioration Early-Warning Score Breakdown
                        </h3>
                      </div>
                      <Badge className="bg-amber-600 text-white font-bold">
                        EWS Score: {currentEWS?.ews_score ?? 6}
                      </Badge>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {currentEWS?.contributing_signals.map(
                        (sig: { signal: string; value: string; baseline: string; deviation: string }, i: number) => (
                          <div key={i} className="rounded-xl border border-amber-200 bg-white p-3 text-xs shadow-2xs">
                            <p className="font-semibold text-slate-900">{sig.signal}</p>
                            <div className="mt-1 flex items-center justify-between text-slate-600">
                              <span>Value: <strong className="text-slate-900">{sig.value}</strong></span>
                              <span>Baseline: {sig.baseline}</span>
                            </div>
                            <p className="mt-1 text-[11px] font-semibold text-amber-800">
                              Deviation: {sig.deviation}
                            </p>
                          </div>
                        )
                      )}
                    </div>

                    <div className="rounded-xl bg-white p-3 border border-amber-200 text-xs">
                      <p className="font-semibold text-slate-900">Recommended Clinical Check:</p>
                      <p className="mt-0.5 text-slate-700">{currentEWS?.recommended_check}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: 3-Day Trend Surveillance */}
              {activeTab === "trends" && (
                <motion.div
                  key="tab-trends"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-3"
                >
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-display text-sm font-semibold text-indigo-950">
                        Vitals Trend Surveillance & 3-Day Resting HR Drift
                      </h3>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-3 text-xs">
                      <div className="rounded-xl border border-indigo-200 bg-white p-3">
                        <span className="text-[10px] text-slate-500">3-Day Resting HR Drift</span>
                        <p className="mt-1 font-bold text-slate-900 text-base">
                          {selected.restingHR3DayTrend.join(" → ")} bpm
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-indigo-700">
                          Net drift: +{selected.restingHR3DayTrend[2]! - selected.restingHR3DayTrend[0]!} bpm
                        </p>
                      </div>

                      <div className="rounded-xl border border-indigo-200 bg-white p-3">
                        <span className="text-[10px] text-slate-500">Nocturnal SpO2 Range</span>
                        <p className="mt-1 font-bold text-slate-900 text-base">{selected.currentSpO2}%</p>
                        <p className="mt-1 text-[11px] text-slate-500">Baseline {selected.baselineSpO2}%</p>
                      </div>

                      <div className="rounded-xl border border-indigo-200 bg-white p-3">
                        <span className="text-[10px] text-slate-500">Movement / Mobility Score</span>
                        <p className="mt-1 font-bold text-slate-900 text-base">{selected.currentActivity} / 100</p>
                        <p className="mt-1 text-[11px] text-slate-500">Mobility proxy</p>
                      </div>
                    </div>

                    {selected.restingHR3DayTrend[2]! - selected.restingHR3DayTrend[0]! >= 8 ? (
                      <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-950">
                        <strong>⚠️ Resting HR Drift Alert:</strong> Resting HR up ~{selected.restingHR3DayTrend[2]! - selected.restingHR3DayTrend[0]!} bpm over 3 days — consider early infection or decompensation check.
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}

              {/* TAB 4: SBAR Shift Handoff Generator */}
              {activeTab === "sbar-handoff" && (
                <motion.div
                  key="tab-sbar-handoff"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-3"
                >
                  {handoffLoading[selected.id] ? (
                    <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                      <AIThinking label="Generating SBAR Shift Handoff for nursing team..." />
                      <Shimmer className="h-16" />
                    </div>
                  ) : handoffs[selected.id] ? (
                    <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 via-white to-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-teal-700" />
                          <h3 className="font-bold text-xs text-teal-950">
                            SBAR Shift Handoff Report: {handoffs[selected.id].resident_name}
                          </h3>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px]"
                          onClick={() => copyHandoffText(handoffs[selected.id])}
                        >
                          <Copy className="h-3 w-3" />
                          {copiedId === selected.id ? "Copied!" : "Copy SBAR"}
                        </Button>
                      </div>

                      <div className="space-y-2 text-xs text-slate-800">
                        <p>
                          <strong className="text-teal-900">[SITUATION]</strong>{" "}
                          <StreamingText text={handoffs[selected.id].situation} />
                        </p>
                        <p>
                          <strong className="text-teal-900">[BACKGROUND]</strong>{" "}
                          <StreamingText text={handoffs[selected.id].background} />
                        </p>
                        <p>
                          <strong className="text-teal-900">[ASSESSMENT]</strong>{" "}
                          <StreamingText text={handoffs[selected.id].assessment} />
                        </p>
                        <p>
                          <strong className="text-teal-900">[RECOMMENDATION]</strong>{" "}
                          <StreamingText text={handoffs[selected.id].recommendation} />
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                      <p className="text-sm font-medium text-slate-700">No shift handoff generated yet</p>
                      <Button className="mt-3" onClick={() => void triggerHandoff(selected)}>
                        <ClipboardList className="h-4 w-4" />
                        Generate SBAR Shift Handoff Now
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cross-module Quick Links Footer */}
            <div className="flex flex-wrap gap-2 border-t border-slate-200/80 pt-3">
              <Button asChild size="sm" variant="secondary" className="text-xs">
                <Link href="/family?alert=al-05">
                  Draft Family Update →
                </Link>
              </Button>

              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link href="/triage">
                  Log to Triage Review Queue →
                </Link>
              </Button>
            </div>
          </M3Card>
        </div>
      </div>
    </PageTransition>
  );
}
