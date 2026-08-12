export type PlaybookTopic =
  | "gateway_range"
  | "sensor_pairing"
  | "wearable_sync"
  | "gateway_offline"
  | "billing"
  | "notifications";

export type Playbook = {
  id: string;
  title: string;
  topic: PlaybookTopic;
  summary: string;
  steps: string[];
  keywords: string[];
};

export const playbooks: Playbook[] = [
  {
    id: "pb-gateway-range",
    title: "Gateway range & placement (~90 ft)",
    topic: "gateway_range",
    summary:
      "Indoor reliable range ~90 ft line-of-sight; walls cut it short. Out-of-range banners mean placement or extender — not firmware first.",
    steps: [
      "Confirm banner: out of range vs offline.",
      "Measure path gateway → sensor through walls.",
      "Move gateway toward midpoint of sensor cluster, elevated 3–5 ft.",
      "If layout locked: offer approved range extender — not consumer Wi-Fi extenders for sensor radio.",
      "Wait 5 min after move; Devices → Refresh.",
    ],
    keywords: ["range", "90", "placement", "extender", "out of range"],
  },
  {
    id: "pb-sensor-pairing",
    title: "Sensor pairing & reconnect",
    topic: "sensor_pairing",
    summary:
      "Needs healthy gateway (solid green), Devices → Add sensor, single button for blue blink.",
    steps: [
      "Gateway LED solid green + app Online.",
      "Remove half-added device row.",
      "Add sensor → correct type.",
      "Press once for blue blink.",
      "Still amber: 10s reset, wait 15s, retry; else remote pairing unlock.",
    ],
    keywords: ["pair", "pairing", "amber", "connect", "sensor"],
  },
  {
    id: "pb-wearable-sync",
    title: "Wearable not syncing",
    topic: "wearable_sync",
    summary: "Vitals sync phone Bluetooth → app → cloud. Stale dashboards are usually Bluetooth session, not clinical.",
    steps: [
      "Confirm band vibrates.",
      "Wearable → Sync now within 3 ft for 60s.",
      "Toggle Bluetooth; reopen app.",
      "App ≥ 4.2.0; firmware refresh if still stale.",
    ],
    keywords: ["wearable", "sync", "vitals", "bluetooth", "band"],
  },
  {
    id: "pb-gateway-offline",
    title: "Gateway offline / Wi-Fi recovery",
    topic: "gateway_offline",
    summary: "Power-cycle → wait amber→green. Rejoin Wi-Fi only if still red. Never factory-reset first.",
    steps: [
      "Confirm Wi-Fi on another device.",
      "Unplug 30s → plug in → wait 2 min.",
      "If solid red: rear button 5s Wi-Fi rejoin on primary LAN SSID.",
      "Still offline: gateway ID + LED photo → Connectivity.",
    ],
    keywords: ["offline", "wifi", "led", "power", "gateway"],
  },
  {
    id: "pb-billing",
    title: "Subscription & billing policy",
    topic: "billing",
    summary: "Unexpected renewal deltas are often add-ons. Reverse unauthorized upgrades via Billing — no cash promises on chat.",
    steps: [
      "Pull plan + add-ons + last invoice.",
      "Compare line items to stated plan.",
      "Unauthorized add: Billing adjustment.",
      "Cancel add-on: next cycle; confirm final charge date.",
    ],
    keywords: ["billing", "invoice", "subscription", "charge", "refund"],
  },
  {
    id: "pb-notifications",
    title: "Tuning notification frequency",
    topic: "notifications",
    summary:
      "Night volume is existing routine alerts (nocturnal-bathroom, prolonged-absence, room-dwell, sleep-timing). Tune Quiet hours; keep Safety on.",
    steps: [
      "Map alert types in History.",
      "Quiet hours 10pm–6am; Safety events ON.",
      "Raise nocturnal-bathroom threshold / grace.",
      "Widen prolonged-absence window; increase room-dwell minutes.",
      "Loosen sleep-timing ±45 min.",
    ],
    keywords: ["notification", "night", "quiet", "bathroom", "dwell", "sleep"],
  },
];

export function getPlaybook(id: string) {
  return playbooks.find((p) => p.id === id);
}
