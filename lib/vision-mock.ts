import { DEVICE_LABEL, normalizeDeviceType, type DeviceType } from "@/data/devices";
import { GATEWAY_RANGE_FT } from "@/data/homes";
import type {
  AggregatedInstallPlan,
  InstallIntake,
  PlacementRow,
  RoomVisionResult,
  VisionHazard,
} from "@/lib/install-types";

const ALLOWED = Object.values(DEVICE_LABEL).join(", ");

export function mockRoomVision(input: {
  roomName: string;
  sampleKey?: string;
  intake: InstallIntake;
}): RoomVisionResult {
  const key = (input.sampleKey || input.roomName).toLowerCase();
  const concrete = input.intake.construction === "concrete";
  const spotty = input.intake.wifiQuality !== "good";
  const fallRisk = input.intake.fallHistory || input.intake.mobilityAid === "wheelchair";
  const gw = input.intake.gatewayLocation || "Living room";

  if (/bath/.test(key)) {
    return {
      room_detected: "Bathroom",
      sensors: [
        {
          type: "bathroom_motion",
          placement_label: "Ceiling corner over vanity",
          rationale: fallRisk
            ? "Prioritize bathroom coverage for fall + nighttime bathroom frequency."
            : "Capture entry and stall approach without cameras.",
          coords: { x: 0.72, y: 0.28 },
          within_range: !concrete,
          range_note: concrete
            ? `Concrete walls shorten RF — keep under ~${GATEWAY_RANGE_FT * 0.7} ft effective from ${gw}.`
            : `Within ~${GATEWAY_RANGE_FT} ft path from ${gw}.`,
        },
        {
          type: "panic_button",
          placement_label: "Wall near toilet reach zone",
          rationale: "Reachable seated panic for nighttime bathroom trips.",
          coords: { x: 0.35, y: 0.62 },
          within_range: true,
          range_note: "Short path to gateway room.",
        },
      ],
      fall_hazards: [
        {
          label: "Wet floor / tub edge",
          severity: fallRisk ? "high" : "med",
          coords: { x: 0.55, y: 0.7 },
          mitigation: "Non-slip mat + grab bar; keep bathroom motion alerts on overnight.",
        },
        {
          label: "Loose bath rug",
          severity: "med",
          coords: { x: 0.4, y: 0.82 },
          mitigation: "Remove or tape rug; confirm doorway clear for walker/wheelchair.",
        },
      ],
      gateway_range_assessment: concrete
        ? `Concrete construction: treat bathroom as borderline for radio from ${gw}.`
        : `Bathroom RF path from ${gw} looks acceptable.`,
      coverage_score: fallRisk ? 88 : 79,
      source: "mock",
    };
  }

  if (/bed/.test(key)) {
    return {
      room_detected: "Bedroom",
      sensors: [
        {
          type: "bed_chair_presence",
          placement_label: "Under mattress / chair seat",
          rationale: "Sleep-window presence + prolonged absence detection.",
          coords: { x: 0.48, y: 0.55 },
          within_range: !/back/.test(input.roomName.toLowerCase()),
          range_note: /back/.test(input.roomName.toLowerCase())
            ? `Back bedroom often exceeds ~${GATEWAY_RANGE_FT} ft from ${gw}.`
            : `OK distance from ${gw}.`,
        },
        {
          type: "motion",
          placement_label: "Door-facing corner",
          rationale: "Catch night exits toward bathroom.",
          coords: { x: 0.18, y: 0.22 },
          within_range: true,
          range_note: "Near hallway path.",
        },
        {
          type: "wearable",
          placement_label: "Nightstand charging cradle",
          rationale: "Vitals + fall wearable overnight charge habit.",
          coords: { x: 0.78, y: 0.48 },
          within_range: true,
          range_note: "Bluetooth to gateway room when worn.",
        },
      ],
      fall_hazards: [
        {
          label: "Cluttered bedside path",
          severity: fallRisk ? "high" : "low",
          coords: { x: 0.62, y: 0.75 },
          mitigation: "Clear night path to bathroom; soft night light.",
        },
      ],
      gateway_range_assessment: `Bedroom coverage depends on path length to ${gw}${spotty ? "; Wi-Fi spotty — verify gateway online LED." : "."}`,
      coverage_score: 84,
      source: "mock",
    };
  }

  if (/hall/.test(key)) {
    return {
      room_detected: "Hallway",
      sensors: [
        {
          type: "motion",
          placement_label: "Mid-hall ceiling",
          rationale: "Bridge living ↔ bedroom nocturnal path.",
          coords: { x: 0.5, y: 0.4 },
          within_range: true,
          range_note: `Hallway is usually mid-path under ~${GATEWAY_RANGE_FT} ft.`,
        },
        {
          type: "door_contact",
          placement_label: "Exit door jamb",
          rationale: "Door/window contact for exit awareness.",
          coords: { x: 0.88, y: 0.55 },
          within_range: true,
          range_note: "Near gateway wing.",
        },
      ],
      fall_hazards: [
        {
          label: "Throw rug / threshold lip",
          severity: "med",
          coords: { x: 0.45, y: 0.78 },
          mitigation: "Secure rug or remove; mark threshold for walker users.",
        },
      ],
      gateway_range_assessment: `Hallway is a strong midpoint for RF from ${gw}.`,
      coverage_score: 91,
      source: "mock",
    };
  }

  // living / default
  return {
    room_detected: "Living room",
    sensors: [
      {
        type: "gateway",
        placement_label: "Elevated media shelf / desk",
        rationale: `Central gateway in ${gw || "living room"}; keep clear of metal cabinets.`,
        coords: { x: 0.62, y: 0.35 },
        within_range: true,
        range_note: "Gateway origin.",
      },
      {
        type: "motion",
        placement_label: "Corner covering seating zone",
        rationale: "Routine activity + prolonged absence.",
        coords: { x: 0.22, y: 0.3 },
        within_range: true,
        range_note: "Same room as gateway.",
      },
      {
        type: "door_contact",
        placement_label: "Front entry",
        rationale: "Entry/exit events for care circle.",
        coords: { x: 0.12, y: 0.7 },
        within_range: true,
        range_note: "Short hop to gateway.",
      },
    ],
    fall_hazards: [
      {
        label: "Cord trip near seating",
        severity: "low",
        coords: { x: 0.55, y: 0.72 },
        mitigation: "Route power cords behind furniture.",
      },
    ],
    gateway_range_assessment: spotty
      ? `Living room gateway OK for RF; Wi-Fi is ${input.intake.wifiQuality} — stabilize LAN first.`
      : `Gateway placement in living room is preferred for ~${GATEWAY_RANGE_FT} ft coverage.`,
    coverage_score: 86,
    source: "mock",
  };
}

