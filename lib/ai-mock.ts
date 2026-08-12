import type { Ticket } from "@/data/tickets";
import {
  CATEGORY_LABEL,
  CATEGORY_TEAM,
  getTeam,
  type TicketCategory,
  type TeamId,
} from "@/data/teams";
import { GATEWAY_RANGE_FT } from "@/data/homes";

export type Priority = "high" | "medium" | "low";

export type TriageResult = {
  category: TicketCategory;
  priority: Priority;
  suggested_team: string;
  suggested_team_id: TeamId;
  confidence: number;
  one_line_summary: string;
  suggested_first_reply: string;
  source: "live" | "mock";
};

export type PlacementItem = {
  room: string;
  sensor_type: string;
  rationale: string;
  within_range: boolean;
};

export type InstallPlan = {
  placement_plan: PlacementItem[];
  install_checklist: string[];
  warnings: string[];
  source: "live" | "mock";
};

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function mockTriage(ticket: Ticket): TriageResult {
  const category = ticket.trueCategory;
  const team = getTeam(CATEGORY_TEAM[category]);
  let confidence = 88;
  let priority: Priority = "medium";

  if (category === "family_distress") {
    confidence = 64;
    priority = "high";
  } else if (category === "gateway_offline") {
    confidence = 91;
    priority = "high";
  } else if (category === "sensor_pairing" && ticket.id === "tkt-010") {
    confidence = 68;
  } else if (category === "subscription_billing" || category === "app_howto") {
    confidence = 90;
    priority = "low";
  } else if (category === "gateway_range") {
    confidence = 86;
  }

  if (ticket.channel === "phone-note" && category !== "family_distress") {
    confidence = Math.min(confidence, 72);
  }

  const replies: Record<TicketCategory, string> = {
    sensor_pairing: `Hi ${ticket.customerName.split(" ")[0]}, confirm gateway green → Devices → Add sensor → press once for blue blink. Reply with last-4 serial if still amber.`,
    gateway_range: `Hi ${ticket.customerName.split(" ")[0]}, ~${GATEWAY_RANGE_FT} ft through walls is expected limit. Move gateway toward midpoint or use approved extender.`,
    gateway_offline: `Hi ${ticket.customerName.split(" ")[0]}, unplug 30s → wait 2 min for amber→green. If red, rear button 5s Wi-Fi rejoin. No factory reset yet.`,
    wearable_sync: `Hi ${ticket.customerName.split(" ")[0]}, Wearable → Sync now within 3 ft, toggle Bluetooth, then retry.`,
    subscription_billing: `Hi ${ticket.customerName.split(" ")[0]}, routing ${ticket.account} to Billing for a clear invoice breakdown.`,
    app_howto: `Hi ${ticket.customerName.split(" ")[0]}, Settings → Alerts → Quiet hours; keep Safety events on.`,
    hardware_rma: `Hi ${ticket.customerName.split(" ")[0]}, flagged for RMA — confirm ship-to and attach a photo if you haven't.`,
    family_distress: `Hi ${ticket.customerName.split(" ")[0]}, a Care/Family Liaison is connecting now. If anyone is in immediate danger, call local emergency services.`,
  };

  return {
    category,
    priority: category === "family_distress" ? "high" : priority,
    suggested_team: team.name,
    suggested_team_id: team.id,
    confidence: clampPct(confidence),
    one_line_summary:
      category === "family_distress"
        ? `${ticket.customerName} — sensitive care situation; Care/Family Liaison + human review.`
        : `${ticket.customerName} · ${CATEGORY_LABEL[category].toLowerCase()} — ${ticket.subject.slice(0, 64)}`,
    suggested_first_reply: replies[category],
    source: "mock",
  };
}

