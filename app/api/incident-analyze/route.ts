import { sseResponse, paced, type SseEvent } from "@/lib/stream";
import { analyzeIncidentCausal } from "@/lib/ai";
import type { LoggedIncident } from "@/lib/install-types";

export const runtime = "nodejs";

const STEPS = [
  "Mapping incident coordinates & room layout boundary",
  "Correlating proximity to furniture & floor transition edges",
  "Evaluating environmental factors (lighting, friction, grab support)",
  "Synthesizing advisory risk-pattern analysis & hazard adjustments",
];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      incident?: LoggedIncident;
      roomName?: string;
      intakeContext?: string;
      stream?: boolean;
    };

    if (!body.incident) {
      return Response.json({ error: "incident object required" }, { status: 400 });
    }

    const incident = body.incident;

    const gen = async function* (): AsyncGenerator<SseEvent> {
      for await (const step of paced(
        STEPS.map((label, index) => ({ index, label })),
        240
      )) {
        yield { event: "step", data: { index: step.index, label: step.label, total: STEPS.length } };
      }
      const result = await analyzeIncidentCausal(incident, body.roomName, body.intakeContext);
      yield { event: "result", data: result };
    };

    if (body.stream === false) {
      const result = await analyzeIncidentCausal(incident, body.roomName, body.intakeContext);
      return Response.json(result);
    }

    return sseResponse(gen());
  } catch (err) {
    console.log("[AI:mock] /api/incident-analyze handler error:", err);
    return Response.json({ error: "failed to analyze incident" }, { status: 500 });
  }
}
