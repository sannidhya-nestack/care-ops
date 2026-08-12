import type { DeviceType } from "./devices";

export type Sensor = {
  id: string;
  room: string;
  type: DeviceType;
  /** Approximate feet from gateway through walls */
  distanceFt: number;
};

export type Home = {
  id: string;
  label: string;
  customerId: string;
  addressHint: string;
  floors: number;
  rooms: string[];
  gatewayLocation: string;
  sensors: Sensor[];
};

/** ~90ft indoor reliable radio range (through walls reduces effective range). */
export const GATEWAY_RANGE_FT = 90;

export const homes: Home[] = [
  {
    id: "home-01",
    label: "Reynolds residence",
    customerId: "cus-01",
    addressHint: "2-bed apartment, mid-rise",
    floors: 1,
    rooms: ["Living room", "Kitchen", "Bedroom", "Bathroom", "Hallway"],
    gatewayLocation: "Living room media shelf",
    sensors: [
      { id: "s-01a", room: "Living room", type: "motion", distanceFt: 12 },
      { id: "s-01b", room: "Bedroom", type: "bed_chair_presence", distanceFt: 38 },
      { id: "s-01c", room: "Bathroom", type: "bathroom_motion", distanceFt: 42 },
      { id: "s-01d", room: "Hallway", type: "door_contact", distanceFt: 22 },
      { id: "s-01e", room: "Bedroom", type: "panic_button", distanceFt: 36 },
    ],
  },
  {
    id: "home-02",
    label: "Okonkwo home",
    customerId: "cus-02",
    addressHint: "Ranch house, long hallway",
    floors: 1,
    rooms: ["Living room", "Kitchen", "Hallway", "Back bedroom", "Bathroom", "Porch"],
    gatewayLocation: "Living room",
    sensors: [
      { id: "s-02a", room: "Living room", type: "motion", distanceFt: 8 },
      { id: "s-02b", room: "Back bedroom", type: "bed_chair_presence", distanceFt: 95 },
      { id: "s-02c", room: "Hallway", type: "motion", distanceFt: 55 },
      { id: "s-02d", room: "Porch", type: "door_contact", distanceFt: 72 },
      { id: "s-02e", room: "Bathroom", type: "bathroom_motion", distanceFt: 48 },
      { id: "s-02f", room: "Living room", type: "gateway", distanceFt: 0 },
    ],
  },
  {
    id: "home-03",
    label: "Maple Court — Unit 118",
    customerId: "cus-03",
    addressHint: "Assisted living suite",
    floors: 1,
    rooms: ["Sitting area", "Sleep alcove", "Bathroom", "Entry"],
    gatewayLocation: "Sitting area desk",
    sensors: [
      { id: "s-03a", room: "Sitting area", type: "motion", distanceFt: 6 },
      { id: "s-03b", room: "Sleep alcove", type: "bed_chair_presence", distanceFt: 18 },
      { id: "s-03c", room: "Bathroom", type: "bathroom_motion", distanceFt: 24 },
      { id: "s-03d", room: "Entry", type: "door_contact", distanceFt: 14 },
      { id: "s-03e", room: "Sitting area", type: "wearable", distanceFt: 4 },
    ],
  },
];

export function getHome(id: string) {
  return homes.find((h) => h.id === id);
}