export function mockInstallPlan(input: {
  homeDescription: string;
  rooms: string[];
  gatewayLocation: string;
}): InstallPlan {
  const rooms =
    input.rooms.length > 0
      ? input.rooms
      : ["Living room", "Bedroom", "Bathroom", "Hallway", "Kitchen"];
  const gateway = input.gatewayLocation || "Living room";

  const farRooms = ["Back bedroom", "Guest room", "Garage", "Porch", "Basement"];
  const placement_plan: PlacementItem[] = rooms.map((room) => {
    const far =
      farRooms.some((f) => room.toLowerCase().includes(f.toLowerCase().split(" ")[0]!)) ||
      /back|guest|garage|porch|basement|attic/i.test(room);
    const type =
      /bath/i.test(room)
        ? "Bathroom Motion Sensor"
        : /door|entry|hall/i.test(room)
          ? "Door/Window Contact Sensor"
          : /bed|sleep/i.test(room)
            ? "Bed/Chair Presence Sensor"
            : "Motion Sensor";
    return {
      room,
      sensor_type: type,
      rationale: far
        ? `${room} likely exceeds ~${GATEWAY_RANGE_FT} ft from ${gateway} through walls — place Gateway closer.`
        : `Place ${type} in ${room}; path from Gateway at ${gateway} should stay within ~${GATEWAY_RANGE_FT} ft.`,
      within_range: !far,
    };
  });

  if (!placement_plan.some((p) => p.room.toLowerCase() === gateway.toLowerCase())) {
    placement_plan.unshift({
      room: gateway,
      sensor_type: "Gateway",
      rationale: `Mount Gateway elevated in ${gateway}, clear of metal cabinets.`,
      within_range: true,
    });
  }

  const warnings = placement_plan
    .filter((p) => !p.within_range)
    .map((p) => `${p.room}: likely out of ~${GATEWAY_RANGE_FT} ft range from ${gateway}.`);

  if (/two.?stor|2.?floor|upstairs/i.test(input.homeDescription)) {
    warnings.push("Multi-floor homes often need a mid-stair or upstairs extender for reliable coverage.");
  }

  return {
    placement_plan,
    install_checklist: [
      "Unbox Gateway + sensors; note serials.",
      `Place Gateway in ${gateway} (elevated, central).`,
      "Power Gateway; wait for solid green LED and app Online.",
      "Add each Motion Sensor, Door/Window Contact, Bed/Chair Presence, Bathroom Motion, Panic Button.",
      "Enroll Wearable (vitals + fall); set overnight charge habit.",
      "Walk-test each room; watch for out-of-range banner (~90 ft).",
      "Invite authorized care-circle members.",
    ],
    warnings,
    source: "mock",
  };
}

export function mockInstallChat(question: string): { answer: string; source: "mock" } {
  const q = question.toLowerCase();
  if (/pair|amber|blink/.test(q)) {
    return {
      answer:
        "Pairing check: gateway solid green → remove half-added row → Add sensor → one press for blue blink. Holding 10s reset without Add-sensor open orphans the device.",
      source: "mock",
    };
  }
  if (/range|90|extender|far/.test(q)) {
    return {
      answer: `Range rule: ~${GATEWAY_RANGE_FT} ft indoor. Through walls, effective range drops. Move gateway toward the midpoint or use an approved sensor-radio extender — not a consumer Wi-Fi extender.`,
      source: "mock",
    };
  }
  if (/offline|wifi|led|red/.test(q)) {
    return {
      answer:
        "Offline recovery: unplug 30s → wait 2 min amber→green. Solid red → rear button 5s Wi-Fi rejoin on primary LAN SSID. Skip factory reset on first contact.",
      source: "mock",
    };
  }
  return {
    answer:
      "Ask about pairing (amber LED), range (~90 ft), or offline/Wi-Fi recovery — I answer from CareOps install playbooks only.",
    source: "mock",
  };
}

