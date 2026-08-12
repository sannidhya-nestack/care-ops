import OpenAI from "openai";
import { AI_MODEL } from "@/lib/ai-config";
import { DEVICE_TYPES, normalizeDeviceType } from "@/data/devices";
import { GATEWAY_RANGE_FT } from "@/data/homes";
import {
  intakeContextBlob,
  type InstallIntake,
  type RoomVisionResult,
} from "@/lib/install-types";
import { mockRoomVision } from "@/lib/vision-mock";

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

/** SERVER ONLY — vision room analysis with mock fallback. */
export async function analyzeRoomVision(input: {
  roomName: string;
  sampleKey?: string;
  imageDataUrl?: string | null;
  intake: InstallIntake;
}): Promise<RoomVisionResult> {
  const fallback = mockRoomVision(input);
  const openai = client();
  if (!openai) {
    console.log("[AI:mock] vision — no OPENAI_API_KEY");
    return fallback;
  }

  try {
    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: "text",
        text: `Analyze this elder-monitoring room photo for CareOps AI. Allowed devices ONLY: ${DEVICE_TYPES.join(", ")}. Enforce ~${GATEWAY_RANGE_FT} ft gateway radio. Intake: ${intakeContextBlob(input.intake)}. Room name hint: ${input.roomName}. Return STRICT JSON: { room_detected, sensors:[{type,placement_label,rationale,coords:{x,y},within_range,range_note}], fall_hazards:[{label,severity,coords:{x,y},mitigation}], gateway_range_assessment, coverage_score }. coords normalized 0..1. No real company names. No cameras as devices.`,
      },
    ];

    if (input.imageDataUrl?.startsWith("data:")) {
      content.push({
        type: "image_url",
        image_url: { url: input.imageDataUrl },
      });
    } else if (input.imageDataUrl?.startsWith("/")) {
      content.push({
        type: "text",
        text: `(Sample illustration path: ${input.imageDataUrl} — infer typical layout for ${input.roomName}.)`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are CareOps AI Install vision. JSON only. Device types must be from the allowed list.",
        },
        { role: "user", content },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const raw = parseJson<RoomVisionResult>(text);
    if (!raw?.sensors?.length) {
      console.log("[AI:mock] vision — parse fail");
      return fallback;
    }

    console.log("[AI:live] vision —", input.roomName);
    return {
      room_detected: String(raw.room_detected || input.roomName),
      sensors: raw.sensors.map((s) => ({
        ...s,
        type: normalizeDeviceType(String(s.type)),
        within_range: !!s.within_range,
        coords: {
          x: Math.min(1, Math.max(0, Number(s.coords?.x ?? 0.5))),
          y: Math.min(1, Math.max(0, Number(s.coords?.y ?? 0.5))),
        },
      })),
      fall_hazards: (raw.fall_hazards ?? []).map((h) => ({
        ...h,
        severity: (["low", "med", "high"].includes(h.severity) ? h.severity : "med") as
          | "low"
          | "med"
          | "high",
        coords: {
          x: Math.min(1, Math.max(0, Number(h.coords?.x ?? 0.5))),
          y: Math.min(1, Math.max(0, Number(h.coords?.y ?? 0.5))),
        },
      })),
      gateway_range_assessment: String(
        raw.gateway_range_assessment ?? fallback.gateway_range_assessment
      ),
      coverage_score: Math.max(0, Math.min(100, Math.round(Number(raw.coverage_score ?? 75)))),
      source: "live",
    };
  } catch (err) {
    console.log("[AI:mock] vision — API error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}
