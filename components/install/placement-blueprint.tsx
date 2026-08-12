"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Armchair,
  Bath,
  DoorOpen,
  Heart,
  Flame,
  Radio,
  Watch,
  X,
  Zap,
} from "lucide-react";
import { DEVICE_LABEL, type DeviceType } from "@/data/devices";
import type {
  AggregatedInstallPlan,
  LoggedIncident,
  PlacementRow,
  RiskZoneAggregation,
} from "@/lib/install-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEVICE_ICON = {
  gateway: Radio,
  motion: Activity,
  door_contact: DoorOpen,
  bed_chair_presence: Armchair,
  bathroom_motion: Bath,
  panic_button: Zap,
  wearable: Watch,
} as const;

const DEVICE_COLOR: Record<DeviceType, string> = {
  gateway: "#0f766e",
  motion: "#2563eb",
  door_contact: "#7c3aed",
  bed_chair_presence: "#9333ea",
  bathroom_motion: "#ea580c",
  panic_button: "#dc2626",
  wearable: "#0891b2",
};

/** Architectural room rects on 820×620 blueprint canvas */
const ROOMS: {
  key: string;
  match: RegExp;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  label: string;
}[] = [
  {
    key: "living",
    match: /living|sitting|media/i,
    x: 48,
    y: 64,
    w: 300,
    h: 240,
    fill: "#f8fafc",
    label: "Living",
  },
  {
    key: "hall",
    match: /hall/i,
    x: 348,
    y: 64,
    w: 140,
    h: 240,
    fill: "#ffffff",
    label: "Hall",
  },
  {
    key: "bath",
    match: /bath/i,
    x: 488,
    y: 64,
    w: 180,
    h: 240,
    fill: "#f8fafc",
    label: "Bath",
  },
  {
    key: "bed",
    match: /bed|sleep|alcove/i,
    x: 48,
    y: 304,
    w: 360,
    h: 220,
    fill: "#f8fafc",
    label: "Bedroom",
  },
  {
    key: "entry",
    match: /entry|porch|kitchen|front/i,
    x: 408,
    y: 304,
    w: 260,
    h: 220,
    fill: "#ffffff",
    label: "Entry",
  },
];

type Pin = PlacementRow & {
  id: string;
  cx: number;
  cy: number;
  roomKey: string;
};

function roomFor(name: string) {
  return ROOMS.find((r) => r.match.test(name)) ?? ROOMS[4]!;
}

function layoutPins(plan: PlacementRow[]): Pin[] {
  const buckets = new Map<string, PlacementRow[]>();
  for (const row of plan) {
    const room = roomFor(row.room);
    const list = buckets.get(room.key) ?? [];
    list.push(row);
    buckets.set(room.key, list);
  }

  const pins: Pin[] = [];
  let i = 0;
  for (const room of ROOMS) {
    const rows = buckets.get(room.key) ?? [];
    const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(rows.length || 1))));
    rows.forEach((row, idx) => {
      const col = idx % cols;
      const r = Math.floor(idx / cols);
      const padX = room.w / (cols + 1);
      const padY = room.h / (Math.ceil(rows.length / cols) + 1);
      pins.push({
        ...row,
        id: `pin-${i++}`,
        roomKey: room.key,
        cx: room.x + padX * (col + 1),
        cy: room.y + padY * (r + 1) + 10,
      });
    });
  }
  return pins;
}

