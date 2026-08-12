export type VitalPoint = {
  timestamp: string;
  hourLabel: string;
  hr: number;
  spo2: number;
  activity: number;
};

export type WearableSeries = {
  customerId: string;
  residentLabel: string;
  points: VitalPoint[];
};

const DEMO_NOW = new Date("2026-08-11T21:00:00-05:00");

function series(
  customerId: string,
  residentLabel: string,
  hrBase: number,
  spo2Base: number
): WearableSeries {
  const points: VitalPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const t = new Date(DEMO_NOW);
    t.setHours(t.getHours() - i, 0, 0, 0);
    const n = Math.sin(i * 0.7 + customerId.length) * 0.5 + 0.5;
    const asleep = t.getHours() < 6 || t.getHours() >= 22;
    points.push({
      timestamp: t.toISOString(),
      hourLabel: t.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
      hr: Math.round(hrBase + (asleep ? -8 : 4) + n * 10),
      spo2: Math.round((spo2Base + (asleep ? -0.8 : 0) + n * 1.2) * 10) / 10,
      activity: Math.round(asleep ? 8 + n * 6 : 30 + n * 40),
    });
  }
  // Genuine excursion examples
  if (customerId === "cus-04") points[22].spo2 = 88;
  if (customerId === "cus-02") points[20].hr = 118;
  return { customerId, residentLabel, points };
}

export const wearableVitals: WearableSeries[] = [
  series("cus-01", "Mom · Reynolds", 72, 96),
  series("cus-02", "Dad · Okonkwo", 76, 95),
  series("cus-04", "Dad · Chen", 70, 96),
  series("cus-08", "Mom · Hale", 74, 97),
];

export function getVitals(customerId: string) {
  return wearableVitals.find((v) => v.customerId === customerId);
}