export function mockIncidentAnalyze(
  incident: { id: string; room: string; note: string; type: string },
  roomName?: string
) {
  const room = roomName || incident.room;
  let causes = [
    {
      factor: "Abrupt Position Change & Gravity Transition",
      explanation:
        "Rapid change from seated/resting posture to standing may induce transient balance instability near furniture edge.",
      confidence: 88,
    },
    {
      factor: "Floor Surface Boundary Friction Difference",
      explanation:
        "Transition between soft carpet edge and smooth floor creates unexpected foot height variance.",
      confidence: 82,
    },
  ];
  let env = ["low couch edge", "loose carpet edge", "poor lighting"];
  let adjustments = [
    "Recommend adding non-slip backing under floor rug edge",
    "Advise installing automatic motion nightlight along transition path",
    "Suggest evaluating seat cushions to elevate standing posture height",
  ];
  let severity: "low" | "med" | "high" = "med";

  if (/bath/i.test(room) || /shower|wet|tile/i.test(incident.note)) {
    causes = [
      {
        factor: "Low-Friction Wet Tile Surface",
        explanation:
          "Moisture on untextured porcelain or ceramic tile significantly reduces footwear traction.",
        confidence: 94,
      },
      {
        factor: "Absence of Rigid Support Handle",
        explanation:
          "No fixed wall support rail accessible during wet step-out transition.",
        confidence: 89,
      },
    ];
    env = ["wet bathroom floor", "threshold lip", "lack of support rail"];
    adjustments = [
      "Recommend non-skid textured safety matting outside tub/shower",
      "Advise mounting ADA-compliant wall support handle near wet transition",
    ];
    severity = "high";
  } else if (/bed/i.test(room) || /night/i.test(incident.note)) {
    causes = [
      {
        factor: "Nighttime Dim Illumination & Disorientation",
        explanation:
          "Low ambient light during nighttime waking reduces visual obstacle perception.",
        confidence: 91,
      },
      {
        factor: "Threshold Lip & Rug Boundary",
        explanation:
          "Bedside runner edge creates a 0.5-inch lip catch point during initial steps.",
        confidence: 85,
      },
    ];
    env = ["loose carpet edge", "threshold lip", "poor lighting"];
    adjustments = [
      "Recommend low-glare motion nightlight along Bed ↔ Bathroom corridor",
      "Advise securing loose rug perimeter with floor adhesive strip",
    ];
    severity = "high";
  }

  return {
    incident_id: incident.id,
    likely_causes: causes,
    contributing_environment: env,
    severity,
    recommended_environmental_adjustments: adjustments,
    source: "mock" as const,
  };
}

export function mockRiskZones(incidents: { id: string; room: string; type: string }[]) {
  return {
    zones: [
      {
        id: "rz-01",
        label: "Bedroom Bedside & Threshold Zone",
        room: "Bedroom",
        centroid_coords: { x: 0.32, y: 0.7 },
        radius: 0.18,
        incident_count: 2,
        dominant_factors: ["Nighttime transit", "Bed edge threshold", "Dim lighting"],
        risk_level: "high" as const,
      },
      {
        id: "rz-02",
        label: "Bathroom Wet Step-Out Zone",
        room: "Bathroom",
        centroid_coords: { x: 0.72, y: 0.38 },
        radius: 0.15,
        incident_count: 2,
        dominant_factors: ["Wet floor tile", "Lack of grab support", "Low traction"],
        risk_level: "high" as const,
      },
      {
        id: "rz-03",
        label: "Living Room Sofa Rising Area",
        room: "Living room",
        centroid_coords: { x: 0.28, y: 0.52 },
        radius: 0.16,
        incident_count: 1,
        dominant_factors: ["Low seat height", "Sudden posture change"],
        risk_level: "medium" as const,
      },
    ],
    unsafe_routes: [
      {
        from_room: "Bedroom",
        to_room: "Bathroom",
        note: "Flagged unsafe transit route: High nighttime movement frequency with repeat stumble incidents near threshold.",
      },
      {
        from_room: "Living room",
        to_room: "Bathroom",
        note: "Flagged high-traffic corridor: Frequent transit path with seating transition hazard.",
      },
    ],
    source: "mock" as const,
  };
}

