import { sseResponse, paced, type SseEvent } from "@/lib/stream";
import { assessVitalIntelligence } from "@/lib/ai";

export const runtime = "nodejs";

const STEPS = [
  "Reading immobility sensor data (active-IR presence)",
  "Fetching resident Wearable heart-rate & SpO2 time-series",
  "Correlating circadian baseline & routine context",
  "Synthesizing decision-support vital assessment",
];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      immobilityDurationMins?: number;
      heartRate?: number;
      spo2?: number;
      residentName?: string;
      contextText?: string;
      stream?: boolean;
    };

    const gen = async function* (): AsyncGenerator<SseEvent> {
      for await (const step of paced(
        STEPS.map((label, index) => ({ index, label })),
        260
      )) {
        yield { event: "step", data: { index: step.index, label: step.label, total: STEPS.length } };
      }
      const result = await assessVitalIntelligence(body);
      yield { event: "result", data: result };
    };

    if (body.stream === false) {
      const result = await assessVitalIntelligence(body);
      return Response.json(result);
    }

    return sseResponse(gen());
  } catch (err) {
    console.log("[AI:mock] /api/vital-assess error:", err);
    return Response.json({ error: "failed vital assessment" }, { status: 500 });
  }
}