export function PlacementBlueprint({
  plan,
  source = "mock",
  incidents = [],
  riskZones,
  onSelectIncident,
}: {
  plan: AggregatedInstallPlan;
  source?: string;
  incidents?: LoggedIncident[];
  riskZones?: RiskZoneAggregation | null;
  onSelectIncident?: (inc: LoggedIncident) => void;
}) {
  const pins = useMemo(() => layoutPins(plan.placement_plan), [plan.placement_plan]);
  const [activePin, setActivePin] = useState<Pin | null>(null);
  const [activeIncident, setActiveIncident] = useState<LoggedIncident | null>(null);
  const [showSensors, setShowSensors] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Map incidents to blueprint canvas coordinates
  const incidentPins = useMemo(() => {
    return incidents.map((inc) => {
      const r = roomFor(inc.room);
      const cx = r.x + inc.coords.x * r.w;
      const cy = r.y + inc.coords.y * r.h;
      return { ...inc, cx, cy, roomKey: r.key };
    });
  }, [incidents]);

  return (
    <div className="overflow-hidden rounded-[24px] ring-1 ring-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <div>
          <p className="text-sm font-semibold text-slate-900">CareOps AI · Placement blueprint</p>
          <p className="text-[11px] text-slate-500">
            Field floor plan · click a device or incident pin for analysis · Gateway ~90 ft rule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSensors((v) => !v)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all",
              showSensors ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            Sensors
          </button>
          <button
            type="button"
            onClick={() => setShowIncidents((v) => !v)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all",
              showIncidents ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            Incidents ({incidents.length})
          </button>
          <button
            type="button"
            onClick={() => setShowHeatmap((v) => !v)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all flex items-center gap-1",
              showHeatmap ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            <Flame className="h-3 w-3" />
            Risk Heatmap
          </button>
          <Badge variant="outline">{source}</Badge>
        </div>
      </div>

      <div
        className="relative bg-[#dbe4ee]"
        onClick={() => {
          setActivePin(null);
          setActiveIncident(null);
        }}
      >
        <svg
          viewBox="0 0 820 620"
          className="block h-auto w-full"
          role="img"
          aria-label="Home placement blueprint"
        >
          <defs>
            <pattern id="bp-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#94a3b8" strokeOpacity="0.35" strokeWidth="0.5" />
            </pattern>
            <pattern id="bp-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#64748b" strokeWidth="0.8" />
            </pattern>

            {/* Heatmap Radial Gradients */}
            <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-med" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* paper */}
          <rect width="820" height="620" fill="#eef2f6" />
          <rect x="20" y="20" width="680" height="540" fill="url(#bp-grid)" stroke="#1e293b" strokeWidth="1.5" />

          {/* double outer wall */}
          <rect x="28" y="28" width="664" height="524" fill="none" stroke="#0f172a" strokeWidth="7" />
          <rect x="34" y="34" width="652" height="512" fill="none" stroke="#334155" strokeWidth="1.5" />

          {ROOMS.map((room) => (
            <g key={room.key}>
              <rect
                x={room.x}
                y={room.y}
                width={room.w}
                height={room.h}
                fill={room.fill}
                stroke="#1e293b"
                strokeWidth="3"
              />
              <text
                x={room.x + room.w / 2}
                y={room.y + 22}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#475569"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                letterSpacing="0.12em"
              >
                {room.label.toUpperCase()}
              </text>
            </g>
          ))}

          {/* Risk Zone Heat Circles Overlay */}
          {showHeatmap && riskZones?.zones
            ? riskZones.zones.map((zone) => {
                const r = roomFor(zone.room);
                const cx = r.x + zone.centroid_coords.x * r.w;
                const cy = r.y + zone.centroid_coords.y * r.h;
                const radiusPx = Math.max(50, Math.min(110, zone.radius * 420));
                const isHigh = zone.risk_level === "high";
                return (
                  <g key={`heat-${zone.id}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radiusPx}
                      fill={isHigh ? "url(#heat-high)" : "url(#heat-med)"}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radiusPx * 0.45}
                      fill="none"
                      stroke={isHigh ? "#dc2626" : "#d97706"}
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      opacity="0.7"
                    />
                  </g>
                );
              })
            : null}

          {/* Unsafe Transit Route Connector Lines */}
          {showHeatmap && riskZones?.unsafe_routes
            ? riskZones.unsafe_routes.map((route, idx) => {
                const r1 = roomFor(route.from_room);
                const r2 = roomFor(route.to_room);
                const x1 = r1.x + r1.w / 2;
                const y1 = r1.y + r1.h / 2;
                const x2 = r2.x + r2.w / 2;
                const y2 = r2.y + r2.h / 2;
                return (
                  <g key={`route-${idx}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      opacity="0.85"
                    />
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="#dc2626"
                      fontFamily="ui-monospace, monospace"
                    >
                      FLAGGED UNSAFE TRANSIT
                    </text>
                  </g>
                );
              })
            : null}

          {/* door openings (wall breaks) */}
          <rect x="338" y="160" width="20" height="36" fill="#eef2f6" />
          <path d="M 348 160 A 36 36 0 0 1 384 196" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />
          <rect x="478" y="160" width="20" height="36" fill="#eef2f6" />
          <path d="M 488 160 A 36 36 0 0 1 524 196" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />
          <rect x="200" y="294" width="36" height="20" fill="#eef2f6" />
          <path d="M 200 304 A 36 36 0 0 0 236 340" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />
          <rect x="398" y="380" width="20" height="36" fill="#eef2f6" />
          {/* front entry */}
          <rect x="520" y="512" width="40" height="20" fill="#eef2f6" />
          <path d="M 520 524 A 40 40 0 0 1 560 484" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* furniture ghosts */}
          <rect x="72" y="120" width="110" height="48" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" />
          <text x="127" y="148" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="ui-monospace,monospace">
            SOFA
          </text>
          <rect x="90" y="380" width="90" height="70" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" />
          <text x="135" y="420" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="ui-monospace,monospace">
            BED
          </text>
          <circle cx="560" cy="200" r="22" fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" />
          <text x="560" y="204" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace">
            TUB
          </text>

          {/* north arrow */}
          <g transform="translate(640 48)">
            <polygon points="12,0 22,28 12,22 2,28" fill="#0f172a" />
            <text x="12" y="42" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a" fontFamily="ui-monospace,monospace">
              N
            </text>
          </g>

          {/* title block */}
          <g transform="translate(710 20)">
            <rect width="90" height="540" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="0" y="0" width="90" height="48" fill="url(#bp-hatch)" stroke="#1e293b" strokeWidth="1" />
            <text x="45" y="28" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a" fontFamily="ui-monospace,monospace">
              CAREOPS
            </text>
            <text x="8" y="72" fontSize="8" fill="#475569" fontFamily="ui-monospace,monospace">
              SHEET
            </text>
            <text x="8" y="88" fontSize="14" fontWeight="700" fill="#0f172a" fontFamily="ui-monospace,monospace">
              A-01
            </text>
            <line x1="8" y1="100" x2="82" y2="100" stroke="#cbd5e1" />
            <text x="8" y="120" fontSize="8" fill="#475569" fontFamily="ui-monospace,monospace">
              DEVICES
            </text>
            <text x="8" y="136" fontSize="16" fontWeight="700" fill="#0f766e" fontFamily="ui-monospace,monospace">
              {plan.placement_plan.length}
            </text>
            <line x1="8" y1="148" x2="82" y2="148" stroke="#cbd5e1" />
            <text x="8" y="168" fontSize="8" fill="#475569" fontFamily="ui-monospace,monospace">
              INCIDENTS
            </text>
            <text x="8" y="186" fontSize="16" fontWeight="700" fill="#e11d48" fontFamily="ui-monospace,monospace">
              {incidents.length}
            </text>
            <line x1="8" y1="200" x2="82" y2="200" stroke="#cbd5e1" />
            <text x="8" y="220" fontSize="8" fill="#475569" fontFamily="ui-monospace,monospace">
              RULE
            </text>
            <text x="8" y="238" fontSize="9" fontWeight="600" fill="#0f172a" fontFamily="ui-monospace,monospace">
              GW ~90ft
            </text>
          </g>

          <text x="360" y="586" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="ui-monospace,monospace">
            Offline blueprint · click device or incident pins for detailed causal analysis
          </text>
        </svg>

        {/* Interactive Device Pins */}
        {showSensors ? (
          <div className="pointer-events-none absolute inset-0">
            {pins.map((pin, idx) => {
              const Icon = DEVICE_ICON[pin.type];
              const color = DEVICE_COLOR[pin.type];
              const left = (pin.cx / 820) * 100;
              const top = (pin.cy / 620) * 100;
              const selected = activePin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${left}%`, top: `${top}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIncident(null);
                    setActivePin(selected ? null : pin);
                  }}
                  aria-label={`${DEVICE_LABEL[pin.type]} in ${pin.room}`}
                >
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={selected ? { scale: 1.12 } : { scale: 1, opacity: 1 }}
                    transition={{ delay: 0.05 * idx, type: "spring", stiffness: 380, damping: 22 }}
                    whileHover={{ scale: 1.15 }}
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-[0_4px_14px_rgba(15,23,42,0.28)] ring-2 ring-white",
                      selected && "ring-[3px] ring-teal-400"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.4} />
                  </motion.span>
                  {!pin.within_range ? (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white">
                      <AlertTriangle className="h-2.5 w-2.5 text-white" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Interactive Incident Pins */}
        {showIncidents ? (
          <div className="pointer-events-none absolute inset-0">
            {incidentPins.map((inc, idx) => {
              const left = (inc.cx / 820) * 100;
              const top = (inc.cy / 620) * 100;
              const selected = activeIncident?.id === inc.id;
              return (
                <button
                  key={`inc-bp-${inc.id}-${idx}`}
                  type="button"
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${left}%`, top: `${top}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePin(null);
                    setActiveIncident(selected ? null : inc);
                    onSelectIncident?.(inc);
                  }}
                >
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={selected ? { scale: 1.25 } : { scale: 1, opacity: 1 }}
                    transition={{ delay: 0.08 * idx, type: "spring", stiffness: 350, damping: 20 }}
                    whileHover={{ scale: 1.2 }}
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg ring-2 ring-white",
                      selected && "ring-4 ring-rose-400"
                    )}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="absolute -inset-1 animate-ping rounded-full bg-rose-500 opacity-40" />
                  </motion.span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Active Pin / Incident Info Card Modal */}
        <AnimatePresence>
          {activePin ? (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute bottom-4 left-4 right-4 z-20 mx-auto max-w-md rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_48px_rgba(15,23,42,0.22)] sm:left-auto sm:right-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-white shadow-md"
                  style={{ backgroundColor: DEVICE_COLOR[activePin.type] }}
                >
                  {(() => {
                    const Icon = DEVICE_ICON[activePin.type];
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {DEVICE_LABEL[activePin.type]}
                      </p>
                      <p className="text-xs text-slate-500">{activePin.room}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setActivePin(null)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800">{activePin.placement}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{activePin.reasoning}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {activePin.within_range ? (
                      <Badge className="bg-emerald-50 text-emerald-800">In range · ~90 ft</Badge>
                    ) : (
                      <Badge variant="warn">Check Gateway range</Badge>
                    )}
                    <Badge variant="secondary">{activePin.type}</Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {activeIncident ? (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute bottom-4 left-4 right-4 z-20 mx-auto max-w-md rounded-[22px] border border-rose-200 bg-white p-4 shadow-[0_16px_48px_rgba(244,63,94,0.18)] sm:left-auto sm:right-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-rose-600 text-white shadow-md">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {activeIncident.type}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activeIncident.room} · Logged {activeIncident.date}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setActiveIncident(null)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700">{activeIncident.note}</p>

                  {/* Vital Context Chip */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {activeIncident.vitalHeartRate ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-300">
                        <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                        Vital Context: HR {activeIncident.vitalHeartRate} bpm (Wearable)
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onSelectIncident?.(activeIncident)}
                      className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                    >
                      Analyze Causes →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white px-4 py-3">
        {(Object.keys(DEVICE_ICON) as DeviceType[]).map((type) => {
          const Icon = DEVICE_ICON[type];
          const used = plan.placement_plan.some((p) => p.type === type);
          if (!used) return null;
          return (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200"
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: DEVICE_COLOR[type] }}
              >
                <Icon className="h-3 w-3" />
              </span>
              {DEVICE_LABEL[type]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
