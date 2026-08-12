import { DEVICE_LABEL, type DeviceType } from "@/data/devices";

export type ResidentContext = {
  id: string;
  name: string;
  age: number;
  room: string;
  account: string;
  primaryContact: string;
  contactEmail: string;
  language: string;
  baselineRoutine: string;
  recentEvents: string[];
  devices: {
    type: DeviceType;
    lastCommAgo: string;
    status: "online" | "warning" | "offline";
    serial: string;
  }[];
};

export type DeviceEvent = {
  id: string;
  channel: "device-event";
  eventType: "fall_detected" | "sensor_offline" | "presence_no_motion" | "panic_button" | "wearable_vitals";
  residentId: string;
  residentName: string;
  deviceType: DeviceType;
  immobilityDurationMins?: number;
  heartRate?: number;
  spo2?: number;
  rawText: string;
  arrivedAt: number;
};

export const RESIDENTS_SEED: ResidentContext[] = [
  {
    id: "cus-01",
    name: "Priya Reynolds (Mom)",
    age: 82,
    room: "Living room & Bedroom",
    account: "ACCT-88421",
    primaryContact: "Priya Reynolds (Daughter)",
    contactEmail: "priya.r@example.com",
    language: "English",
    baselineRoutine: "Awake 6:30am, afternoon rest 1:00-2:00pm, sleep 10:00pm. Baseline HR 72 bpm.",
    recentEvents: [
      "Bed/Chair presence sensor unseated 2d ago",
      "Bathroom motion active 4x overnight",
    ],
    devices: [
      { type: "gateway", lastCommAgo: "2m ago", status: "online", serial: "GW-8842" },
      { type: "bed_chair_presence", lastCommAgo: "45m ago", status: "warning", serial: "BC-1092" },
      { type: "wearable", lastCommAgo: "1m ago", status: "online", serial: "WB-9901" },
      { type: "bathroom_motion", lastCommAgo: "3h ago", status: "online", serial: "BM-4410" },
    ],
  },
  {
    id: "cus-02",
    name: "Dad Okonkwo",
    age: 79,
    room: "Bedroom Suite 104",
    account: "ACCT-77102",
    primaryContact: "Daniel Okonkwo (Son)",
    contactEmail: "daniel.o@example.com",
    language: "English",
    baselineRoutine: "Early riser 5:30am, moderate mobility aid, nighttime wander risk.",
    recentEvents: [
      "Exit Door Contact triggered 8:40pm",
      "Gateway signal out-of-range banner 3x this month",
    ],
    devices: [
      { type: "gateway", lastCommAgo: "5m ago", status: "online", serial: "GW-7710" },
      { type: "door_contact", lastCommAgo: "14h ago", status: "warning", serial: "DC-3301" },
      { type: "motion", lastCommAgo: "95ft signal (weak)", status: "warning", serial: "MS-8812" },
      { type: "panic_button", lastCommAgo: "12d ago", status: "online", serial: "PB-0012" },
    ],
  },
  {
    id: "cus-04",
    name: "Lisa Chen (Dad)",
    age: 85,
    room: "Bedroom & Bath",
    account: "ACCT-55918",
    primaryContact: "Lisa Chen (Daughter)",
    contactEmail: "lisa.c@example.com",
    language: "Mandarin / English",
    baselineRoutine: "Sleep 9:30pm - 6:00am, daytime sedentary rest 2:00-4:00pm. Baseline HR 70 bpm.",
    recentEvents: [
      "Wearable SpO2 dips (88%) logged yesterday",
      "Panic button battery check passed 5d ago",
    ],
    devices: [
      { type: "wearable", lastCommAgo: "1m ago", status: "online", serial: "WB-5591" },
      { type: "bed_chair_presence", lastCommAgo: "10m ago", status: "online", serial: "BC-5592" },
      { type: "bathroom_motion", lastCommAgo: "1h ago", status: "online", serial: "BM-5593" },
    ],
  },
];

export const STRUCTURED_EVENTS_FEED: Omit<DeviceEvent, "id" | "arrivedAt">[] = [
  {
    channel: "device-event",
    eventType: "presence_no_motion",
    residentId: "cus-01",
    residentName: "Priya Reynolds (Mom)",
    deviceType: "bed_chair_presence",
    immobilityDurationMins: 45,
    heartRate: 118,
    spo2: 94,
    rawText: "Platform Event: Bed/Chair Presence Sensor immobility 45m (Daytime) | Wearable HR: 118 bpm (Elevated)",
  },
  {
    channel: "device-event",
    eventType: "fall_detected",
    residentId: "cus-04",
    residentName: "Lisa Chen (Dad)",
    deviceType: "wearable",
    heartRate: 104,
    spo2: 95,
    rawText: "Platform Event: Wearable Impact & Fall Detected in Bedroom | HR: 104 bpm",
  },
  {
    channel: "device-event",
    eventType: "sensor_offline",
    residentId: "cus-02",
    residentName: "Dad Okonkwo",
    deviceType: "door_contact",
    rawText: "Platform Event: Exit Door Contact Sensor offline for 14h (Last comm: 14h ago)",
  },
  {
    channel: "device-event",
    eventType: "panic_button",
    residentId: "cus-04",
    residentName: "Lisa Chen (Dad)",
    deviceType: "panic_button",
    heartRate: 112,
    rawText: "Platform Event: Resident Panic Button Pressed in Bathroom | HR: 112 bpm",
  },
];

export function enrichContext(textOrId: string) {
  const t = textOrId.toLowerCase();
  const resident =
    RESIDENTS_SEED.find(
      (r) =>
        t.includes(r.id.toLowerCase()) ||
        t.includes(r.account.toLowerCase()) ||
        t.includes(r.name.toLowerCase().split(" ")[0]!)
    ) || RESIDENTS_SEED[0]!;

  let deviceType: DeviceType = "bed_chair_presence";
  if (/wearable|vital|band|hr/.test(t)) deviceType = "wearable";
  else if (/panic/.test(t)) deviceType = "panic_button";
  else if (/bath/.test(t)) deviceType = "bathroom_motion";
  else if (/door|contact|exit/.test(t)) deviceType = "door_contact";
  else if (/gateway|gw-/.test(t)) deviceType = "gateway";
  else if (/motion/.test(t)) deviceType = "motion";

  const devInfo = resident.devices.find((d) => d.type === deviceType) || {
    type: deviceType,
    lastCommAgo: "14h ago",
    status: "warning" as const,
    serial: `${deviceType.slice(0, 2).toUpperCase()}-9901`,
  };

  return {
    resident,
    device: devInfo,
    historySummary: `${resident.name} (${resident.account}) · ${DEVICE_LABEL[devInfo.type]} (${devInfo.serial}) last comm ${devInfo.lastCommAgo} · ${resident.recentEvents[0]}`,
  };
}
