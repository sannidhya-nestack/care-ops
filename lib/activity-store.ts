/** Client session activity — dashboard aggregates live module work. */

export type ActivityKind =
  | "triage"
  | "copilot"
  | "family"
  | "guardian"
  | "install";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  label: string;
  at: number;
  meta?: Record<string, number | string | boolean>;
};

export type ActivityStats = {
  ticketsTriaged: number;
  avgConfidence: number;
  draftsWritten: number;
  phiRisksCaught: number;
  events: ActivityEvent[];
};

const KEY = "careops-activity-v1";

function empty(): ActivityStats {
  return {
    ticketsTriaged: 0,
    avgConfidence: 0,
    draftsWritten: 0,
    phiRisksCaught: 0,
    events: [],
  };
}

export function readActivity(): ActivityStats {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) } as ActivityStats;
  } catch {
    return empty();
  }
}

export function writeActivity(stats: ActivityStats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(stats));
  window.dispatchEvent(new Event("careops-activity"));
}

export function pushActivity(
  kind: ActivityKind,
  label: string,
  meta?: ActivityEvent["meta"]
) {
  const cur = readActivity();
  const ev: ActivityEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    label,
    at: Date.now(),
    meta,
  };
  cur.events = [ev, ...cur.events].slice(0, 40);

  if (kind === "triage" && typeof meta?.confidence === "number") {
    const n = cur.ticketsTriaged + 1;
    cur.avgConfidence = Math.round(
      (cur.avgConfidence * cur.ticketsTriaged + meta.confidence) / n
    );
    cur.ticketsTriaged = n;
  }
  if (kind === "family") cur.draftsWritten += 1;
  if (kind === "guardian" && typeof meta?.findings === "number") {
    cur.phiRisksCaught += meta.findings;
  }

  writeActivity(cur);
  return cur;
}
