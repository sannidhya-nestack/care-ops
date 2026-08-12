"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Database,
  Flame,
  Heart,
  Home,
  ImagePlus,
  MapPin,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wifi,
} from "lucide-react";
import { DEVICE_LABEL } from "@/data/devices";
import {
  DEFAULT_LOGGED_INCIDENTS,
  SAMPLE_HOME,
  computeCoverageGaps,
  emptyIntake,
  type AggregatedInstallPlan,
  type IncidentCausalAnalysis,
  type InstallIntake,
  type LoggedIncident,
  type RiskZoneAggregation,
  type RoomVisionResult,
} from "@/lib/install-types";
import { readSse } from "@/lib/stream";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { M3Card, M3IconBadge } from "@/components/ui/m3-card";
import {
  AIThinking,
  CountUp,
  PageTransition,
  Shimmer,
  StreamingText,
} from "@/components/motion/ai-motion";
import { RoomVisionOverlay } from "@/components/install/room-vision-overlay";
import { PlacementBlueprint } from "@/components/install/placement-blueprint";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 0, title: "Resident & Mobility", icon: UserRound },
  { id: 1, title: "Home & Connectivity", icon: Wifi },
  { id: 2, title: "Rooms", icon: Home },
  { id: 3, title: "Consent & Scope", icon: ShieldCheck },
] as const;

type VisionMap = Record<string, RoomVisionResult | null>;

