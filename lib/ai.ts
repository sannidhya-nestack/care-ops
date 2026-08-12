import OpenAI from "openai";
import type { Ticket } from "@/data/tickets";
import { CATEGORY_TEAM, getTeam, type TicketCategory, type TeamId } from "@/data/teams";
import { GATEWAY_RANGE_FT } from "@/data/homes";
import { AI_MODEL } from "@/lib/ai-config";
import {
  mockInstallChat,
  mockInstallPlan,
  mockTriage,
  type InstallPlan,
  type TriageResult,
} from "@/lib/ai-mock";

export type { TriageResult, InstallPlan, Priority, PlacementItem } from "@/lib/ai-mock";
export { mockTriage, mockInstallPlan, mockInstallChat };

const CATEGORIES: TicketCategory[] = [
  "sensor_pairing",
  "gateway_range",
  "gateway_offline",
  "wearable_sync",
  "subscription_billing",
  "app_howto",
  "hardware_rma",
  "family_distress",
];

function client() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function parseJson<T>(text: string): T | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** SERVER ONLY — OpenAI Chat Completions with structured JSON; mock on miss/fail. */
export async function triageTicket(ticket: Ticket): Promise<TriageResult> {
  const fallback = mockTriage(ticket);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] triage — no OPENAI_API_KEY");
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are CareOps AI support triage for a connected-care product (sensors, gateway, wearables). Never name real competitor companies. Family-distress MUST use category family_distress. Return JSON only: {category, priority, confidence, one_line_summary, suggested_first_reply}. category one of: ${CATEGORIES.join(", ")}. priority: high|medium|low. confidence 0-100.`,
        },
        {
          role: "user",
          content: `Ticket ${ticket.id} (${ticket.channel}) from ${ticket.customerName} ${ticket.account}\nSubject: ${ticket.subject}\n${ticket.rawText}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const raw = parseJson<Record<string, unknown>>(text);
    if (!raw) {
      console.log("[AI:mock] triage — parse fail");
      return fallback;
    }

    let category = String(raw.category ?? "") as TicketCategory;
    if (!CATEGORIES.includes(category)) category = fallback.category;
    if (ticket.sensitive) category = "family_distress";

    const teamId: TeamId =
      category === "family_distress" ? "care-family" : CATEGORY_TEAM[category];
    const team = getTeam(teamId);
    const priorityRaw = String(raw.priority ?? "medium");
    const priority = (["high", "medium", "low"].includes(priorityRaw)
      ? priorityRaw
      : "medium") as TriageResult["priority"];

    console.log("[AI:live] triage —", ticket.id);
    return {
      category,
      priority: category === "family_distress" ? "high" : priority,
      suggested_team: team.name,
      suggested_team_id: teamId,
      confidence: Math.max(0, Math.min(100, Math.round(Number(raw.confidence ?? 70)))),
      one_line_summary: String(raw.one_line_summary ?? fallback.one_line_summary),
      suggested_first_reply: String(
        raw.suggested_first_reply ?? fallback.suggested_first_reply
      ),
      source: "live",
    };
  } catch (err) {
    console.log("[AI:mock] triage — API error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function generateInstallPlan(input: {
  homeDescription: string;
  rooms: string[];
  gatewayLocation: string;
}): Promise<InstallPlan> {
  const fallback = mockInstallPlan(input);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] install-plan — no OPENAI_API_KEY");
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are CareOps AI Install Copilot. Device types ONLY: Gateway, Motion Sensor, Door/Window Contact Sensor, Bed/Chair Presence Sensor, Bathroom Motion Sensor, Panic Button, Wearable (vitals + fall). Enforce ~${GATEWAY_RANGE_FT} ft indoor gateway radio. Never use real company names. Return JSON: { placement_plan:[{room, sensor_type, rationale, within_range}], install_checklist:[string], warnings:[string] }.`,
        },
        {
          role: "user",
          content: `Home: ${input.homeDescription}\nGateway location: ${input.gatewayLocation}\nRooms: ${input.rooms.join(", ") || "(infer typical)"}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const raw = parseJson<{
      placement_plan?: InstallPlan["placement_plan"];
      install_checklist?: string[];
      warnings?: string[];
    }>(text);

    if (!raw?.placement_plan?.length) {
      console.log("[AI:mock] install-plan — parse fail");
      return fallback;
    }

    console.log("[AI:live] install-plan");
    return {
      placement_plan: raw.placement_plan,
      install_checklist: raw.install_checklist ?? fallback.install_checklist,
      warnings: raw.warnings ?? [],
      source: "live",
    };
  } catch (err) {
    console.log("[AI:mock] install-plan — API error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function answerInstallChat(question: string): Promise<{
  answer: string;
  source: "live" | "mock";
}> {
  const fallback = mockInstallChat(question);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] install-chat — no OPENAI_API_KEY");
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `CareOps install troubleshooter. Topics: pairing, ~${GATEWAY_RANGE_FT} ft range, offline/Wi-Fi. JSON: {answer:string}. No real company names.`,
        },
        { role: "user", content: question },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const raw = parseJson<{ answer?: string }>(text);
    if (!raw?.answer) {
      console.log("[AI:mock] install-chat — parse fail");
      return fallback;
    }
    console.log("[AI:live] install-chat");
    return { answer: raw.answer, source: "live" };
  } catch (err) {
    console.log("[AI:mock] install-chat — API error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function analyzeIncidentCausal(
  incident: { id: string; room: string; note: string; type: string; coords?: { x: number; y: number } },
  roomName?: string,
  intakeContext?: string
) {
  const { mockIncidentAnalyze } = await import("@/lib/ai-mock");
  const fallback = mockIncidentAnalyze(incident, roomName);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] incident-analyze — no OPENAI_API_KEY");
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are CareOps AI Incident Causal Analyzer for a fall-DETECTION care platform. 
CRITICAL RULES:
- Brand must stay CareOps AI. Never use any competitor company name.
- NEVER claim that the system prevents falls. Frame all findings as risk-pattern insight and advisory environmental hazard analysis ("may have contributed to").
- Return strict JSON:
{
  "incident_id": "${incident.id}",
  "likely_causes": [{"factor": "string", "explanation": "string", "confidence": number}],
  "contributing_environment": ["low couch edge", "loose carpet edge", "threshold lip", "poor lighting", "wet bathroom floor", "clutter on path"],
  "severity": "low" | "med" | "high",
  "recommended_environmental_adjustments": ["string"]
}`,
        },
        {
          role: "user",
          content: `Analyze incident: Room: ${roomName || incident.room}, Type: ${incident.type}, Note: ${incident.note}\nContext: ${intakeContext || "{}"}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const raw = parseJson<typeof fallback>(text);
    if (!raw || !Array.isArray(raw.likely_causes)) {
      console.log("[AI:mock] incident-analyze — parse fail");
      return fallback;
    }
    console.log("[AI:live] incident-analyze");
    return { ...raw, incident_id: incident.id, source: "live" as const };
  } catch (err) {
    console.log("[AI:mock] incident-analyze — API error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function aggregateRiskZones(
  incidents: { id: string; room: string; type: string; coords: { x: number; y: number } }[],
  intakeContext?: string
) {
  const { mockRiskZones } = await import("@/lib/ai-mock");
  const fallback = mockRiskZones(incidents);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] risk-zones — no OPENAI_API_KEY");
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are CareOps AI Risk-Zone Aggregator for a fall-DETECTION care platform.
CRITICAL RULES:
- Brand must stay CareOps AI. Never use competitor names.
- Do NOT claim fall prevention. Frame as "Flagged unsafe area" or hazard pattern insight.
- Return strict JSON:
{
  "zones": [
    {
      "id": "string",
      "label": "string",
      "room": "string",
      "centroid_coords": {"x": number, "y": number},
      "radius": number,
      "incident_count": number,
      "dominant_factors": ["string"],
      "risk_level": "high" | "medium" | "low"
    }
  ],
  "unsafe_routes": [
    {"from_room": "string", "to_room": "string", "note": "string"}
  ]
}`,
        },
        {
          role: "user",
          content: `Incidents logged: ${JSON.stringify(incidents)}\nContext: ${intakeContext || "{}"}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const raw = parseJson<typeof fallback>(text);
    if (!raw || !Array.isArray(raw.zones)) {
      console.log("[AI:mock] risk-zones — parse fail");
      return fallback;
    }
    console.log("[AI:live] risk-zones");
    return { ...raw, source: "live" as const };
  } catch (err) {
    console.log("[AI:mock] risk-zones — API error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function assessVitalIntelligence(input: {
  immobilityDurationMins?: number;
  heartRate?: number;
  spo2?: number;
  residentName?: string;
  contextText?: string;
}) {
  const { mockVitalAssess } = await import("@/lib/ai-mock");
  const fallback = mockVitalAssess(input);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] vital-assess — no OPENAI_API_KEY");
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are CareOps AI Vital Intelligence Classifier for connected care monitoring.
CRITICAL RULES:
- Brand must stay CareOps AI. Never use competitor names.
- This is DECISION SUPPORT ONLY, NOT A MEDICAL DIAGNOSIS. Frame as indicators that prompt human checks.
- Return strict JSON:
{
  "assessment": "likely_sleep" | "normal_rest" | "possible_cardiac_event" | "possible_stroke_indicator" | "inconclusive",
  "reasoning": "string (decision-support explanation)",
  "hr_summary": {
    "current": number,
    "baseline": number,
    "trend": "stable" | "elevated" | "bradycardia" | "erratic"
  },
  "confidence": number,
  "urgency": "low" | "med" | "high" | "critical",
  "recommended_action": "string",
  "escalation": boolean
}`,
        },
        {
          role: "user",
          content: `Resident: ${input.residentName || "Resident"}, Immobility: ${input.immobilityDurationMins || 45}m, HR: ${input.heartRate || 118} bpm, SpO2: ${input.spo2 || 94}%\nContext: ${input.contextText || ""}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const raw = parseJson<typeof fallback>(text);
    if (!raw || !raw.assessment) {
      console.log("[AI:mock] vital-assess — parse fail");
      return fallback;
    }
    console.log("[AI:live] vital-assess");
    return { ...raw, source: "live" as const };
  } catch (err) {
    console.log("[AI:mock] vital-assess — API error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function computeVitalEWS(resident: {
  id: string;
  name: string;
  currentHR: number;
  baselineHR: number;
  currentSpO2: number;
  baselineSpO2: number;
  immobilityMins: number;
  restingHR3DayTrend: number[];
}) {
  const { mockVitalEWS } = await import("@/lib/ai-mock");
  const fallback = mockVitalEWS(resident);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] vital-ews — no OPENAI_API_KEY");
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are CareOps AI Deterioration Early-Warning Score Calculator (NEWS2-style adaptation).
CRITICAL RULES:
- Brand must stay CareOps AI. Never use competitor names.
- THIS IS AN ADAPTED DECISION-SUPPORT INDICATOR, NOT A CLINICAL DIAGNOSIS. Frame as indicators prompting human checks.
- Return strict JSON:
{
  "resident_id": "string",
  "ews_score": number,
  "risk_band": "low" | "med" | "high" | "critical",
  "contributing_signals": [
    { "signal": "string", "value": "string", "baseline": "string", "deviation": "string" }
  ],
  "trend": "improving" | "stable" | "worsening",
  "recommended_check": "string",
  "escalate": boolean
}`,
        },
        {
          role: "user",
          content: `Resident: ${JSON.stringify(resident)}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const raw = parseJson<typeof fallback>(text);
    if (!raw || typeof raw.ews_score !== "number") {
      console.log("[AI:mock] vital-ews — parse fail");
      return fallback;
    }
    console.log("[AI:live] vital-ews");
    return { ...raw, source: "live" as const };
  } catch (err) {
    console.log("[AI:mock] vital-ews — API error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function generateShiftHandoff(resident: {
  name: string;
  room: string;
  conditions: string[];
  currentHR: number;
  baselineHR: number;
  currentSpO2: number;
  immobilityMins: number;
  ews_score?: number;
  risk_band?: string;
}) {
  const { mockShiftHandoff } = await import("@/lib/ai-mock");
  const fallback = mockShiftHandoff(resident);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] shift-handoff — no OPENAI_API_KEY");
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are CareOps AI SBAR Shift Handoff Generator for connected care.
CRITICAL RULES:
- Brand must stay CareOps AI. Never use competitor names.
- Frame as decision-support information summary, not clinical diagnosis.
- Return strict JSON:
{
  "resident_id": "string",
  "resident_name": "string",
  "situation": "string",
  "background": "string",
  "assessment": "string",
  "recommendation": "string",
  "escalation_flag": boolean
}`,
        },
        {
          role: "user",
          content: `Resident data: ${JSON.stringify(resident)}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const raw = parseJson<typeof fallback>(text);
    if (!raw || !raw.situation) {
      console.log("[AI:mock] shift-handoff — parse fail");
      return fallback;
    }
    console.log("[AI:live] shift-handoff");
    return { ...raw, source: "live" as const };
  } catch (err) {
    console.log("[AI:mock] shift-handoff — API error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}



