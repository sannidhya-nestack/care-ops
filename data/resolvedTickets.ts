import type { PlaybookTopic } from "./playbooks";

export type ResolvedTicket = {
  id: string;
  subject: string;
  topic: PlaybookTopic;
  customerName: string;
  resolvedAt: string;
  resolutionNotes: string;
  keywords: string[];
};

export const resolvedTickets: ResolvedTicket[] = [
  {
    id: "res-001",
    subject: "Motion sensor amber — wouldn't pair",
    topic: "sensor_pairing",
    customerName: "A. Okonkwo",
    resolvedAt: "2026-08-08",
    resolutionNotes:
      "Removed half-added row, Add sensor → Motion, single press. Paired in ~2 min. Customer had reset without Add-sensor window.",
    keywords: ["pair", "amber", "motion", "reset"],
  },
  {
    id: "res-002",
    subject: "Hallway sensor out of range",
    topic: "gateway_range",
    customerName: "T. Morales",
    resolvedAt: "2026-08-07",
    resolutionNotes: "~95 ft through two walls. Moved gateway to hallway midpoint. Banner cleared in 6 min.",
    keywords: ["range", "90", "placement"],
  },
  {
    id: "res-003",
    subject: "Gateway offline after ISP outage",
    topic: "gateway_offline",
    customerName: "Facility admin",
    resolvedAt: "2026-08-06",
    resolutionNotes: "Unplug 30s insufficient; Wi-Fi rejoin on primary LAN fixed. No factory reset.",
    keywords: ["offline", "wifi", "rejoin"],
  },
  {
    id: "res-004",
    subject: "Wristband SpO2 dashboard stale",
    topic: "wearable_sync",
    customerName: "L. Chen",
    resolvedAt: "2026-08-05",
    resolutionNotes: "Bluetooth toggle restored sync. iOS Low Power Mode overnight was on.",
    keywords: ["wearable", "sync", "bluetooth"],
  },
  {
    id: "res-005",
    subject: "Charged $79 vs $49 renewal",
    topic: "billing",
    customerName: "M. Brooks",
    resolvedAt: "2026-08-04",
    resolutionNotes: "Wearable Insight promo auto-add. Billing credit next statement.",
    keywords: ["billing", "invoice", "promo"],
  },
  {
    id: "res-006",
    subject: "Too many 1–4am kitchen pings",
    topic: "notifications",
    customerName: "A. Nguyen",
    resolvedAt: "2026-08-03",
    resolutionNotes: "Quiet hours + raised nocturnal-bathroom threshold. Safety stayed on.",
    keywords: ["night", "notifications", "quiet"],
  },
  {
    id: "res-007",
    subject: "Bathroom combo stuck pairing 2.4.1",
    topic: "sensor_pairing",
    customerName: "G. Rossi",
    resolvedAt: "2026-08-02",
    resolutionNotes: "Remote pairing unlock; Add sensor succeeded.",
    keywords: ["pairing", "bathroom", "firmware"],
  },
  {
    id: "res-008",
    subject: "Porch door sensor dropping",
    topic: "gateway_range",
    customerName: "Partner dist",
    resolvedAt: "2026-07-30",
    resolutionNotes: "Installed approved extender. Stable 48h.",
    keywords: ["range", "extender", "door"],
  },
  {
    id: "res-009",
    subject: "Family worried about 5 nighttime alerts",
    topic: "notifications",
    customerName: "J. Hale",
    resolvedAt: "2026-07-29",
    resolutionNotes: "Explained routine alert types; Quiet hours + dwell minutes. Fall detection unchanged.",
    keywords: ["family", "night", "explain", "alerts"],
  },
  {
    id: "res-010",
    subject: "Cancel Wearable Insight",
    topic: "billing",
    customerName: "H. Kim",
    resolvedAt: "2026-07-28",
    resolutionNotes: "Cancelled next cycle; confirmed final charge date.",
    keywords: ["cancel", "add-on", "billing"],
  },
  {
    id: "res-011",
    subject: "GW solid red after outage",
    topic: "gateway_offline",
    customerName: "C. Delgado",
    resolvedAt: "2026-07-27",
    resolutionNotes: "Wi-Fi rejoin on correct SSID. Sent LED sequence card.",
    keywords: ["offline", "red", "power"],
  },
  {
    id: "res-012",
    subject: "Invite sister co-caregiver",
    topic: "notifications",
    customerName: "N. Brennan",
    resolvedAt: "2026-07-25",
    resolutionNotes: "Care circle invite view-only + daytime-only notifications.",
    keywords: ["invite", "caregiver", "notifications"],
  },
  {
    id: "res-013",
    subject: "Wearable clasp RMA",
    topic: "wearable_sync",
    customerName: "M. Park",
    resolvedAt: "2026-07-24",
    resolutionNotes: "Opened clasp RMA; Sync now worked while held near phone.",
    keywords: ["wearable", "rma", "sync"],
  },
  {
    id: "res-014",
    subject: "Facility VLAN blocked cloud",
    topic: "gateway_offline",
    customerName: "Elena V.",
    resolvedAt: "2026-07-20",
    resolutionNotes: "IT opened outbound 443 for gateway MAC.",
    keywords: ["offline", "facility", "vlan"],
  },
  {
    id: "res-015",
    subject: "Sleep-timing alerts every morning",
    topic: "notifications",
    customerName: "S. Whitfield",
    resolvedAt: "2026-07-18",
    resolutionNotes: "Widened sleep-timing ±45 min. Routine schedule alerts, not medical findings.",
    keywords: ["sleep", "timing", "alerts"],
  },
];
