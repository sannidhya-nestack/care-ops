import type { DeviceType } from "@/data/devices";

export type MobilityAid = "none" | "cane" | "walker" | "wheelchair";
export type CognitiveStatus = "none" | "mild" | "dementia";
export type DwellingType = "apartment" | "single-story" | "multi-story";
export type WifiQuality = "good" | "spotty" | "none";
export type Construction = "drywall" | "plaster" | "concrete";
export type CameraPreference = "no-camera" | "optional";

export type RoomSlot = {
  id: string;
  name: string;
  /** public path or data URL */
  imageSrc: string | null;
  sampleKey?: "living-room" | "bedroom" | "bathroom" | "hallway";
};

export type InstallIntake = {
  age: number;
  livesAlone: boolean;
  mobilityAid: MobilityAid;
  fallHistory: boolean;
  fallNotes: string;
  cognitiveStatus: CognitiveStatus;
  nighttimeBathroom: string;
  sleepWindow: string;
  pets: boolean;
  petType: string;
  dwellingType: DwellingType;
  floors: number;
  approxSqft: number;
  wifiQuality: WifiQuality;
  gatewayLocation: string;
  construction: Construction;
  rooms: RoomSlot[];
  monitoringConsent: boolean;
  alertRecipients: string[];
  cameraPreference: CameraPreference;
  dataSharingScope: string;
};

export type Coords = { x: number; y: number };

export type LoggedIncident = {
  id: string;
  room: string;
  coords: Coords;
  date: string;
  type: string;
  note: string;
  vitalHeartRate?: number;
};

export type IncidentCausalAnalysis = {
  incident_id: string;
  likely_causes: {
    factor: string;
    explanation: string;
    confidence: number;
  }[];
  contributing_environment: string[];
  severity: "low" | "med" | "high";
  recommended_environmental_adjustments: string[];
  source?: "live" | "mock";
};

export type RiskZone = {
  id: string;
  label: string;
  room: string;
  centroid_coords: Coords;
  radius: number;
  incident_count: number;
  dominant_factors: string[];
  risk_level: "high" | "medium" | "low";
};

export type UnsafeRoute = {
  from_room: string;
  to_room: string;
  note: string;
};

export type RiskZoneAggregation = {
  zones: RiskZone[];
  unsafe_routes: UnsafeRoute[];
  source?: "live" | "mock";
};

export type CoverageGap = {
  id: string;
  title: string;
  type: "uncovered_route" | "uncovered_risk_zone" | "gateway_distance";
  severity: "high" | "med" | "low";
  recommendation: string;
};

export const DEFAULT_LOGGED_INCIDENTS: LoggedIncident[] = [
  {
    id: "inc-01",
    room: "Living room",
    coords: { x: 0.28, y: 0.52 },
    date: "2026-08-01 14:15",
    type: "Unsteady Rise & Slip",
    note: "Loss of footing while standing up from low sofa",
    vitalHeartRate: 98,
  },
  {
    id: "inc-02",
    room: "Bedroom",
    coords: { x: 0.32, y: 0.70 },
    date: "2026-08-03 02:40",
    type: "Nighttime Stumble",
    note: "Tripped on loose rug threshold near bed edge during night bathroom transition",
    vitalHeartRate: 106,
  },
  {
    id: "inc-03",
    room: "Bathroom",
    coords: { x: 0.72, y: 0.38 },
    date: "2026-08-07 07:10",
    type: "Slippery Surface Incident",
    note: "Slid near wet shower threshold tile",
    vitalHeartRate: 102,
  },
  {
    id: "inc-04",
    room: "Hallway",
    coords: { x: 0.48, y: 0.45 },
    date: "2026-08-10 23:15",
    type: "Unsteady Stumble",
    note: "Loss of balance along dim hallway on Bedroom ↔ Bathroom route",
    vitalHeartRate: 94,
  },
];

export type VisionSensorPin = {
  type: DeviceType;
  placement_label: string;
  rationale: string;
  coords: Coords;
  within_range: boolean;
  range_note: string;
};

export type VisionHazard = {
  label: string;
  severity: "low" | "med" | "high";
  coords: Coords;
  mitigation: string;
};

export type RoomVisionResult = {
  room_detected: string;
  sensors: VisionSensorPin[];
  fall_hazards: VisionHazard[];
  gateway_range_assessment: string;
  coverage_score: number;
  source: "live" | "mock";
};

export type PlacementRow = {
  room: string;
  type: DeviceType;
  placement: string;
  within_range: boolean;
  reasoning: string;
};

