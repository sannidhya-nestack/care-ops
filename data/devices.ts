/** Allowed CareOps device taxonomy — nowhere else. */
export const DEVICE_TYPES = [
  "gateway",
  "motion",
  "door_contact",
  "bed_chair_presence",
  "bathroom_motion",
  "panic_button",
  "wearable",
] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];

export const DEVICE_LABEL: Record<DeviceType, string> = {
  gateway: "Gateway",
  motion: "Motion Sensor",
  door_contact: "Door/Window Contact Sensor",
  bed_chair_presence: "Bed/Chair Presence Sensor",
  bathroom_motion: "Bathroom Motion Sensor",
  panic_button: "Panic Button",
  wearable: "Wearable (vitals + fall)",
};

export function isDeviceType(v: string): v is DeviceType {
  return (DEVICE_TYPES as readonly string[]).includes(v);
}

export function normalizeDeviceType(raw: string): DeviceType {
  const s = raw.toLowerCase().trim();
  if (isDeviceType(s)) return s;
  if (/gateway|hub/.test(s)) return "gateway";
  if (/bath/.test(s)) return "bathroom_motion";
  if (/door|window|contact/.test(s)) return "door_contact";
  if (/bed|chair|presence/.test(s)) return "bed_chair_presence";
  if (/panic|pendant|button/.test(s)) return "panic_button";
  if (/wear|vital|fall band|band/.test(s)) return "wearable";
  if (/motion/.test(s)) return "motion";
  return "motion";
}
