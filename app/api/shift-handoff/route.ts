import { sseResponse, paced, type SseEvent } from "@/lib/stream";
import { generateShiftHandoff } from "@/lib/ai";

export const runtime = "nodejs";

const STEPS = [
  "Aggregating shift events & immobility logs",
  "Summarizing deterioration early-warning indicators & EWS trends",
  "Formatting Situation, Background, Assessment, Recommendation (SBAR)",
  "Finalizing decision-support shift handoff report",
];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      resident: Parameters<typeof generateShiftHandoff>[0];
      stream?: boolean;
    };

    const gen = async function* (): AsyncGenerator<SseEvent> {
      for await (const step of paced(
        STEPS.map((label, index) => ({ index, label })),
        260
      )) {
        yield { event: "step", data: { index: step.index, label: step.label, total: STEPS.length } };
      }
      const result = await generateShiftHandoff(body.resident);
      yield { event: "result", data: result };
    };

    if (body.stream === false) {
      const result = await generateShiftHandoff(body.resident);
      return Response.json(result);
    }

    return sseResponse(gen());
  } catch (err) {
    console.log("[AI:mock] /api/shift-handoff error:", err);
    return Response.json({ error: "failed shift handoff generation" }, { status: 500 });
  }
}
