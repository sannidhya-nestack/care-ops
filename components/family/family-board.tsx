"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, BellRing, CheckCircle2, Database, ShieldAlert, Sparkles } from "lucide-react";
import type { CareAlert } from "@/data/alerts";
import type { FamilyContact } from "@/data/familyContacts";
import { FAMILY_DEMO_SCENARIOS } from "@/data/family-demo";
import { readSse } from "@/lib/stream";
import { pushActivity } from "@/lib/activity-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { M3Card } from "@/components/ui/m3-card";
import {
  AIThinking,
  PageTransition,
  Shimmer,
  StreamingText,
} from "@/components/motion/ai-motion";
import { PipelineStepper } from "@/components/ai/live-ui";
import { cn } from "@/lib/utils";

type AlertRow = CareAlert & { customerName: string };

export function FamilyBoard() {
  const params = useSearchParams();
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [alertId, setAlertId] = useState("");
  const [contactId, setContactId] = useState("");
  const [tone, setTone] = useState<"Reassuring" | "Action-needed">("Reassuring");
  const [language, setLanguage] = useState("en");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [variants, setVariants] = useState<
    { tone: "Reassuring" | "Action-needed"; message: string }[]
  >([]);
  const [activeScenario, setActiveScenario] = useState(0);

  useEffect(() => {
    // Deep links: load catalog only — AI output stays blank until user clicks Generate
    if (params.get("alert") || params.get("from")) {
      void loadDemoData({ autoDraft: false, preferAlert: params.get("alert") });
    }
  }, [params]);

  const selectedAlert = alerts.find((a) => a.id === alertId);
  const isRedAlert =
    selectedAlert?.severity === "high" ||
    selectedAlert?.severity === "medium" ||
    selectedAlert?.type === "fall_detected" ||
    selectedAlert?.type === "prolonged_absence" ||
    tone === "Action-needed";

  async function fetchCatalog() {
    const res = await fetch("/api/family-draft");
    const data = await res.json();
    const nextAlerts = (data.alerts ?? []) as AlertRow[];
    const nextContacts = (data.contacts ?? []) as FamilyContact[];
    setAlerts(nextAlerts);
    setContacts(nextContacts);
    return { alerts: nextAlerts, contacts: nextContacts };
  }

  async function draft(opts?: {
    alertId?: string;
    contactId?: string;
    tone?: "Reassuring" | "Action-needed";
    language?: string;
  }) {
    const aId = opts?.alertId ?? alertId;
    const cId = opts?.contactId ?? contactId;
    const t = opts?.tone ?? tone;
    const lang = opts?.language ?? language;
    if (!aId || !cId) return;
    setRunning(true);
    setStep(0);
    setMessage("");
    setSubject("");
    try {
      const res = await fetch("/api/family-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: aId, contactId: cId, tone: t, language: lang }),
      });
      let buf = "";
      await readSse(res, (event, data) => {
        if (event === "step") setStep((data as { index: number }).index);
        if (event === "token") {
          buf += (data as { text: string }).text;
          setMessage(buf);
        }
        if (event === "result") {
          const d = data as {
            subject: string;
            message: string;
            tone_variants: { tone: "Reassuring" | "Action-needed"; message: string }[];
          };
          setSubject(d.subject);
          setMessage(d.message);
          setVariants(d.tone_variants ?? []);
          pushActivity("family", d.subject);
        }
      });
      setStep(3);
    } finally {
      setRunning(false);
    }
  }

  async function loadDemoData(opts?: { autoDraft?: boolean; preferAlert?: string | null }) {
    setLoadingDemo(true);
    try {
      const { alerts: nextAlerts, contacts: nextContacts } = await fetchCatalog();
      const scenario = FAMILY_DEMO_SCENARIOS[0]!;
      const prefer = opts?.preferAlert || scenario.alertId;
      const alert = nextAlerts.find((a) => a.id === prefer) ?? nextAlerts[0];
      const contact =
        nextContacts.find((c) => c.id === scenario.contactId) ?? nextContacts[0];
      if (!alert || !contact) return;
      setAlertId(alert.id);
      setContactId(contact.id);
      setLanguage(contact.preferred_language);
      setTone(scenario.tone);
      setActiveScenario(0);
      setDemoLoaded(true);
      setMessage("");
      setSubject("");
      setVariants([]);
      pushActivity("family", "Loaded family demo alerts");

      if (opts?.autoDraft === true) {
        await draft({
          alertId: alert.id,
          contactId: contact.id,
          tone: scenario.tone,
          language: contact.preferred_language,
        });
      }
    } finally {
      setLoadingDemo(false);
    }
  }

  // Select scenario ONLY (does not auto-generate until user clicks Generate)
  function selectScenario(index: number) {
    const scenario = FAMILY_DEMO_SCENARIOS[index];
    if (!scenario || !demoLoaded || running) return;
    const alert = alerts.find((a) => a.id === scenario.alertId) ?? alerts[0];
    const contact = contacts.find((c) => c.id === scenario.contactId) ?? contacts[0];
    if (!alert || !contact) return;

    setActiveScenario(index);
    setAlertId(alert.id);
    setContactId(contact.id);
    setTone(scenario.tone);
    setLanguage(contact.preferred_language);
    setMessage("");
    setSubject("");
    setVariants([]);
  }

  useEffect(() => {
    if (!variants.length) return;
    const hit = variants.find((v) => v.tone === tone);
    if (hit) setMessage(hit.message);
  }, [tone, variants]);

  return (
    <PageTransition>
      <div className="flex h-full flex-col gap-4 p-5 lg:p-6 bg-[#f8fafc]">
        {/* Page Title & Controls */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                CareOps Patient Outreach
              </span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Patient & Family Connect
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 md:text-sm">
              Review live clinical & sensor alerts, then click <strong className="text-slate-800">Generate with AI</strong> to transform alerts into empathetic family communications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {demoLoaded && (
              <Badge className="bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                Demo feed loaded
              </Badge>
            )}
            <Button
              type="button"
              variant={demoLoaded ? "outline" : "default"}
              disabled={loadingDemo || running}
              onClick={() => void loadDemoData({ autoDraft: false })}
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
                <BellRing className="h-6 w-6" />
              </div>
              <p className="text-base font-bold text-slate-900">No live alert feed loaded</p>
              <p className="mt-1 text-xs text-slate-500">
                Click below to load demo clinical alerts (fall alerts, nocturnal bathroom activity, room dwell). AI messages appear ONLY when you click Generate.
              </p>
              <Button
                type="button"
                className="mt-5 bg-teal-700 hover:bg-teal-800 text-white"
                size="lg"
                disabled={loadingDemo}
                onClick={() => void loadDemoData({ autoDraft: false })}
              >
                <Database className="h-4 w-4 mr-2" />
                Load demo data
              </Button>
            </div>
          </M3Card>
        ) : (
          <>
            {/* Demo Scenarios Grid */}
            <M3Card interactive={false} className="p-4 md:p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Demo Alert Scenarios
                </h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  Select a card below, then click Generate
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Click a scenario to select the alert — AI family message is generated ONLY when you click Generate.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {FAMILY_DEMO_SCENARIOS.map((s, i) => {
                  const alert = alerts.find((a) => a.id === s.alertId);
                  const isActionRequired = s.tone === "Action-needed" || alert?.severity === "high" || alert?.severity === "medium";
                  const isSelected = activeScenario === i;

                  return (
                    <div
                      key={s.alertId + s.contactId}
                      onClick={() => selectScenario(i)}
                      className={cn(
                        "group cursor-pointer rounded-2xl border p-4 transition-all duration-200 relative flex flex-col justify-between",
                        isActionRequired && isSelected
                          ? "border-red-400 bg-red-50/70 ring-2 ring-red-300/80 shadow-md"
                          : isActionRequired
                          ? "border-red-200 bg-white hover:border-red-300 hover:bg-red-50/30"
                          : isSelected
                          ? "border-teal-400 bg-teal-50/70 ring-2 ring-teal-300 shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      )}
                    >
                      <div>
                        {/* Red Urgent Alert Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          {isActionRequired ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                              RED ALERT • URGENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                              ROUTINE PATTERN
                            </span>
                          )}

                          {isSelected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              Selected
                            </span>
                          )}
                        </div>

                        <p className={cn("text-sm font-bold leading-snug", isActionRequired ? "text-red-950" : "text-slate-900")}>
                          {alert?.title ?? s.alertId}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                          {s.blurb}
                        </p>
                      </div>

                      {/* Action Button inside Card */}
                      <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", isActionRequired ? "text-red-700" : "text-teal-800")}>
                          {s.tone}
                        </span>

                        <button
                          type="button"
                          disabled={running}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectScenario(i);
                            void draft({
                              alertId: s.alertId,
                              contactId: s.contactId,
                              tone: s.tone,
                            });
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-xs",
                            isActionRequired
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-teal-700 text-white hover:bg-teal-800"
                          )}
                        >
                          <Sparkles className="h-3 w-3" />
                          Generate
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </M3Card>

            {/* Selection Controls */}
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-700">
                Live Clinical Alert Feed
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={alertId}
                  onChange={(e) => {
                    setAlertId(e.target.value);
                    setMessage("");
                    setSubject("");
                    setVariants([]);
                  }}
                >
                  {alerts.map((a) => {
                    const isRed = a.severity === "high" || a.type === "fall_detected" || a.severity === "medium";
                    return (
                      <option key={a.id} value={a.id}>
                        {isRed ? "🚨 RED ALERT: " : ""}{a.title} · {a.customerName}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="text-xs font-bold text-slate-700">
                Family Contact
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={contactId}
                  onChange={(e) => {
                    const c = contacts.find((x) => x.id === e.target.value);
                    setContactId(e.target.value);
                    if (c) setLanguage(c.preferred_language);
                    setMessage("");
                    setSubject("");
                    setVariants([]);
                  }}
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.relationship}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-bold text-slate-700">
                Target Language
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setMessage("");
                    setSubject("");
                    setVariants([]);
                  }}
                >
                  <option value="en">English (Default)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                </select>
              </label>
            </div>

            {/* Tone Selector & Transform Action Button */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold text-slate-700 mr-1">Tone Variant:</span>
              
              <button
                type="button"
                onClick={() => setTone("Reassuring")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition",
                  tone === "Reassuring"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                Reassuring (Routine)
              </button>

              <button
                type="button"
                onClick={() => setTone("Action-needed")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5",
                  tone === "Action-needed"
                    ? "bg-red-600 text-white shadow-xs border border-red-700"
                    : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Action-needed (Red Alert)
              </button>

              <div className="ml-auto">
                <Button
                  type="button"
                  disabled={running || !alertId}
                  onClick={() => void draft()}
                  className={cn(
                    "px-5 py-2 font-bold text-white shadow-sm transition",
                    isRedAlert ? "bg-red-600 hover:bg-red-700" : "bg-teal-700 hover:bg-teal-800"
                  )}
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  {running ? "Generating Update..." : "Transform with AI"}
                </Button>
              </div>
            </div>

            {/* Side-by-Side Before/After Cards */}
            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
              {/* BEFORE: CLINICAL ALERT DATA */}
              <M3Card interactive={false} className="border border-slate-200/90">
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-base font-bold text-slate-900">
                        Before · Raw Clinical & Sensor Payload
                      </h2>
                      {isRedAlert && (
                        <Badge className="bg-red-100 text-red-700 border border-red-200 font-bold">
                          Red Alert Payload
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      JSON
                    </Badge>
                  </div>

                  <pre className="max-h-[480px] overflow-auto rounded-2xl bg-slate-950 p-4 text-[11px] leading-relaxed text-emerald-300 font-mono border border-slate-800">
                    {JSON.stringify(selectedAlert ?? { status: "pick an alert" }, null, 2)}
                  </pre>
                </div>
              </M3Card>

              {/* AFTER: TRANSFORMED FAMILY MESSAGE */}
              <M3Card interactive={false} className="border border-slate-200/90">
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-slate-900">
                      After · Transformed Family Message
                    </h2>
                    {message && (
                      <Badge className="bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        AI Generated
                      </Badge>
                    )}
                  </div>

                  {running && (
                    <div className="space-y-3">
                      <PipelineStepper
                        steps={[
                          "Reading alert payload",
                          "Removing sensitive detail",
                          "Drafting empathetic family language",
                          "Done",
                        ]}
                        activeIndex={Math.max(0, step)}
                      />
                      {!message && <Shimmer className="h-32" />}
                      {!message && <AIThinking label="Writing empathetic family update…" />}
                    </div>
                  )}

                  {subject && (
                    <div className="rounded-xl bg-slate-100 p-3 border border-slate-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Subject Line</p>
                      <p className="text-sm font-bold text-slate-900">{subject}</p>
                    </div>
                  )}

                  {message ? (
                    <motion.div
                      key={message.slice(0, 24)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-2xl border p-4 leading-relaxed text-xs font-sans",
                        isRedAlert
                          ? "border-red-200 bg-red-50/50 text-slate-800"
                          : "border-teal-100 bg-teal-50/40 text-slate-800"
                      )}
                    >
                      <StreamingText text={message} className="whitespace-pre-wrap" speed={22} />
                    </motion.div>
                  ) : !running ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
                      <Sparkles className="mb-2 h-6 w-6 text-teal-700" />
                      <p className="text-sm font-bold text-slate-800">AI Output Prepared</p>
                      <p className="mt-1 text-xs text-slate-500 max-w-sm">
                        Select a scenario above or pick from the dropdowns, then click <strong className="text-slate-800">&ldquo;Generate with AI&rdquo;</strong> or <strong className="text-slate-800">&ldquo;Transform with AI&rdquo;</strong> to generate the family update.
                      </p>
                    </div>
                  ) : null}

                  {message && (
                    <div className="pt-2">
                      <Button asChild variant="secondary" size="sm" className="text-xs">
                        <Link href={`/guardian?text=${encodeURIComponent(message)}`}>
                          Check before sending (PHI Guardian) <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </M3Card>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
