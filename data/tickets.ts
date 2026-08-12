import type { TicketCategory } from "./teams";

export type Channel = "email" | "app" | "phone-note";

export type Ticket = {
  id: string;
  subject: string;
  rawText: string;
  channel: Channel;
  timestamp: string;
  customerId: string;
  customerName: string;
  account: string;
  trueCategory: TicketCategory;
  sensitive?: boolean;
};

const DEMO_NOW = new Date("2026-08-11T21:20:00-05:00");

function hoursAgo(h: number, minutes = 0) {
  const d = new Date(DEMO_NOW);
  d.setHours(d.getHours() - h, d.getMinutes() - minutes, 0, 0);
  return d.toISOString();
}

export const tickets: Ticket[] = [
  {
    id: "tkt-001",
    subject: "Bedroom motion sensor won't pair",
    rawText:
      "Gateway shows green but bedroom motion stays amber. Held reset 10s twice. Serial ends …A4F2. Need pairing walkthrough.",
    channel: "email",
    timestamp: hoursAgo(0, 25),
    customerId: "cus-01",
    customerName: "Priya Reynolds",
    account: "ACCT-88421",
    trueCategory: "sensor_pairing",
  },
  {
    id: "tkt-002",
    subject: "Gateway out of range — hallway sensor dropping",
    rawText:
      "Hallway presence keeps going offline. Gateway in living room; sensor near back bedroom ~95 ft through two walls. Banner: Gateway out of range (>90 ft).",
    channel: "app",
    timestamp: hoursAgo(0, 55),
    customerId: "cus-02",
    customerName: "Daniel Okonkwo",
    account: "ACCT-77102",
    trueCategory: "gateway_range",
  },
  {
    id: "tkt-003",
    subject: "Gateway offline after Wi-Fi drop",
    rawText:
      "Facility suite gateway GW-118 offline after ISP blip. Wi-Fi restored; last-seen 3h ago. Power-cycled once.",
    channel: "email",
    timestamp: hoursAgo(1, 10),
    customerId: "cus-03",
    customerName: "Elena Vasquez",
    account: "ACCT-FAC-220",
    trueCategory: "gateway_offline",
  },
  {
    id: "tkt-004",
    subject: "Wearable not syncing heart rate / SpO2",
    rawText:
      "Wristband charged; dashboard stale since yesterday 6pm. Band vibrates. Bluetooth connected. App 4.2.1.",
    channel: "app",
    timestamp: hoursAgo(1, 40),
    customerId: "cus-04",
    customerName: "Lisa Chen",
    account: "ACCT-55918",
    trueCategory: "wearable_sync",
  },
  {
    id: "tkt-005",
    subject: "Unexpected charge on renewal",
    rawText:
      "Billed $79 instead of $49 on Aug 1 for ACCT-44120. Never upgraded. Invoice INV-30991.",
    channel: "email",
    timestamp: hoursAgo(2, 5),
    customerId: "cus-05",
    customerName: "Marcus Brooks",
    account: "ACCT-44120",
    trueCategory: "subscription_billing",
  },
  {
    id: "tkt-006",
    subject: "Too many nighttime notifications",
    rawText:
      "App pings 1–4am for kitchen motion when Mom gets water. How do I quiet nights without turning off fall detection?",
    channel: "app",
    timestamp: hoursAgo(2, 45),
    customerId: "cus-06",
    customerName: "Amy Nguyen",
    account: "ACCT-66301",
    trueCategory: "app_howto",
  },
  {
    id: "tkt-007",
    subject: "RMA — cracked door sensor housing",
    rawText:
      "Door sensor DS-772 arrived cracked. Powers on but adhesive won't seat. Request RMA under 30-day warranty.",
    channel: "email",
    timestamp: hoursAgo(3, 20),
    customerId: "cus-07",
    customerName: "Ravi Patel",
    account: "ACCT-DIST-88",
    trueCategory: "hardware_rma",
  },
  {
    id: "tkt-008",
    subject: "I'm scared — Mom fell and I can't reach her",
    rawText:
      "Fall alert just fired for Mom's living room and she's not answering. I'm 40 minutes away. Should I call 911? Please call me.",
    channel: "app",
    timestamp: hoursAgo(0, 12),
    customerId: "cus-08",
    customerName: "Jordan Hale",
    account: "ACCT-91204",
    trueCategory: "family_distress",
    sensitive: true,
  },
  {
    id: "tkt-009",
    subject: "Dad wandered — we need help tonight",
    rawText:
      "Door sensor exit at 8:40pm and he isn't back. Dementia on file. Need a human to talk through presence logs. No chatbot.",
    channel: "phone-note",
    timestamp: hoursAgo(0, 40),
    customerId: "cus-02",
    customerName: "Daniel Okonkwo",
    account: "ACCT-77102",
    trueCategory: "family_distress",
    sensitive: true,
  },
  {
    id: "tkt-010",
    subject: "Bathroom sensor stuck in pairing mode",
    rawText:
      "Bathroom Motion Sensor won't leave pairing after firmware 2.4.1. Other sensors fine.",
    channel: "email",
    timestamp: hoursAgo(4, 15),
    customerId: "cus-01",
    customerName: "Priya Reynolds",
    account: "ACCT-88421",
    trueCategory: "sensor_pairing",
  },
  {
    id: "tkt-011",
    subject: "Cancel wearable add-on",
    rawText:
      "Cancel Wearable Insight add-on next cycle. Keep Home Plus sensors. Confirm final charge date.",
    channel: "email",
    timestamp: hoursAgo(5),
    customerId: "cus-04",
    customerName: "Lisa Chen",
    account: "ACCT-55918",
    trueCategory: "subscription_billing",
  },
  {
    id: "tkt-012",
    subject: "Gateway LED red after power outage",
    rawText:
      "Power out 20 min. Gateway solid red; app Offline. SSID unchanged. Need recovery checklist for GW-441.",
    channel: "phone-note",
    timestamp: hoursAgo(6, 30),
    customerId: "cus-05",
    customerName: "Marcus Brooks",
    account: "ACCT-44120",
    trueCategory: "gateway_offline",
  },
  {
    id: "tkt-013",
    subject: "How to invite a second caregiver",
    rawText:
      "Add sister as co-caregiver view-only. Can I limit her to daytime notifications?",
    channel: "app",
    timestamp: hoursAgo(8, 10),
    customerId: "cus-06",
    customerName: "Amy Nguyen",
    account: "ACCT-66301",
    trueCategory: "app_howto",
  },
  {
    id: "tkt-014",
    subject: "Wristband clasp broken — need replacement",
    rawText:
      "Silicone clasp on WB-309 snapped. Still syncs near phone. Warranty from March 2026. Open RMA for clasp kit.",
    channel: "email",
    timestamp: hoursAgo(10),
    customerId: "cus-07",
    customerName: "Ravi Patel",
    account: "ACCT-DIST-88",
    trueCategory: "hardware_rma",
  },
];

export function getTicket(id: string) {
  return tickets.find((t) => t.id === id);
}

export function getOpenTickets() {
  return [...tickets].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