export function mockVitalAssess(input: {
  immobilityDurationMins?: number;
  heartRate?: number;
  spo2?: number;
  residentName?: string;
}) {
  const hr = input.heartRate || 118;
  const dur = input.immobilityDurationMins || 45;
  const spo2 = input.spo2 || 94;

  if (hr > 105 || hr < 50) {
    return {
      assessment: "possible_cardiac_event" as const,
      reasoning: `Elevated heart rate (${hr} bpm vs baseline 72 bpm) with SpO2 at ${spo2}% combined with ${dur}-minute immobility on Bed/Chair Presence Sensor. Decision-support indicator prompts immediate human check.`,
      hr_summary: {
        current: hr,
        baseline: 72,
        trend: (hr > 105 ? "elevated" : "bradycardia") as "elevated" | "bradycardia" | "stable" | "erratic",
      },
      confidence: 92,
      urgency: "critical" as const,
      recommended_action:
        "Escalate immediately to Care/Family Liaison and dispatch nurse for physical check.",
      escalation: true,
      source: "mock" as const,
    };
  }

  if (dur > 60 && hr >= 60 && hr <= 78) {
    return {
      assessment: "likely_sleep" as const,
      reasoning: `Stable resting heart rate (${hr} bpm) matching circadian baseline during ${dur}-minute bed presence. Low likelihood of acute physical distress.`,
      hr_summary: {
        current: hr,
        baseline: 72,
        trend: "stable" as const,
      },
      confidence: 95,
      urgency: "low" as const,
      recommended_action:
        "Routine continuous monitoring; no immediate intervention required.",
      escalation: false,
      source: "mock" as const,
    };
  }

  return {
    assessment: "possible_stroke_indicator" as const,
    reasoning: `Irregular heart rate trend (${hr} bpm) with prolonged immobility (${dur} min) outside scheduled rest windows. Indicator prompts priority human evaluation.`,
    hr_summary: {
      current: hr,
      baseline: 70,
      trend: "erratic" as const,
    },
    confidence: 88,
    urgency: "high" as const,
    recommended_action:
      "Flag for priority nurse review and notify designated family contact.",
    escalation: true,
    source: "mock" as const,
  };
}

export type VitalAssessment = ReturnType<typeof mockVitalAssess>;

