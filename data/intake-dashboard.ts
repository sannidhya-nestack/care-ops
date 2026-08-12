export const intakeKpis = [
  {
    id: "urgent",
    title: "Urgent escalations",
    value: "18",
    delta: "+6 vs expected by noon",
    deltaTone: "red" as const,
    footer: "Model expects 24 urgent cases by end of day.",
    icon: "alert" as const,
  },
  {
    id: "summaries",
    title: "AI-ready summaries",
    value: "226",
    delta: "+14% from 7-day avg",
    deltaTone: "green" as const,
    footer: "226 summaries are ready for staff with SOAP-style fields.",
    icon: "file" as const,
  },
  {
    id: "missing",
    title: "Missing-info cases",
    value: "42",
    delta: "13.5% of volume",
    deltaTone: "orange" as const,
    footer: "42 intakes need one or more clarifying answers.",
    icon: "help" as const,
  },
  {
    id: "median",
    title: "Median triage time",
    value: "6.8m",
    delta: "2.4 min faster today",
    deltaTone: "blue" as const,
    footer: "Median predicted time from first message to routed summary.",
    icon: "clock" as const,
  },
];

export const arrivalSeries = [
  { time: "7 AM", actual: 24, forecast: 22 },
  { time: "8 AM", actual: 27, forecast: 28 },
  { time: "9 AM", actual: 43, forecast: 40 },
  { time: "10 AM", actual: 46, forecast: 44 },
  { time: "11 AM", actual: 39, forecast: 42 },
  { time: "12 PM", actual: 24, forecast: 30 },
  { time: "1 PM", actual: 28, forecast: 32 },
  { time: "2 PM", actual: 45, forecast: 41 },
  { time: "3 PM", actual: 54, forecast: 48 },
  { time: "4 PM", actual: 58, forecast: 52 },
  { time: "5 PM", actual: 59, forecast: 55 },
  { time: "6 PM", actual: 60, forecast: 57 },
];

export const PREDICTED_TOTAL = 438;

export const workflowSteps = [
  { label: "Received", count: 312, color: "#93c5fd" },
  { label: "Identity/demographics verified", count: 312, color: "#60a5fa" },
  { label: "Symptom history complete", count: 270, color: "#3b82f6" },
  { label: "Missing-information follow-up", count: 42, color: "#fbbf24" },
  { label: "AI structured summary ready", count: 226, color: "#4ade80" },
  { label: "Staff review needed", count: 26, color: "#a78bfa" },
  { label: "Urgent escalation", count: 18, color: "#f87171" },
];

export const modelConfidence = [
  { label: "Routine", value: 93, tone: "blue" as const, icon: "user" as const },
  { label: "Same-day", value: 88, tone: "green" as const, icon: "calendar" as const },
  { label: "Urgent", value: 91, tone: "red" as const, icon: "alert" as const },
  { label: "Emergency-risk", value: 84, tone: "purple" as const, icon: "plus" as const },
];

/** Table order matches reference screenshot */
export const bodySystems = [
  {
    name: "Respiratory",
    total: 92,
    pct: 29,
    sameDay: 36,
    urgent: 4,
    emergency: 2,
    redFlag: "Shortness of breath: 15",
    color: "#3b82f6",
  },
  {
    name: "GI/abdominal",
    total: 71,
    pct: 23,
    sameDay: 22,
    urgent: 2,
    emergency: 1,
    redFlag: "—",
    color: "#22c55e",
  },
  {
    name: "Cardiac/chest",
    total: 27,
    pct: 9,
    sameDay: 8,
    urgent: 3,
    emergency: 1,
    redFlag: "Chest pain: 10",
    color: "#f97316",
  },
  {
    name: "Neurologic",
    total: 27,
    pct: 9,
    sameDay: 10,
    urgent: 1,
    emergency: 1,
    redFlag: "Severe headache: 7",
    color: "#a855f7",
  },
  {
    name: "Medication/refill",
    total: 60,
    pct: 19,
    sameDay: 16,
    urgent: 1,
    emergency: 0,
    redFlag: "—",
    color: "#14b8a6",
  },
  {
    name: "Administrative/eligibility",
    total: 35,
    pct: 11,
    sameDay: 31,
    urgent: 3,
    emergency: 0,
    redFlag: "—",
    color: "#f472b6",
  },
];

export const missingInfoRows = [
  {
    rank: 1,
    info: "Symptom onset missing",
    cases: 12,
    risk: 82,
    forecast: 76,
  },
  {
    rank: 2,
    info: "Current medications missing",
    cases: 9,
    risk: 74,
    forecast: 68,
  },
  {
    rank: 3,
    info: "Prior condition history missing",
    cases: 7,
    risk: 69,
    forecast: 64,
  },
  {
    rank: 4,
    info: "Insurance/eligibility unclear",
    cases: 6,
    risk: 61,
    forecast: 81,
  },
  {
    rank: 5,
    info: "Preferred contact method missing",
    cases: 8,
    risk: 36,
    forecast: 89,
  },
];

export const routingForecast = [
  { route: "Nurse triage", value: 34, band: 9, color: "#3b82f6" },
  { route: "Front-desk administration", value: 29, band: 8, color: "#22c55e" },
  { route: "Primary care review", value: 24, band: 7, color: "#a855f7" },
  { route: "Billing/eligibility", value: 12, band: 4, color: "#f97316" },
  { route: "Prescription support", value: 19, band: 6, color: "#14b8a6" },
  { route: "Urgent escalation", value: 8, band: 3, color: "#ef4444" },
];

export const briefingBullets = [
  "Respiratory and chest-related intakes are above expected volumes.",
  "Please prioritize same-day capacity and rapid symptom clarification.",
  "Missing information follow-ups can reduce overall handling time.",
];
