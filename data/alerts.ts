export type AlertType =
  | "nocturnal_bathroom"
  | "prolonged_absence"
  | "room_dwell"
  | "sleep_timing"
  | "fall_detected";

export type CareAlert = {
  id: string;
  homeId: string;
  customerId: string;
  type: AlertType;
  timestamp: string;
  title: string;
  detail: string;
  severity: "info" | "low" | "medium" | "high";
};

const DEMO_NOW = new Date("2026-08-11T21:15:00-05:00");

function hoursAgo(h: number, m = 0) {
  const d = new Date(DEMO_NOW);
  d.setHours(d.getHours() - h, d.getMinutes() - m, 0, 0);
  return d.toISOString();
}

export const alerts: CareAlert[] = [
  {
    id: "al-01",
    homeId: "home-01",
    customerId: "cus-01",
    type: "nocturnal_bathroom",
    timestamp: hoursAgo(0, 40),
    title: "Nocturnal bathroom activity",
    detail: "Kitchen/bath path motion 1:12am — routine water-sip pattern.",
    severity: "info",
  },
  {
    id: "al-02",
    homeId: "home-02",
    customerId: "cus-02",
    type: "prolonged_absence",
    timestamp: hoursAgo(2),
    title: "Prolonged absence",
    detail: "Back bedroom presence lost 95+ min past expected return window.",
    severity: "medium",
  },
  {
    id: "al-03",
    homeId: "home-01",
    customerId: "cus-01",
    type: "room_dwell",
    timestamp: hoursAgo(3, 20),
    title: "Room dwell",
    detail: "Living room dwell 70 min — TV/reading baseline.",
    severity: "info",
  },
  {
    id: "al-04",
    homeId: "home-03",
    customerId: "cus-03",
    type: "sleep_timing",
    timestamp: hoursAgo(8),
    title: "Sleep timing",
    detail: "Wake 45 min earlier than configured sleep band.",
    severity: "low",
  },
  {
    id: "al-05",
    homeId: "home-02",
    customerId: "cus-02",
    type: "fall_detected",
    timestamp: hoursAgo(0, 15),
    title: "Fall alert (unconfirmed)",
    detail: "Living room impact signature — needs human verify.",
    severity: "high",
  },
  {
    id: "al-06",
    homeId: "home-01",
    customerId: "cus-06",
    type: "nocturnal_bathroom",
    timestamp: hoursAgo(5),
    title: "Nighttime alerts cluster",
    detail: "Five nocturnal-bathroom pings 1–4am — tune Quiet hours.",
    severity: "low",
  },
];

export function getAlertsForCustomer(customerId: string) {
  return alerts.filter((a) => a.customerId === customerId);
}
