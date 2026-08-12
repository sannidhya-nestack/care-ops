import { sseResponse, paced, type SseEvent } from "@/lib/stream";
import { computeVitalEWS } from "@/lib/ai";

export const runtime = "nodejs";

const STEPS = [
  "Reading resident Wearable HR & SpO2 time-series",
  "Evaluating Active-IR Bed Presence immobility duration",
  "Computing 3-day resting HR baseline drift",
  "Synthesizing adapted deterioration early-warning indicator (NEWS2-style adaptation)",
];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      resident: Parameters<typeof computeVitalEWS>[0];
      stream?: boolean;
    };

    const gen = async function* (): AsyncGenerator<SseEvent> {
      for await (const step of paced(
        STEPS.map((label, index) => ({ index, label })),
        260
      )) {
        yield { event: "step", data: { index: step.index, label: step.label, total: STEPS.length } };
      }
      const result = await computeVitalEWS(body.resident);
      yield { event: "result", data: result };
    };

    if (body.stream === false) {
      const result = await computeVitalEWS(body.resident);
      return Response.json(result);
    }

    return sseResponse(gen());
  } catch (err) {
    console.log("[AI:mock] /api/vital-ews error:", err);
    return Response.json({ error: "failed vital ews calculation" }, { status: 500 });
  }
}