export function InstallBoard() {
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<InstallIntake>(emptyIntake);
  const [visions, setVisions] = useState<VisionMap>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [plan, setPlan] = useState<AggregatedInstallPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [blueprintReady, setBlueprintReady] = useState(false);
  const [blueprintSource, setBlueprintSource] = useState<"live" | "mock">("mock");
  const [blueprintLoading, setBlueprintLoading] = useState(false);
  const [chatQ, setChatQ] = useState("");
  const [chatA, setChatA] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [recipientDraft, setRecipientDraft] = useState("");

  // Incident & Risk Zone State
  const [incidents, setIncidents] = useState<LoggedIncident[]>(DEFAULT_LOGGED_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<LoggedIncident | null>(null);
  const [causalMap, setCausalMap] = useState<Record<string, IncidentCausalAnalysis>>({});
  const [causalLoading, setCausalLoading] = useState(false);
  const [causalStep, setCausalStep] = useState<string | null>(null);

  const [riskZones, setRiskZones] = useState<RiskZoneAggregation | null>(null);
  const [riskZonesLoading, setRiskZonesLoading] = useState(false);
  const [riskZonesStep, setRiskZonesStep] = useState<string | null>(null);

  // Quick incident add form
  const [newIncRoom, setNewIncRoom] = useState("Living room");
  const [newIncType, setNewIncType] = useState("Unsteady Slip");
  const [newIncNote, setNewIncNote] = useState("");
  const [newIncHr, setNewIncHr] = useState("98");

  const fetchRiskZones = useCallback(
    async (customIncidents?: LoggedIncident[]) => {
      const incList = customIncidents || incidents;
      setRiskZonesLoading(true);
      setRiskZonesStep("Clustering incidents & identifying risk zones…");
      try {
        const res = await fetch("/api/risk-zones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            incidents: incList,
            intakeContext: JSON.stringify(intake),
            stream: true,
          }),
        });

        await readSse(res, (event, data) => {
          if (event === "step") {
            const d = data as { label: string };
            setRiskZonesStep(d.label);
          } else if (event === "result") {
            setRiskZones(data as RiskZoneAggregation);
          }
        });
      } catch (err) {
        console.error("Risk zones aggregation error:", err);
      } finally {
        setRiskZonesLoading(false);
        setRiskZonesStep(null);
      }
    },
    [incidents, intake]
  );

  useEffect(() => {
    // Initial fetch of risk zones aggregation
    void fetchRiskZones(DEFAULT_LOGGED_INCIDENTS);
  }, [fetchRiskZones]);

  async function analyzeCausal(inc: LoggedIncident) {
    setSelectedIncident(inc);
    setCausalLoading(true);
    setCausalStep("Initiating AI Causal Analysis…");
    try {
      const res = await fetch("/api/incident-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident: inc,
          roomName: inc.room,
          intakeContext: JSON.stringify(intake),
          stream: true,
        }),
      });

      await readSse(res, (event, data) => {
        if (event === "step") {
          const d = data as { label: string };
          setCausalStep(d.label);
        } else if (event === "result") {
          const result = data as IncidentCausalAnalysis;
          setCausalMap((prev) => ({ ...prev, [inc.id]: result }));
        }
      });
    } catch (err) {
      console.error("Causal analysis error:", err);
    } finally {
      setCausalLoading(false);
      setCausalStep(null);
    }
  }

  function handleAddIncident(coords: { x: number; y: number }, roomName: string) {
    const newInc: LoggedIncident = {
      id: `inc-${Date.now()}`,
      room: roomName,
      coords,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      type: newIncType || "Logged Slip",
      note: newIncNote || `Incident pin logged at (${coords.x}, ${coords.y}) in ${roomName}`,
      vitalHeartRate: parseInt(newIncHr) || 98,
    };
    const updated = [...incidents, newInc];
    setIncidents(updated);
    setSelectedIncident(newInc);
    void analyzeCausal(newInc);
    void fetchRiskZones(updated);
  }


  function patch(p: Partial<InstallIntake>) {
    setIntake((prev) => ({ ...prev, ...p }));
    setPlan(null);
    setBlueprintReady(false);
  }

  function loadSampleHome() {
    setIntake((prev) => ({
      ...prev,
      age: 82,
      livesAlone: true,
      mobilityAid: "walker",
      fallHistory: true,
      fallNotes: "Two assisted falls in past year near bathroom.",
      cognitiveStatus: "mild",
      nighttimeBathroom: "3×",
      sleepWindow: "9:30pm – 6:00am",
      pets: true,
      petType: "Cat",
      dwellingType: "single-story",
      floors: 1,
      approxSqft: 1600,
      wifiQuality: "spotty",
      gatewayLocation: "Living room media shelf",
      construction: "plaster",
      rooms: SAMPLE_HOME.map((r) => ({ ...r })),
      monitoringConsent: true,
      alertRecipients: ["Daughter — Maya", "Care coordinator"],
      cameraPreference: "no-camera",
      dataSharingScope: "Care circle only",
    }));
    setVisions({});
    setPlan(null);
    setBlueprintReady(false);
    setStep(2);
  }

  async function analyzeRoom(roomId: string) {
    const room = intake.rooms.find((r) => r.id === roomId);
    if (!room?.imageSrc) return;
    setAnalyzingId(roomId);
    setVisions((v) => ({ ...v, [roomId]: null }));
    try {
      let imageDataUrl: string | null = room.imageSrc;
      if (room.imageSrc.startsWith("data:")) {
        imageDataUrl = room.imageSrc;
      } else {
        imageDataUrl = room.imageSrc;
      }
      const res = await fetch("/api/install-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: room.name,
          sampleKey: room.sampleKey,
          imageDataUrl,
          intake,
        }),
      });
      const data = (await res.json()) as RoomVisionResult;
      setVisions((v) => ({ ...v, [roomId]: data }));
    } finally {
      setAnalyzingId(null);
    }
  }

  async function analyzeAllRooms() {
    for (const room of intake.rooms) {
      if (room.imageSrc) await analyzeRoom(room.id);
    }
  }

  async function synthesizePlan() {
    const packed = intake.rooms
      .filter((r) => visions[r.id])
      .map((r) => ({ room: r.name, result: visions[r.id]! }));
    if (!packed.length) return;
    setPlanLoading(true);
    setPlan(null);
    try {
      const res = await fetch("/api/install-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "aggregate", intake, visions: packed }),
      });
      setPlan(await res.json());
    } finally {
      setPlanLoading(false);
    }
  }

  async function generateBlueprint() {
    if (!plan) return;
    setBlueprintLoading(true);
    setBlueprintReady(false);
    try {
      // Optional HF flourish — interactive floor plan is the primary deliverable.
      const prompt = plan.placement_plan
        .map((p) => `${p.room}: ${DEVICE_LABEL[p.type]} @ ${p.placement}`)
        .join("\n");
      const res = await fetch("/api/install-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setBlueprintSource(data.source === "live" ? "live" : "mock");
      await new Promise((r) => setTimeout(r, 600));
      setBlueprintReady(true);
    } finally {
      setBlueprintLoading(false);
    }
  }

  async function askChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatQ.trim()) return;
    setChatLoading(true);
    setChatA(null);
    try {
      const res = await fetch("/api/install-troubleshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: chatQ,
          context: `Gateway at ${intake.gatewayLocation}; construction ${intake.construction}; wifi ${intake.wifiQuality}`,
        }),
      });
      const data = await res.json();
      setChatA(data.answer ?? "");
    } finally {
      setChatLoading(false);
    }
  }

  function onUpload(roomId: string, file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      patch({
        rooms: intake.rooms.map((r) =>
          r.id === roomId
            ? { ...r, imageSrc: String(reader.result), sampleKey: undefined }
            : r
        ),
      });
      setVisions((v) => ({ ...v, [roomId]: null }));
    };
    reader.readAsDataURL(file);
  }

  const analyzedCount = useMemo(
    () => Object.values(visions).filter(Boolean).length,
    [visions]
  );

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold text-slate-900">Install Copilot</h1>
          <Button type="button" variant="outline" onClick={loadSampleHome}>
            <Database className="h-4 w-4" />
            Connect photo feed
          </Button>
        </div>

        {/* Step chips */}
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition",
                  active
                    ? "bg-teal-700 text-white shadow-soft"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.title}
              </button>
            );
          })}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT — intake */}
          <div className="min-w-0 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 ? (
                  <M3Card>
                    <div className="space-y-4 p-5">
                      <div className="flex items-center gap-3">
                        <M3IconBadge>
                          <UserRound className="h-5 w-5" />
                        </M3IconBadge>
                        <h2 className="font-display text-lg font-semibold">Resident & Mobility</h2>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Age">
                          <input
                            type="number"
                            value={intake.age}
                            onChange={(e) => patch({ age: Number(e.target.value) })}
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Lives alone">
                          <Toggle
                            value={intake.livesAlone}
                            onChange={(v) => patch({ livesAlone: v })}
                          />
                        </Field>
                        <Field label="Mobility aid">
                          <select
                            value={intake.mobilityAid}
                            onChange={(e) =>
                              patch({ mobilityAid: e.target.value as InstallIntake["mobilityAid"] })
                            }
                            className={fieldClass}
                          >
                            <option value="none">None</option>
                            <option value="cane">Cane</option>
                            <option value="walker">Walker</option>
                            <option value="wheelchair">Wheelchair</option>
                          </select>
                        </Field>
                        <Field label="Fall history">
                          <Toggle
                            value={intake.fallHistory}
                            onChange={(v) => patch({ fallHistory: v })}
                          />
                        </Field>
                        <Field label="Fall notes" className="sm:col-span-2">
                          <textarea
                            value={intake.fallNotes}
                            onChange={(e) => patch({ fallNotes: e.target.value })}
                            rows={2}
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Cognitive status">
                          <select
                            value={intake.cognitiveStatus}
                            onChange={(e) =>
                              patch({
                                cognitiveStatus: e.target
                                  .value as InstallIntake["cognitiveStatus"],
                              })
                            }
                            className={fieldClass}
                          >
                            <option value="none">None</option>
                            <option value="mild">Mild</option>
                            <option value="dementia">Dementia</option>
                          </select>
                        </Field>
                        <Field label="Nighttime bathroom">
                          <input
                            value={intake.nighttimeBathroom}
                            onChange={(e) => patch({ nighttimeBathroom: e.target.value })}
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Sleep window">
                          <input
                            value={intake.sleepWindow}
                            onChange={(e) => patch({ sleepWindow: e.target.value })}
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Pets">
                          <div className="flex items-center gap-2">
                            <Toggle value={intake.pets} onChange={(v) => patch({ pets: v })} />
                            {intake.pets ? (
                              <input
                                value={intake.petType}
                                onChange={(e) => patch({ petType: e.target.value })}
                                placeholder="Type"
                                className={fieldClass}
                              />
                            ) : null}
                          </div>
                        </Field>
                      </div>
                    </div>
                  </M3Card>
                ) : null}

                {step === 1 ? (
                  <M3Card>
                    <div className="space-y-4 p-5">
                      <div className="flex items-center gap-3">
                        <M3IconBadge>
                          <Wifi className="h-5 w-5" />
                        </M3IconBadge>
                        <h2 className="font-display text-lg font-semibold">Home & Connectivity</h2>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Dwelling type">
                          <select
                            value={intake.dwellingType}
                            onChange={(e) =>
                              patch({
                                dwellingType: e.target.value as InstallIntake["dwellingType"],
                              })
                            }
                            className={fieldClass}
                          >
                            <option value="apartment">Apartment</option>
                            <option value="single-story">Single-story</option>
                            <option value="multi-story">Multi-story</option>
                          </select>
                        </Field>
                        <Field label="Floors">
                          <input
                            type="number"
                            value={intake.floors}
                            onChange={(e) => patch({ floors: Number(e.target.value) })}
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Approx sqft">
                          <input
                            type="number"
                            value={intake.approxSqft}
                            onChange={(e) => patch({ approxSqft: Number(e.target.value) })}
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Wi-Fi quality">
                          <select
                            value={intake.wifiQuality}
                            onChange={(e) =>
                              patch({ wifiQuality: e.target.value as InstallIntake["wifiQuality"] })
                            }
                            className={fieldClass}
                          >
                            <option value="good">Good</option>
                            <option value="spotty">Spotty</option>
                            <option value="none">None</option>
                          </select>
                        </Field>
                        <Field label="Gateway location" className="sm:col-span-2">
                          <input
                            value={intake.gatewayLocation}
                            onChange={(e) => patch({ gatewayLocation: e.target.value })}
                            placeholder="e.g. Living room media shelf"
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Construction (RF)">
                          <select
                            value={intake.construction}
                            onChange={(e) =>
                              patch({
                                construction: e.target.value as InstallIntake["construction"],
                              })
                            }
                            className={fieldClass}
                          >
                            <option value="drywall">Drywall</option>
                            <option value="plaster">Plaster</option>
                            <option value="concrete">Concrete</option>
                          </select>
                        </Field>
                      </div>
                    </div>
                  </M3Card>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-4">
                    <M3Card interactive={false}>
                      <div className="space-y-4 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <M3IconBadge>
                              <ImagePlus className="h-5 w-5" />
                            </M3IconBadge>
                            <h2 className="font-display text-lg font-semibold">Rooms + photos</h2>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={loadSampleHome}>
                              Connect photo feed
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={!intake.rooms.some((r) => r.imageSrc) || !!analyzingId}
                              onClick={() => void analyzeAllRooms()}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Analyze all rooms
                            </Button>
                          </div>
                        </div>

                        {!intake.rooms.length ? (
                          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                            <p className="text-sm font-medium text-slate-700">No rooms yet</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Connect photo feed or add a room with a photo slot.
                            </p>
                            <Button type="button" className="mt-4" onClick={loadSampleHome}>
                              <Database className="h-4 w-4" />
                              Connect photo feed
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {intake.rooms.map((room) => (
                              <M3Card key={room.id} className="overflow-hidden">
                                <div className="space-y-3 p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <input
                                      value={room.name}
                                      onChange={(e) =>
                                        patch({
                                          rooms: intake.rooms.map((r) =>
                                            r.id === room.id ? { ...r, name: e.target.value } : r
                                          ),
                                        })
                                      }
                                      className={cn(fieldClass, "max-w-xs font-semibold")}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                                        <ImagePlus className="h-3.5 w-3.5" />
                                        Upload
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) =>
                                            onUpload(room.id, e.target.files?.[0] ?? null)
                                          }
                                        />
                                      </label>
                                      <Button
                                        type="button"
                                        size="sm"
                                        disabled={!room.imageSrc || analyzingId === room.id}
                                        onClick={() => void analyzeRoom(room.id)}
                                      >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Analyze room
                                      </Button>
                                    </div>
                                  </div>
                                  {room.imageSrc ? (
                                    <RoomVisionOverlay
                                      imageSrc={room.imageSrc}
                                      roomName={room.name}
                                      analyzing={analyzingId === room.id}
                                      result={visions[room.id] ?? null}
                                      incidents={incidents}
                                      onSelectIncident={(inc) => void analyzeCausal(inc)}
                                      onAddIncident={(coords) => handleAddIncident(coords, room.name)}
                                    />
                                  ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-500">
                                      Add a photo or connect photo feed
                                    </div>
                                  )}
                                </div>
                              </M3Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </M3Card>

                    {/* Incident Intake & Causal Analysis Section */}
                    <M3Card interactive={false}>
                      <div className="space-y-4 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <M3IconBadge>
                              <AlertCircle className="h-5 w-5 text-rose-600" />
                            </M3IconBadge>
                            <div>
                              <h2 className="font-display text-lg font-semibold">
                                Incident Intake & Causal Analysis
                              </h2>
                              <p className="text-xs text-slate-500">
                                Log incident locations (or drop pins on photos) · CareOps fall-detection insight
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-rose-700 border-rose-200 bg-rose-50">
                            Imported from platform ({incidents.length})
                          </Badge>
                        </div>

                        {/* Logged incidents grid */}
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {incidents.map((inc) => {
                            const isSelected = selectedIncident?.id === inc.id;
                            const analysis = causalMap[inc.id];
                            return (
                              <div
                                key={inc.id}
                                onClick={() => void analyzeCausal(inc)}
                                className={cn(
                                  "cursor-pointer rounded-2xl border p-3 transition-all",
                                  isSelected
                                    ? "border-rose-400 bg-rose-50/60 shadow-sm ring-1 ring-rose-400/30"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="font-semibold text-xs text-slate-900">
                                      {inc.type}
                                    </span>
                                    <p className="text-[11px] text-slate-500">
                                      {inc.room} · {inc.date}
                                    </p>
                                  </div>
                                  <Badge className="bg-rose-100 text-rose-800 text-[10px]">
                                    {analysis?.severity ? `${analysis.severity.toUpperCase()} RISK` : "LOGGED"}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-xs text-slate-700 leading-relaxed">{inc.note}</p>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                  {inc.vitalHeartRate ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 px-2 py-0.5 font-medium text-rose-900">
                                      <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                                      {inc.vitalHeartRate} bpm (Wearable)
                                    </span>
                                  ) : <span />}
                                  <span className="font-semibold text-rose-700 hover:underline">
                                    {analysis ? "View Causal Analysis →" : "Analyze Causes →"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Selected Incident Causal Analysis View */}
                        <AnimatePresence>
                          {selectedIncident ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="rounded-[22px] border border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 p-4 ring-1 ring-rose-200 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-rose-600" />
                                  <h3 className="font-display text-sm font-semibold text-slate-900">
                                    Advisory Causal Analysis: {selectedIncident.type}
                                  </h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedIncident(null)}
                                  className="text-xs text-slate-400 hover:text-slate-700"
                                >
                                  Close ✕
                                </button>
                              </div>

                              {causalLoading ? (
                                <div className="mt-3 space-y-2">
                                  <AIThinking label={causalStep || "Evaluating likely environmental factors…"} />
                                  <Shimmer className="h-16" />
                                </div>
                              ) : null}

                              {causalMap[selectedIncident.id] && !causalLoading ? (
                                <div className="mt-3 space-y-3">
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    {causalMap[selectedIncident.id].likely_causes.map((cause, i) => (
                                      <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="font-semibold text-slate-900">{cause.factor}</span>
                                          <Badge className="bg-teal-50 text-teal-800 text-[10px] font-semibold">
                                            {cause.confidence}% conf
                                          </Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-600">
                                          <StreamingText text={cause.explanation} />
                                        </p>
                                      </div>
                                    ))}
                                  </div>

                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                      Contributing Environment:
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                      {causalMap[selectedIncident.id].contributing_environment.map((env, i) => (
                                        <Badge key={i} variant="warn">
                                          {env}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="rounded-xl bg-teal-50/80 p-3 ring-1 ring-teal-200">
                                    <p className="text-xs font-semibold text-teal-950">Recommended Environmental Adjustments:</p>
                                    <ul className="mt-1.5 space-y-1">
                                      {causalMap[selectedIncident.id].recommended_environmental_adjustments.map((adj, i) => (
                                        <li key={i} className="text-xs text-teal-900">
                                          • {adj}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <p className="text-[10px] text-slate-400 italic">
                                    * CareOps AI fall-detection insight only. Environmental hazard recommendations are advisory.
                                  </p>
                                </div>
                              ) : null}
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </M3Card>
                  </div>
                ) : null}

                {step === 3 ? (
                  <M3Card>
                    <div className="space-y-4 p-5">
                      <div className="flex items-center gap-3">
                        <M3IconBadge>
                          <ShieldCheck className="h-5 w-5" />
                        </M3IconBadge>
                        <h2 className="font-display text-lg font-semibold">Consent & Scope</h2>
                      </div>
                      <Field label="Monitoring consent">
                        <Toggle
                          value={intake.monitoringConsent}
                          onChange={(v) => patch({ monitoringConsent: v })}
                        />
                      </Field>
                      <Field label="Alert recipients">
                        <div className="flex flex-wrap gap-2">
                          {intake.alertRecipients.map((r) => (
                            <Badge key={r} variant="secondary">
                              {r}
                              <button
                                type="button"
                                className="ml-1 text-slate-400"
                                onClick={() =>
                                  patch({
                                    alertRecipients: intake.alertRecipients.filter((x) => x !== r),
                                  })
                                }
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <form
                          className="mt-2 flex gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!recipientDraft.trim()) return;
                            patch({
                              alertRecipients: [...intake.alertRecipients, recipientDraft.trim()],
                            });
                            setRecipientDraft("");
                          }}
                        >
                          <input
                            value={recipientDraft}
                            onChange={(e) => setRecipientDraft(e.target.value)}
                            className={fieldClass}
                            placeholder="Add recipient"
                          />
                          <Button type="submit" size="sm" variant="secondary">
                            Add
                          </Button>
                        </form>
                      </Field>
                      <Field label="Camera preference">
                        <select
                          value={intake.cameraPreference}
                          onChange={(e) =>
                            patch({
                              cameraPreference: e.target
                                .value as InstallIntake["cameraPreference"],
                            })
                          }
                          className={fieldClass}
                        >
                          <option value="no-camera">No camera (default)</option>
                          <option value="optional">Optional</option>
                        </select>
                      </Field>
                      <Field label="Data sharing scope">
                        <input
                          value={intake.dataSharingScope}
                          onChange={(e) => patch({ dataSharingScope: e.target.value })}
                          className={fieldClass}
                        />
                      </Field>
                    </div>
                  </M3Card>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={step === 3}
                onClick={() => setStep((s) => Math.min(3, s + 1))}
              >
                Next
              </Button>
            </div>
          </div>

          {/* RIGHT — synthesized output */}
          <div className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:self-start">
            <M3Card interactive={false}>
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">AI output</h2>
                  <Button
                    type="button"
                    disabled={analyzedCount === 0 || planLoading}
                    onClick={() => void synthesizePlan()}
                  >
                    <Sparkles className="h-4 w-4" />
                    {planLoading ? "Synthesizing…" : "Synthesize placement plan"}
                  </Button>
                </div>

                {planLoading ? (
                  <div className="space-y-3">
                    <AIThinking label="Building home-wide placement plan…" />
                    <Shimmer className="h-20" />
                    <Shimmer className="h-32" />
                  </div>
                ) : null}

                {!planLoading && !plan ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-14 text-center">
                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-teal-600" />
                    <p className="text-sm font-medium text-slate-700">Output appears here</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Analyze room photos, then synthesize the plan + fall-hazard report.
                    </p>
                  </div>
                ) : null}

                {plan && !planLoading ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    <div className="overflow-x-auto rounded-[20px] ring-1 ring-slate-200">
                      <table className="w-full min-w-[480px] text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Room</th>
                            <th className="px-3 py-2 font-semibold">Device</th>
                            <th className="px-3 py-2 font-semibold">Placement</th>
                            <th className="px-3 py-2 font-semibold">Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.placement_plan.map((row, i) => (
                            <motion.tr
                              key={`${row.room}-${row.type}-${i}`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="border-t border-slate-100"
                            >
                              <td className="px-3 py-2.5 font-medium text-slate-800">{row.room}</td>
                              <td className="px-3 py-2.5">{DEVICE_LABEL[row.type]}</td>
                              <td className="px-3 py-2.5 text-slate-600">{row.placement}</td>
                              <td className="px-3 py-2.5">
                                {row.within_range ? (
                                  <Badge className="bg-emerald-50 text-emerald-800">
                                    <CheckCircle2 className="mr-1 h-3 w-3" /> In range
                                  </Badge>
                                ) : (
                                  <Badge variant="warn">
                                    <AlertTriangle className="mr-1 h-3 w-3" /> Check
                                  </Badge>
                                )}
                                <p className="mt-1 text-[10px] text-slate-500">{row.reasoning}</p>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* COVERAGE GAPS / WHAT YOU'RE MISSING SECTION */}
                    <div className="rounded-[24px] bg-slate-900 p-5 text-white shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-5 w-5 text-amber-400" />
                          <h3 className="font-display text-base font-semibold">Coverage Gaps · What You&apos;re Missing</h3>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40 text-[10px]">
                          AI Gap Analysis
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Identifies unmonitored transit corridors, gateway distance limits, or uncovered repeat incident zones.
                      </p>

                      <div className="mt-4 space-y-2.5">
                        {computeCoverageGaps(plan.placement_plan, riskZones?.zones || [], intake.rooms).map((gap) => (
                          <motion.div
                            key={gap.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl bg-slate-800/90 p-3.5 ring-1 ring-slate-700/60"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-white">{gap.title}</p>
                              <Badge
                                className={cn(
                                  gap.severity === "high" && "bg-rose-500/20 text-rose-300 ring-rose-400/30",
                                  gap.severity === "med" && "bg-amber-500/20 text-amber-300 ring-amber-400/30",
                                  gap.severity === "low" && "bg-sky-500/20 text-sky-300 ring-sky-400/30"
                                )}
                              >
                                {gap.severity.toUpperCase()} RISK
                              </Badge>
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">💡 {gap.recommendation}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* RISK-ZONE & ROUTE PATTERN AGGREGATION PANEL */}
                    <div className="rounded-[24px] border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-amber-600" />
                          <h3 className="font-display text-base font-semibold text-slate-900">
                            Risk Zones & Unsafe Routes
                          </h3>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={riskZonesLoading}
                          onClick={() => void fetchRiskZones()}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                          {riskZonesLoading ? "Aggregating…" : "Refresh"}
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Clusters incidents by proximity & flags high-frequency transit routes (Insight only — CareOps fall detection).
                      </p>

                      {riskZonesLoading ? (
                        <div className="mt-4 space-y-2">
                          <AIThinking label={riskZonesStep || "Aggregating risk zones…"} />
                          <Shimmer className="h-16" />
                        </div>
                      ) : null}

                      {riskZones && !riskZonesLoading ? (
                        <div className="mt-4 space-y-3">
                          {riskZones.zones.map((zone) => (
                            <div
                              key={zone.id}
                              className="rounded-2xl border border-amber-100 bg-white p-3.5 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-slate-900">{zone.label}</span>
                                <Badge
                                  className={cn(
                                    zone.risk_level === "high" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                                  )}
                                >
                                  {zone.risk_level.toUpperCase()} HAZARD
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                                <span>Location: {zone.room}</span>
                                <span className="font-semibold text-slate-900 flex items-center gap-1">
                                  Incidents: <CountUp value={zone.incident_count} />
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {zone.dominant_factors.map((factor) => (
                                  <span
                                    key={factor}
                                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-medium"
                                  >
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}

                          {riskZones.unsafe_routes?.length ? (
                            <div className="mt-3 rounded-2xl bg-rose-50 p-3 ring-1 ring-rose-200">
                              <p className="text-xs font-semibold text-rose-900">Flagged Unsafe Transit Routes</p>
                              {riskZones.unsafe_routes.map((route, i) => (
                                <p key={i} className="mt-1 text-xs text-rose-800">
                                  🚨 <strong>{route.from_room} ↔ {route.to_room}:</strong> {route.note}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {plan.warnings.length ? (
                      <div className="rounded-[20px] bg-amber-50/90 p-4 ring-1 ring-amber-100">
                        <p className="text-xs font-semibold text-amber-950">Warnings</p>
                        <ul className="mt-2 space-y-1">
                          {plan.warnings.map((w) => (
                            <li key={w} className="text-xs text-amber-900/90">
                              • {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Fall-hazard report — prominent */}
                    <div className="rounded-[24px] bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5 ring-1 ring-rose-100">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                            Fall-Hazard Report
                          </p>
                          <p className="mt-1 font-display text-xl font-semibold text-slate-900">
                            <CountUp value={plan.hazard_summary.total} /> hazards flagged
                          </p>
                        </div>
                        <div className="flex gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-800">
                            High {plan.hazard_summary.high}
                          </span>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                            Med {plan.hazard_summary.med}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                            Low {plan.hazard_summary.low}
                          </span>
                        </div>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {plan.fall_hazards.map((h, i) => (
                          <motion.li
                            key={`${h.room}-${h.label}-${i}`}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="rounded-2xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-100"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={
                                  h.severity === "high"
                                    ? "high"
                                    : h.severity === "med"
                                      ? "warn"
                                      : "secondary"
                                }
                              >
                                {h.severity}
                              </Badge>
                              <span className="text-sm font-semibold text-slate-900">{h.label}</span>
                              <span className="text-xs text-slate-500">{h.room}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">{h.mitigation}</p>
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Bill of materials
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {plan.bill_of_materials.map((b) => (
                          <M3Card key={b.type} className="px-4 py-3">
                            <p className="text-[11px] text-slate-500">{DEVICE_LABEL[b.type]}</p>
                            <p className="font-display text-2xl font-semibold text-teal-800">
                              <CountUp value={b.count} />
                            </p>
                          </M3Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Install checklist
                      </p>
                      <ol className="space-y-1.5">
                        {plan.install_checklist.map((stepItem, i) => (
                          <li key={stepItem} className="text-xs text-slate-700">
                            <span className="font-semibold text-teal-800">{i + 1}.</span> {stepItem}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      disabled={blueprintLoading}
                      onClick={() => void generateBlueprint()}
                    >
                      <Sparkles className="h-4 w-4" />
                      {blueprintLoading ? "Generating blueprint…" : "Generate placement blueprint"}
                    </Button>

                    {blueprintLoading ? <AIThinking label="Rendering interactive blueprint…" /> : null}

                    <AnimatePresence>
                      {blueprintReady && plan ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          <PlacementBlueprint
                            plan={plan}
                            source={blueprintSource}
                            incidents={incidents}
                            riskZones={riskZones}
                            onSelectIncident={(inc) => void analyzeCausal(inc)}
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                ) : null}
              </div>
            </M3Card>
          </div>
        </div>

        {/* Troubleshooter — document flow, never overlays rooms */}
        <M3Card interactive={false} className="relative z-0 shrink-0">
          <div className="space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">Install troubleshooter</h2>
            <form onSubmit={askChat} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={chatQ}
                onChange={(e) => {
                  setChatQ(e.target.value);
                  setChatA(null);
                }}
                placeholder="Pairing, ~90 ft range, offline / Wi-Fi…"
                className={cn(fieldClass, "min-w-0 flex-1")}
              />
              <Button type="submit" className="shrink-0" disabled={chatLoading || !chatQ.trim()}>
                <Send className="h-4 w-4" />
                Ask AI
              </Button>
            </form>
            {chatLoading ? <AIThinking label="AI is analyzing…" /> : null}
            {chatA ? (
              <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
                <StreamingText text={chatA} />
              </div>
            ) : null}
          </div>
        </M3Card>

      </div>
    </PageTransition>
  );
}

const fieldClass =
  "w-full rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block text-xs font-semibold text-slate-500", className)}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-9 w-16 rounded-full transition",
        value ? "bg-teal-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-7 w-7 rounded-full bg-white shadow transition",
          value ? "left-8" : "left-1"
        )}
      />
    </button>
  );
}
