import { DEVICE_LABEL, normalizeDeviceType, type DeviceType } from "@/data/devices";
import type { TicketCategory, TeamId } from "@/data/teams";
import { CATEGORY_TEAM, getTeam } from "@/data/teams";

export type TriageStreamResult = {
  channel: "email" | "app" | "phone-note";
  device_mentioned: DeviceType | null;
  home_or_customer: string | null;
  category: TicketCategory;
  priority: "high" | "medium" | "low";
  sentiment: "negative" | "neutral" | "positive";
  urgency_score: number;
  confidence: number;
  one_line_summary: string;
  routed_team: string;
  routed_team_id: TeamId;
  suggested_reply: string;
  source: "live" | "mock";
};

const PIPELINE = [
  "Reading message",
  "Extracting entities",
  "Classifying",
  "Drafting reply",
] as const;

export { PIPELINE };

/** Messy human-looking inbound messages for simulated live feed. */
export const MESSY_INBOUND = [
  {
    channel: "email" as const,
    from: "priya.r@homebox.mail",
    subject: "re: bedroom thing still amber??",
    body: `hi — sorry its late. the motion thing in moms bedroom wont leave amber. gateway is green i think?? held the button forever yesterday. acct ACCT-88421. pls help before weekend visit`,
  },
  {
    channel: "app" as const,
    from: "Daniel Okonkwo",
    subject: "OUT OF RANGE banner again",
    body: `hallway presence keeps dropping. living room gateway, sensor near back bedroom like 95ft thru walls. banner says gateway out of range >90ft. this is the 3rd time this month`,
  },
  {
    channel: "phone-note" as const,
    from: "Agent note · Elena",
    subject: "Caller frantic — dad wandered",
    body: `Caller crying. Dad with dementia opened exit door ~8:40pm, not back. wants a HUMAN not chatbot. presence logs? Family distress — escalate Care/Family Liaison NOW.`,
  },
  {
    channel: "email" as const,
    from: "billing-questions@personal.mail",
    subject: "why was i charged twice",
    body: `Invoice looks wrong for ACCT-55190 — charged Home Plus AND wearable add-on but we cancelled wearable? need someone to explain charges not sell me stuff`,
  },
  {
    channel: "app" as const,
    from: "Maya C.",
    subject: "too many pings overnight",
    body: `bathroom motion woke my phone 4 times btwn 1–4am. mom is fine she just pees a lot. how do i quiet the noise without turning off safety??`,
  },
  {
    channel: "email" as const,
    from: "ops@maplesuite.care",
    subject: "GW-118 offline after wifi blip",
    body: `suite gateway went dark after ISP flicker. wifi back, gateway last-seen 3h. power cycled once. LED was red then nothing. Unit 118.`,
  },
];

function detectDevice(text: string): DeviceType | null {
  const t = text.toLowerCase();
  if (/wearable|vitals|band|fall band/.test(t)) return "wearable";
  if (/panic/.test(t)) return "panic_button";
  if (/bath/.test(t) && /motion|sensor/.test(t)) return "bathroom_motion";
  if (/door|window|contact|exit door/.test(t)) return "door_contact";
  if (/bed|presence|chair/.test(t)) return "bed_chair_presence";
  if (/gateway|gw-/.test(t)) return "gateway";
  if (/motion/.test(t)) return "motion";
  return null;
}

function detectChannel(text: string, hint?: string): TriageStreamResult["channel"] {
  if (hint === "email" || hint === "app" || hint === "phone-note") return hint;
  if (/caller|agent note|phone/.test(text.toLowerCase())) return "phone-note";
  if (/@/.test(text)) return "email";
  return "app";
}

export function mockRichTriage(raw: string, channelHint?: string): TriageStreamResult {
  const text = raw.toLowerCase();
  let category: TicketCategory = "app_howto";
  let priority: TriageStreamResult["priority"] = "medium";
  let sentiment: TriageStreamResult["sentiment"] = "neutral";
  let confidence = 86;
  let urgency = 45;

  if (/cried|crying|frantic|dementia|wander|distress|human not chatbot|danger/.test(text)) {
    category = "family_distress";
    priority = "high";
    sentiment = "negative";
    confidence = 62;
    urgency = 96;
  } else if (/out of range|90\s*ft|95\s*ft/.test(text)) {
    category = "gateway_range";
    priority = "medium";
    confidence = 88;
    urgency = 58;
  } else if (/offline|last-seen|isp|wifi blip|led was red/.test(text)) {
    category = "gateway_offline";
    priority = "high";
    confidence = 90;
    urgency = 72;
    sentiment = "negative";
  } else if (/amber|pair|pairing|wont leave|won't leave/.test(text)) {
    category = "sensor_pairing";
    priority = "medium";
    confidence = 84;
    urgency = 50;
    sentiment = "negative";
  } else if (/charged|invoice|billing|cancel wearable/.test(text)) {
    category = "subscription_billing";
    priority = "low";
    confidence = 91;
    urgency = 30;
  } else if (/too many|quiet|pings|notifications|noise/.test(text)) {
    category = "app_howto";
    priority = "low";
    confidence = 89;
    urgency = 28;
  } else if (/rma|cracked|warranty/.test(text)) {
    category = "hardware_rma";
    priority = "medium";
    confidence = 87;
    urgency = 40;
  } else if (/sync|bluetooth|wearable/.test(text)) {
    category = "wearable_sync";
    priority = "medium";
    confidence = 85;
    urgency = 48;
  }

  const device = detectDevice(raw);
  const teamId =
    category === "family_distress" ? ("care-family" as TeamId) : CATEGORY_TEAM[category];
  const team = getTeam(teamId);

  const acct = raw.match(/ACCT-[A-Z0-9-]+/i)?.[0] ?? null;
  const name =
    raw.match(/(?:from:|hi —|moms?|dad)\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/)?.[1] ??
    (acct ? `Account ${acct}` : null);

  const deviceLabel = device ? DEVICE_LABEL[device] : "device";

  return {
    channel: detectChannel(raw, channelHint),
    device_mentioned: device,
    home_or_customer: name || acct,
    category,
    priority: category === "family_distress" ? "high" : priority,
    sentiment,
    urgency_score: urgency,
    confidence,
    one_line_summary:
      category === "family_distress"
        ? "Sensitive family situation — Care/Family Liaison + human review."
        : `${deviceLabel} · ${category.replace(/_/g, " ")} — needs ${team.name}.`,
    routed_team: team.name,
    routed_team_id: teamId,
    suggested_reply:
      category === "family_distress"
        ? "A Care/Family Liaison is connecting now. If anyone is in immediate danger, call local emergency services."
        : `Thanks for writing — we see the ${deviceLabel} issue. We'll walk you through the next check against the ~90 ft Gateway rule and pairing steps.`,
    source: "mock",
  };
}

export function normalizeDeviceMention(raw: string | null | undefined): DeviceType | null {
  if (!raw) return null;
  return normalizeDeviceType(raw);
}
