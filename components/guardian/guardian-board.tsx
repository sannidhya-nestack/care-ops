"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  FileCheck,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { GUARDIAN_DEMO_SAMPLES } from "@/data/guardian-demo";
import { pushActivity } from "@/lib/activity-store";
import type { GuardianResult } from "@/lib/guardian-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { M3Card, M3IconBadge } from "@/components/ui/m3-card";
import { AIThinking, CountUp, PageTransition, Shimmer } from "@/components/motion/ai-motion";
import { cn } from "@/lib/utils";

type AuditRow = {
  id: string;
  when: string;
  risk: string;
  flags: number;
  who: string;
  status: string;
};

export function GuardianBoard() {
  const params = useSearchParams();
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [tab, setTab] = useState<"message" | "document">("message");
  const [text, setText] = useState("");
  const [result, setResult] = useState<GuardianResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [skipDebounce, setSkipDebounce] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = params.get("text");
    if (t) {
      setDemoLoaded(true);
      setText(t);
      setActiveSample(null);
    }
  }, [params]);

  useEffect(() => {
    if (text.trim().length < 6) {
      setResult(null);
      return;
    }
    if (skipDebounce) {
      setSkipDebounce(false);
      void scan(text);
      return;
    }
    const handle = setTimeout(() => void scan(text), 450);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    if (!result?.phi_findings.length) return;
    setHighlightIdx(0);
    const t = setInterval(() => {
      setHighlightIdx((i) => (i + 1) % Math.max(result.phi_findings.length, 1));
    }, 900);
    return () => clearInterval(t);
  }, [result]);

  async function scan(value: string) {
    setScanning(true);
    try {
      const res = await fetch("/api/guardian-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const data = (await res.json()) as GuardianResult;
      setResult(data);
      setAudit((prev) =>
        [
          {
            id: `${Date.now()}`,
            when: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            risk: data.hipaa_risk_level,
            flags: data.phi_findings.length,
            who: "Maya Torres (Support Ops)",
            status: data.phi_findings.length > 0 ? "FLAGGED PHI" : "COMPLIANT",
          },
          ...prev,
        ].slice(0, 20)
      );
      pushActivity("guardian", `Scan · ${data.hipaa_risk_level}`, {
        findings: data.phi_findings.length,
      });
    } finally {
      setScanning(false);
    }
  }

  async function loadDemoData() {
    setLoadingDemo(true);
    try {
      setDemoLoaded(true);
      setAudit([]);
      setResult(null);
      setText("");
      setActiveSample(null);
      pushActivity("guardian", "Loaded compliance demo samples");
    } finally {
      setLoadingDemo(false);
    }
  }

  function runSample(id: string) {
    const sample = GUARDIAN_DEMO_SAMPLES.find((s) => s.id === id);
    if (!sample || scanning) return;
    setTab(sample.tab);
    setActiveSample(sample.id);
    if (sample.text === text) {
      void scan(sample.text);
      return;
    }
    setSkipDebounce(true);
    setText(sample.text);
  }

  function handleApplyRedactions() {
    if (!result?.redacted_version) return;
    const sanitized = result.redacted_version;
    setText(sanitized);
    setAudit((prev) => [
      {
        id: `sanitized-${Date.now()}`,
        when: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        risk: "low",
        flags: 0,
        who: "Maya Torres (Support Ops)",
        status: "SANATIZED & PASSED",
      },
      ...prev,
    ]);
    pushActivity("guardian", "Applied 1-Click PHI Redaction");
  }

  const painted = useMemo(() => {
    if (!result?.phi_findings.length) return text;
    const f = result.phi_findings[highlightIdx % result.phi_findings.length];
    if (!f) return text;
    return text.replace(f.span, `⟦${f.span}⟧`);
  }, [text, result, highlightIdx]);

  return (
    <PageTransition>
      <div className="flex h-full flex-col gap-4 p-5 lg:p-6 bg-[#f8fafc]">
        {/* Top Header & Risk Badge */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                CareOps Security & Privacy
              </span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Compliance Guardian (PHI & HIPAA Audit)
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 md:text-sm">
              Real-time PHI detection, MRN/SSN redaction, zero-camera privacy verification, and automated audit logging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {demoLoaded && (
              <Badge className="bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                Demo samples loaded
              </Badge>
            )}

            {result && (
              <motion.div
                key={result.hipaa_risk_level}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {result.hipaa_risk_level === "high" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-xs animate-pulse">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    HIGH HIPAA RISK DETECTED
                  </span>
                ) : result.hipaa_risk_level === "medium" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    MEDIUM RISK WARNING
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    100% HIPAA COMPLIANT
                  </span>
                )}
              </motion.div>
            )}

            <Button
              type="button"
              variant={demoLoaded ? "outline" : "default"}
              disabled={loadingDemo || scanning}
              onClick={() => void loadDemoData()}
            >
              <Database className="h-4 w-4" />
              {loadingDemo ? "Loading demo…" : "Load demo data"}
            </Button>
          </div>
        </div>

        {!demoLoaded ? (
          <M3Card interactive={false} className="flex flex-1 items-center justify-center p-10">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="text-base font-bold text-slate-900">No draft loaded for compliance scan</p>
              <p className="mt-1 text-xs text-slate-500">
                Load demo messages containing MRN, SSN, and clinical details to test live AI compliance scanning and 1-Click PHI Redaction.
              </p>
              <Button
                type="button"
                className="mt-5 bg-teal-700 hover:bg-teal-800 text-white"
                size="lg"
                disabled={loadingDemo}
                onClick={() => void loadDemoData()}
              >
                <Database className="h-4 w-4 mr-2" />
                Load demo data
              </Button>
            </div>
          </M3Card>
        ) : (
          <>
            {/* Demo Draft Cards Grid */}
            <M3Card interactive={false} className="p-4 md:p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Compliance Demo Drafts
                </h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  Click a card to scan for PHI
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Click a card below to load the draft and trigger live AI HIPAA analysis.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {GUARDIAN_DEMO_SAMPLES.map((s) => {
                  const isHighRisk = s.risk === "high";
                  const isSelected = activeSample === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => runSample(s.id)}
                      className={cn(
                        "group cursor-pointer rounded-2xl border p-3.5 transition-all duration-200 flex flex-col justify-between",
                        isHighRisk && isSelected
                          ? "border-red-400 bg-red-50/80 ring-2 ring-red-300 shadow-md"
                          : isHighRisk
                          ? "border-red-200 bg-white hover:border-red-400 hover:bg-red-50/30"
                          : isSelected
                          ? "border-teal-400 bg-teal-50/70 ring-2 ring-teal-300 shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      )}
                    >
                      <div>
                        {/* Red High-Risk Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          {isHighRisk ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                              RED ALERT • HIGH RISK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              CARE-CIRCLE SAFE
                            </span>
                          )}

                          {isSelected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              Selected
                            </span>
                          )}
                        </div>

                        <p className={cn("text-sm font-bold leading-snug", isHighRisk ? "text-red-950" : "text-slate-900")}>
                          {s.label}
                        </p>
                        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                          {s.text}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className={isHighRisk ? "text-red-700" : "text-emerald-700"}>
                          {isHighRisk ? "PHI Scan Needed" : "Clean Template"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-teal-800">
                          <Sparkles className="h-3 w-3" /> Scan AI
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </M3Card>

            {/* Mode Switcher */}
            <div className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200/90 shadow-xs">
              {(
                [
                  ["message", "Family Message Scan"],
                  ["document", "Document Review & Manuals"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-xs font-bold transition",
                    tab === k
                      ? "bg-teal-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Side-by-Side Grid: Draft Under Review vs Findings & Action */}
            <div className="grid flex-1 gap-4 lg:grid-cols-2">
              {/* LEFT CARD: DRAFT TEXT AREA */}
              <M3Card interactive={false} className="border border-slate-200/90">
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <M3IconBadge className="h-8 w-8">
                        <ShieldCheck className="h-4 w-4 text-teal-700" />
                      </M3IconBadge>
                      <h2 className="font-display text-base font-bold text-slate-900">
                        {tab === "message" ? "Draft Message Under Review" : "Document Excerpt"}
                      </h2>
                    </div>
                    {scanning && (
                      <span className="text-xs font-bold text-teal-700 animate-pulse">
                        Scanning PHI...
                      </span>
                    )}
                  </div>

                  <textarea
                    value={text}
                    onChange={(e) => {
                      setActiveSample(null);
                      setText(e.target.value);
                    }}
                    rows={12}
                    placeholder={
                      tab === "message"
                        ? "Draft a family message — PHI highlights and HIPAA risk tags appear automatically as you type…"
                        : "Paste a technical feature document or user guide excerpt to scan for PHI compliance..."
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-800 font-mono leading-relaxed outline-none focus:ring-2 focus:ring-teal-500/30"
                  />

                  <div className="flex items-center justify-between pt-1">
                    {tab === "document" ? (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
                        <Upload className="h-3.5 w-3.5 text-teal-700" /> Upload Text File
                        <input
                          type="file"
                          accept=".txt,.md"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setActiveSample(null);
                            setSkipDebounce(true);
                            setText(await f.text());
                          }}
                        />
                      </label>
                    ) : (
                      <span className="text-[11px] text-slate-400">Live AI scanner active</span>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      disabled={scanning || text.trim().length < 6}
                      onClick={() => void scan(text)}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> Rescan with AI
                    </Button>
                  </div>
                  {scanning && <AIThinking label="Scanning for PHI, MRN, SSN, and clinical details…" />}
                </div>
              </M3Card>

              {/* RIGHT CARD: FINDINGS, REDACTION & AUDIT LOG */}
              <div className="space-y-4">
                {/* Findings Card */}
                <M3Card interactive={false} className="border border-slate-200/90">
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-base font-bold text-slate-900">
                        AI Compliance Findings & PHI Spans
                      </h2>

                      {result && (
                        <span
                          className={cn(
                            "rounded-md px-2.5 py-0.5 text-xs font-bold border",
                            result.hipaa_risk_level === "high"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : result.hipaa_risk_level === "medium"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          )}
                        >
                          Risk: {result.hipaa_risk_level.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {scanning && !result && <Shimmer className="h-28" />}

                    {result ? (
                      <>
                        {/* Live Highlighted Text Preview */}
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 border border-slate-200 font-mono">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Live Active Highlight:
                          </p>
                          <p className="whitespace-pre-wrap">{painted}</p>
                        </div>

                        {/* List of Detected PHI Spans */}
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {result.phi_findings.map((f, i) => (
                            <motion.div
                              key={`${f.span}-${i}`}
                              animate={
                                i === highlightIdx % Math.max(result.phi_findings.length, 1)
                                  ? { backgroundColor: ["#fff7ed", "#ffedd5", "#fff7ed"] }
                                  : {}
                              }
                              transition={{ duration: 0.8 }}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{f.type}</span>
                                <Badge
                                  className="ml-2 font-bold"
                                  variant={f.risk === "high" ? "high" : "warn"}
                                >
                                  {f.risk}
                                </Badge>
                                <p className="mt-0.5 text-red-600 font-semibold font-mono text-[11px]">
                                  &ldquo;{f.span}&rdquo;
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                                Flagged PHI
                              </span>
                            </motion.div>
                          ))}
                        </div>

                        {!result.phi_findings.length && (
                          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            No PHI flags detected. This draft is care-circle safe for distribution.
                          </div>
                        )}

                        <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-700 border border-slate-200">
                          <span className="font-bold text-slate-900">Recommendation: </span>
                          {result.recommendation}
                        </div>

                        {/* 1-CLICK AUTO-REDACT ACTION BUTTON */}
                        {result.phi_findings.length > 0 && (
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                            <Button
                              type="button"
                              size="sm"
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
                              onClick={handleApplyRedactions}
                            >
                              <FileCheck className="mr-1.5 h-4 w-4" /> 1-Click Sanitize PHI (Auto-Redact)
                            </Button>

                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(result.redacted_version);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition"
                            >
                              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              {copied ? "Copied Sanitized!" : "Copy Sanitized Text"}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Select a demo draft card above or type a message to see instant AI PHI findings and 1-Click Redactions.
                      </p>
                    )}
                  </div>
                </M3Card>

                {/* Audit Log Table */}
                <M3Card interactive={false} className="border border-slate-200/90">
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-teal-700" />
                        <h2 className="font-display text-base font-bold text-slate-900">
                          Compliance Audit Trail Log
                        </h2>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        <CountUp value={audit.length} /> Total Scans
                      </Badge>
                    </div>

                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="pb-1.5">Timestamp</th>
                            <th className="pb-1.5">Operator</th>
                            <th className="pb-1.5">Risk Level</th>
                            <th className="pb-1.5">Flags</th>
                            <th className="pb-1.5">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {audit.map((row) => (
                            <motion.tr
                              key={row.id}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border-t border-slate-100 text-slate-700"
                            >
                              <td className="py-2 font-mono text-[11px]">{row.when}</td>
                              <td className="py-2 font-medium">{row.who}</td>
                              <td className="py-2">
                                <span
                                  className={cn(
                                    "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                                    row.risk === "high"
                                      ? "bg-red-100 text-red-800"
                                      : row.risk === "medium"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  )}
                                >
                                  {row.risk}
                                </span>
                              </td>
                              <td className="py-2 font-bold tabular-nums">{row.flags}</td>
                              <td className="py-2">
                                <span
                                  className={cn(
                                    "rounded-md px-2 py-0.5 text-[10px] font-bold",
                                    row.status.includes("SANATIZED")
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                      : row.status.includes("FLAGGED")
                                      ? "bg-red-50 text-red-700 border border-red-200"
                                      : "bg-slate-100 text-slate-700"
                                  )}
                                >
                                  {row.status}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </M3Card>
              </div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