export function mockAggregatedPlan(
  intake: InstallIntake,
  visions: { room: string; result: RoomVisionResult }[]
): AggregatedInstallPlan {
  const placement_plan: PlacementRow[] = [];
  const fall_hazards: (VisionHazard & { room: string })[] = [];
  const counts = new Map<DeviceType, number>();

  for (const { room, result } of visions) {
    for (const s of result.sensors) {
      const type = normalizeDeviceType(s.type);
      placement_plan.push({
        room,
        type,
        placement: s.placement_label,
        within_range: s.within_range,
        reasoning: s.range_note || s.rationale,
      });
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    for (const h of result.fall_hazards) {
      fall_hazards.push({ ...h, room });
    }
  }

  if (!placement_plan.some((p) => p.type === "gateway")) {
    placement_plan.unshift({
      room: intake.gatewayLocation || "Living room",
      type: "gateway",
      placement: "Elevated central shelf",
      within_range: true,
      reasoning: `Gateway origin for ~${GATEWAY_RANGE_FT} ft radio.`,
    });
    counts.set("gateway", (counts.get("gateway") ?? 0) + 1);
  }

  const warnings = placement_plan
    .filter((p) => !p.within_range)
    .map((p) => `${p.room} · ${DEVICE_LABEL[p.type]}: ${p.reasoning}`);

  if (intake.wifiQuality === "spotty" || intake.wifiQuality === "none") {
    warnings.push(`Wi-Fi is ${intake.wifiQuality} — gateway online status may flap before sensors pair.`);
  }
  if (intake.construction === "concrete") {
    warnings.push("Concrete construction: expect stricter RF range; place gateway toward midpoint.");
  }
  if (intake.fallHistory || intake.mobilityAid !== "none") {
    warnings.push("Mobility / fall history: prioritize Bathroom Motion Sensor + Bed/Chair Presence.");
  }

  const hazard_summary = {
    high: fall_hazards.filter((h) => h.severity === "high").length,
    med: fall_hazards.filter((h) => h.severity === "med").length,
    low: fall_hazards.filter((h) => h.severity === "low").length,
    total: fall_hazards.length,
  };

  return {
    placement_plan,
    warnings,
    install_checklist: [
      "Confirm monitoring consent + alert recipients.",
      `Mount Gateway elevated at ${intake.gatewayLocation || "chosen room"}.`,
      "Power Gateway — wait solid green / Online.",
      "Pair each Motion, Door/Window Contact, Bed/Chair Presence, Bathroom Motion, Panic Button.",
      "Enroll Wearable (vitals + fall) and set overnight charge habit.",
      "Walk-test rooms; watch for out-of-range banners (~90 ft).",
      "Mitigate flagged fall hazards before go-live.",
    ],
    bill_of_materials: Array.from(counts.entries()).map(([type, count]) => ({ type, count })),
    fall_hazards,
    hazard_summary,
    source: "mock",
  };
}

export { ALLOWED as ALLOWED_DEVICE_COPY };