export function mockVitalEWS(resident: {
  id: string;
  name: string;
  currentHR: number;
  baselineHR: number;
  currentSpO2: number;
  baselineSpO2: number;
  immobilityMins: number;
  restingHR3DayTrend: number[];
}) {
  let ews = 0;
  const signals: { signal: string; value: string; baseline: string; deviation: string }[] = [];

  const hrDiff = resident.currentHR - resident.baselineHR;
  if (resident.currentHR > 110 || resident.currentHR < 50) {
    ews += 4;
    signals.push({
      signal: "Heart Rate Tachycardia/Bradycardia",
      value: `${resident.currentHR} bpm`,
      baseline: `${resident.baselineHR} bpm`,
      deviation: `${hrDiff > 0 ? "+" : ""}${hrDiff} bpm`,
    });
  } else if (resident.currentHR > 95) {
    ews += 2;
    signals.push({
      signal: "Heart Rate Elevation",
      value: `${resident.currentHR} bpm`,
      baseline: `${resident.baselineHR} bpm`,
      deviation: `+${hrDiff} bpm`,
    });
  }

  const spo2Diff = resident.currentSpO2 - resident.baselineSpO2;
  if (resident.currentSpO2 < 93) {
    ews += 3;
    signals.push({
      signal: "SpO2 Oxygen Desaturation",
      value: `${resident.currentSpO2}%`,
      baseline: `${resident.baselineSpO2}%`,
      deviation: `${spo2Diff}%`,
    });
  } else if (resident.currentSpO2 < 95) {
    ews += 1;
    signals.push({
      signal: "Mild SpO2 Dip",
      value: `${resident.currentSpO2}%`,
      baseline: `${resident.baselineSpO2}%`,
      deviation: `${spo2Diff}%`,
    });
  }

  if (resident.immobilityMins > 30) {
    ews += resident.currentHR > 100 ? 3 : 1;
    signals.push({
      signal: "Daytime Immobility (Active-IR Presence)",
      value: `${resident.immobilityMins} mins`,
      baseline: "< 15 mins",
      deviation: `+${resident.immobilityMins - 15} mins`,
    });
  }

  const trendDiff = resident.restingHR3DayTrend[2]! - resident.restingHR3DayTrend[0]!;
  if (trendDiff >= 8) {
    ews += 2;
    signals.push({
      signal: "3-Day Resting HR Drift",
      value: `${resident.restingHR3DayTrend[2]} bpm`,
      baseline: `${resident.restingHR3DayTrend[0]} bpm`,
      deviation: `+${trendDiff} bpm drift`,
    });
  }

  const risk_band: "low" | "med" | "high" | "critical" =
    ews >= 7 ? "critical" : ews >= 4 ? "high" : ews >= 2 ? "med" : "low";

  const trend: "improving" | "stable" | "worsening" =
    ews >= 4 || trendDiff >= 8 ? "worsening" : ews >= 2 ? "stable" : "improving";

  return {
    resident_id: resident.id,
    ews_score: ews,
    risk_band,
    contributing_signals: signals.length
      ? signals
      : [
          {
            signal: "Heart Rate & SpO2 Nominal",
            value: `${resident.currentHR} bpm / ${resident.currentSpO2}%`,
            baseline: `${resident.baselineHR} bpm / ${resident.baselineSpO2}%`,
            deviation: "Normal range",
          },
        ],
    trend,
    recommended_check:
      risk_band === "critical"
        ? "Immediate bedside physical check & nurse escalation. Verify wearable placement."
        : risk_band === "high"
          ? "Priority nurse review within 30 mins; check hydration and vital signs."
          : "Routine shift monitoring.",
    escalate: risk_band === "critical" || risk_band === "high",
    source: "mock" as const,
  };
}

export function mockShiftHandoff(resident: {
  name: string;
  room: string;
  conditions: string[];
  currentHR: number;
  baselineHR: number;
  currentSpO2: number;
  immobilityMins: number;
  ews_score?: number;
  risk_band?: string;
}) {
  const ews = resident.ews_score ?? 6;
  const isHigh = ews >= 4;

  return {
    resident_id: resident.name,
    resident_name: resident.name,
    situation: `Resident ${resident.name} (${resident.room}) currently presents with adapted EWS score ${ews} (${(resident.risk_band || "HIGH").toUpperCase()} risk). HR: ${resident.currentHR} bpm, SpO2: ${resident.currentSpO2}%.`,
    background: `History of ${resident.conditions.join(", ")}. Baseline resting HR ${resident.baselineHR} bpm. Wearable & Active-IR Bed Presence active.`,
    assessment: isHigh
      ? `Elevated risk pattern detected: ${resident.immobilityMins}m daytime immobility combined with HR ${resident.currentHR} bpm (${resident.currentHR - resident.baselineHR > 0 ? "+" : ""}${resident.currentHR - resident.baselineHR} bpm vs baseline). Prompts human check.`
      : `Resident stable throughout shift. Vitals within expected baseline circadian limits.`,
    recommendation: isHigh
      ? `1) Conduct physical room check within 20 mins. 2) Perform manual BP & pulse ox check. 3) Log update in CareOps Triage queue if un-resolving.`
      : `Continue standard 4-hour shift monitoring protocol.`,
    escalation_flag: isHigh,
    source: "mock" as const,
  };
}

export type VitalEWSResult = ReturnType<typeof mockVitalEWS>;
export type ShiftHandoffResult = ReturnType<typeof mockShiftHandoff>;