export type AggregatedInstallPlan = {
  placement_plan: PlacementRow[];
  warnings: string[];
  install_checklist: string[];
  bill_of_materials: { type: DeviceType; count: number }[];
  fall_hazards: (VisionHazard & { room: string })[];
  hazard_summary: { high: number; med: number; low: number; total: number };
  source: "live" | "mock";
};

export const SAMPLE_HOME = [
  {
    id: "room-lr",
    name: "Living room",
    sampleKey: "living-room" as const,
    imageSrc: "/sample-home/living-room.png",
  },
  {
    id: "room-br",
    name: "Bedroom",
    sampleKey: "bedroom" as const,
    imageSrc: "/sample-home/bedroom.png",
  },
  {
    id: "room-ba",
    name: "Bathroom",
    sampleKey: "bathroom" as const,
    imageSrc: "/sample-home/bathroom.png",
  },
  {
    id: "room-hw",
    name: "Hallway",
    sampleKey: "hallway" as const,
    imageSrc: "/sample-home/hallway.png",
  },
];

export function emptyIntake(): InstallIntake {
  return {
    age: 78,
    livesAlone: true,
    mobilityAid: "none",
    fallHistory: false,
    fallNotes: "",
    cognitiveStatus: "none",
    nighttimeBathroom: "1–2×",
    sleepWindow: "10:00pm – 6:30am",
    pets: false,
    petType: "",
    dwellingType: "single-story",
    floors: 1,
    approxSqft: 1400,
    wifiQuality: "good",
    gatewayLocation: "",
    construction: "drywall",
    rooms: [],
    monitoringConsent: false,
    alertRecipients: [],
    cameraPreference: "no-camera",
    dataSharingScope: "Care circle only",
  };
}

export function intakeContextBlob(intake: InstallIntake): string {
  return JSON.stringify(
    {
      age: intake.age,
      livesAlone: intake.livesAlone,
      mobilityAid: intake.mobilityAid,
      fallHistory: intake.fallHistory,
      fallNotes: intake.fallNotes,
      cognitiveStatus: intake.cognitiveStatus,
      nighttimeBathroom: intake.nighttimeBathroom,
      sleepWindow: intake.sleepWindow,
      pets: intake.pets,
      petType: intake.petType,
      dwellingType: intake.dwellingType,
      floors: intake.floors,
      approxSqft: intake.approxSqft,
      wifiQuality: intake.wifiQuality,
      gatewayLocation: intake.gatewayLocation,
      construction: intake.construction,
      rooms: intake.rooms.map((r) => r.name),
      cameraPreference: intake.cameraPreference,
      dataSharingScope: intake.dataSharingScope,
      monitoringConsent: intake.monitoringConsent,
      alertRecipients: intake.alertRecipients,
    },
    null,
    0
  );
}

export function computeCoverageGaps(
  planPlacement: PlacementRow[],
  riskZones: RiskZone[],
  rooms: RoomSlot[]
): CoverageGap[] {
  const gaps: CoverageGap[] = [];

  const hasBedPresence = planPlacement.some((p) => p.type === "bed_chair_presence");
  const hasBathMotion = planPlacement.some((p) => p.type === "bathroom_motion");
  const hasHallMotion = planPlacement.some(
    (p) => /hall/i.test(p.room) && (p.type === "motion" || p.type === "gateway")
  );

  if (!hasBedPresence || !hasBathMotion || !hasHallMotion) {
    gaps.push({
      id: "gap-route-bed-bath",
      title: "Uncovered Nighttime Route (Bedroom ↔ Bathroom)",
      type: "uncovered_route",
      severity: "high",
      recommendation:
        "High transit volume detected. Recommend pairing Bed/Chair Presence Sensor with Bathroom Motion Sensor and Hallway Motion coverage.",
    });
  }

  for (const zone of riskZones) {
    const zoneCovered = planPlacement.some(
      (p) => p.room.toLowerCase() === zone.room.toLowerCase()
    );
    if (!zoneCovered) {
      gaps.push({
        id: `gap-zone-${zone.id}`,
        title: `Uncovered Flagged Area: ${zone.label}`,
        type: "uncovered_risk_zone",
        severity: zone.risk_level === "high" ? "high" : "med",
        recommendation: `Add a sensor placement in ${zone.room} near centroid to cover repeat incident pattern.`,
      });
    }
  }

  const outOfRangeCount = planPlacement.filter((p) => !p.within_range).length;
  if (outOfRangeCount > 0) {
    gaps.push({
      id: "gap-gateway-distance",
      title: `${outOfRangeCount} Device Pin(s) Exceed Gateway ~90ft Range Limit`,
      type: "gateway_distance",
      severity: "med",
      recommendation:
        "Relocate Gateway to central hallway or add approved signal extender.",
    });
  }

  return gaps;
}
