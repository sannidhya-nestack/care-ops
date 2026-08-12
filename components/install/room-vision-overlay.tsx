"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Heart, MapPin } from "lucide-react";
import { DEVICE_LABEL } from "@/data/devices";
import type { LoggedIncident, RoomVisionResult } from "@/lib/install-types";
import { AIThinking } from "@/components/motion/ai-motion";
import { cn } from "@/lib/utils";

export function RoomVisionOverlay({
  imageSrc,
  roomName,
  analyzing,
  result,
  incidents = [],
  onSelectIncident,
  onAddIncident,
}: {
  imageSrc: string;
  roomName: string;
  analyzing: boolean;
  result: RoomVisionResult | null;
  incidents?: LoggedIncident[];
  onSelectIncident?: (inc: LoggedIncident) => void;
  onAddIncident?: (coords: { x: number; y: number }) => void;
}) {
  const [showSensors, setShowSensors] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [tip, setTip] = useState<string | null>(null);

  const roomIncidents = incidents.filter(
    (inc) => inc.room.toLowerCase() === roomName.toLowerCase()
  );

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinDropMode || !onAddIncident) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onAddIncident({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
    setPinDropMode(false);
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative overflow-hidden rounded-[24px] bg-slate-100 ring-1 ring-slate-200",
          pinDropMode && "cursor-crosshair ring-2 ring-rose-500"
        )}
        onClick={handleImageClick}
      >
        <motion.img
          key={imageSrc}
          src={imageSrc}
          alt={roomName}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="aspect-[800/520] w-full object-cover pointer-events-none"
        />

        {analyzing ? (
          <div className="absolute inset-0 overflow-hidden bg-slate-900/25 backdrop-blur-[1px]">
            <motion.div
              className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-teal-300/50 to-transparent"
              animate={{ top: ["-10%", "110%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="absolute inset-x-4 bottom-4">
              <AIThinking label="Analyzing room…" />
            </div>
          </div>
        ) : null}

        {result && !analyzing ? (
          <>
            {showSensors
              ? result.sensors.map((s, i) => (
                  <motion.button
                    key={`s-${i}`}
                    type="button"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.08 * i, type: "spring", stiffness: 400, damping: 18 }}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${s.coords.x * 100}%`, top: `${s.coords.y * 100}%` }}
                    onMouseEnter={() =>
                      setTip(`${DEVICE_LABEL[s.type]} — ${s.placement_label}: ${s.rationale}`)
                    }
                    onMouseLeave={() => setTip(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTip(`${DEVICE_LABEL[s.type]} — ${s.placement_label}: ${s.rationale}`);
                    }}
                  >
                    <span className="relative flex h-4 w-4 items-center justify-center">
                      <span className="absolute h-4 w-4 animate-ping rounded-full bg-teal-400 opacity-40" />
                      <span className="relative h-3.5 w-3.5 rounded-full bg-teal-600 ring-2 ring-white shadow-md" />
                    </span>
                  </motion.button>
                ))
              : null}
            {showHazards
              ? result.fall_hazards.map((h, i) => (
                  <motion.button
                    key={`h-${i}`}
                    type="button"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.12 * i + 0.2, type: "spring", stiffness: 400, damping: 18 }}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${h.coords.x * 100}%`, top: `${h.coords.y * 100}%` }}
                    onMouseEnter={() => setTip(`${h.label} (${h.severity}): ${h.mitigation}`)}
                    onMouseLeave={() => setTip(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTip(`${h.label} (${h.severity}): ${h.mitigation}`);
                    }}
                  >
                    <span
                      className={cn(
                        "relative flex h-4 w-4 rounded-full ring-2 ring-white shadow-md",
                        h.severity === "high" && "bg-rose-500",
                        h.severity === "med" && "bg-amber-500",
                        h.severity === "low" && "bg-amber-300"
                      )}
                    />
                  </motion.button>
                ))
              : null}
          </>
        ) : null}

        {/* Logged Incident Overlay Markers */}
        {showIncidents
          ? roomIncidents.map((inc, i) => (
              <motion.button
                key={`inc-${inc.id}-${i}`}
                type="button"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * i, type: "spring", stiffness: 350, damping: 20 }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${inc.coords.x * 100}%`, top: `${inc.coords.y * 100}%` }}
                onMouseEnter={() =>
                  setTip(
                    `Logged Incident: ${inc.type} (${inc.date}) — ${inc.note}${
                      inc.vitalHeartRate ? ` | Vital Context: ${inc.vitalHeartRate} bpm` : ""
                    }`
                  )
                }
                onMouseLeave={() => setTip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIncident?.(inc);
                }}
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <span className="absolute h-6 w-6 animate-ping rounded-full bg-rose-500 opacity-60" />
                  <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white ring-2 ring-white shadow-lg">
                    <AlertCircle className="h-3 w-3" />
                  </span>
                </span>
              </motion.button>
            ))
          : null}
      </div>

      <AnimatePresence>
        {tip ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white"
          >
            {tip}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2">
        {result ? (
          <>
            <button
              type="button"
              onClick={() => setShowSensors((v) => !v)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                showSensors ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              Sensors
            </button>
            <button
              type="button"
              onClick={() => setShowHazards((v) => !v)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                showHazards ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              Hazards
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setShowIncidents((v) => !v)}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
            showIncidents ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600"
          )}
        >
          Incidents ({roomIncidents.length})
        </button>

        {onAddIncident ? (
          <button
            type="button"
            onClick={() => setPinDropMode((v) => !v)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold transition-all flex items-center gap-1",
              pinDropMode
                ? "bg-rose-700 text-white ring-2 ring-rose-400"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            )}
          >
            <MapPin className="h-3 w-3" />
            {pinDropMode ? "Click photo to drop pin" : "+ Drop Incident Pin"}
          </button>
        ) : null}

        {result ? <CoverageGauge score={result.coverage_score} /> : null}
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Device pin
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Hazard pin
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> Logged incident
        </span>
        {roomIncidents.some((i) => i.vitalHeartRate) ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200">
            <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" /> Vital Context Active
          </span>
        ) : null}
      </div>
    </div>
  );
}

function CoverageGauge({ score }: { score: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="ml-auto flex items-center gap-2">
      <svg width="44" height="44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <motion.circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#0f766e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Coverage</p>
        <p className="font-display text-lg font-semibold text-teal-800">{score}</p>
      </div>
    </div>
  );
}
