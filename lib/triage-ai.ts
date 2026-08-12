import OpenAI from "openai";
import { AI_MODEL } from "@/lib/ai-config";
import { DEVICE_TYPES, DEVICE_LABEL } from "@/data/devices";
import { CATEGORY_TEAM, getTeam, type TicketCategory, type TeamId } from "@/data/teams";
import {
  mockRichTriage,
  normalizeDeviceMention,
  type TriageStreamResult,
} from "@/lib/triage-rich";

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

/** Models sometimes return 0.84; UI expects 0–100. */
function asPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export async function richTriageMessage(
  raw: string,
  channelHint?: string
): Promise<TriageStreamResult> {
  const fallback = mockRichTriage(raw, channelHint);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] triage-rich — no OPENAI_API_KEY");
    return fallback;
  }
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: `CareOps AI triage. Devices ONLY: ${DEVICE_TYPES.join(", ")} (${Object.values(DEVICE_LABEL).join("; ")}). Categories: ${CATEGORIES.join(", ")}. Family-distress always high priority. JSON: {channel, device_mentioned, home_or_customer, category, priority, sentiment, urgency_score, confidence, one_line_summary, suggested_reply}. No real company names.`,
        },
        { role: "user", content: raw },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const rawJson = parseJson<Record<string, unknown>>(text);
    if (!rawJson) {
      console.log("[AI:mock] triage-rich — parse fail");
      return fallback;
    }
    let category = String(rawJson.category ?? "") as TicketCategory;
    if (!CATEGORIES.includes(category)) category = fallback.category;
    if (/distress|wander|frantic|crying|dementia.*human/i.test(raw)) category = "family_distress";
    const teamId: TeamId =
      category === "family_distress" ? "care-family" : CATEGORY_TEAM[category];
    const team = getTeam(teamId);
    console.log("[AI:live] triage-rich");
    return {
      channel: (["email", "app", "phone-note"].includes(String(rawJson.channel))
        ? rawJson.channel
        : fallback.channel) as TriageStreamResult["channel"],
      device_mentioned: normalizeDeviceMention(
        rawJson.device_mentioned != null ? String(rawJson.device_mentioned) : null
      ),
      home_or_customer:
        rawJson.home_or_customer != null
          ? String(rawJson.home_or_customer)
          : fallback.home_or_customer,
      category,
      priority: category === "family_distress" ? "high" : (String(rawJson.priority) as "high" | "medium" | "low"),
      sentiment: (["negative", "neutral", "positive"].includes(String(rawJson.sentiment))
        ? rawJson.sentiment
        : fallback.sentiment) as TriageStreamResult["sentiment"],
      urgency_score: asPercent(Number(rawJson.urgency_score ?? fallback.urgency_score)),
      confidence: asPercent(Number(rawJson.confidence ?? fallback.confidence)),
      one_line_summary: String(rawJson.one_line_summary ?? fallback.one_line_summary),
      routed_team: team.name,
      routed_team_id: teamId,
      suggested_reply: String(rawJson.suggested_reply ?? fallback.suggested_reply),
      source: "live",
    };
  } catch (err) {
    console.log("[AI:mock] triage-rich —", err instanceof Error ? err.message : err);
    return fallback;
  }
}
