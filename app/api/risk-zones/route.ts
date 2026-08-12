import { sseResponse, paced, type SseEvent } from "@/lib/stream";
import { aggregateRiskZones } from "@/lib/ai";
import type { LoggedIncident } from "@/lib/install-types";

export const runtime = "nodejs";

const STEPS = [
  "Clustering logged incidents by spatial proximity & room location",
  "Computing centroid coordinates & hazard radii for high-density areas",
  "Analyzing transit frequency across room corridors (Bedroom ↔ Bathroom)",
  "Aggregating flagged unsafe zones & risk-pattern insights",
];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      incidents?: LoggedIncident[];
      intakeContext?: string;
      stream?: boolean;
    };

    const incidents = body.incidents || [];

    const gen = async function* (): AsyncGenerator<SseEvent> {
      for await (const step of paced(
        STEPS.map((label, index) => ({ index, label })),
        260
      )) {
        yield { event: "step", data: { index: step.index, label: step.label, total: STEPS.length } };
      }
      const result = await aggregateRiskZones(incidents, body.intakeContext);
      yield { event: "result", data: result };
    };

    if (body.stream === false) {
      const result = await aggregateRiskZones(incidents, body.intakeContext);
      return Response.json(result);
    }

    return sseResponse(gen());
  } catch (err) {
    console.log("[AI:mock] /api/risk-zones handler error:", err);
    return Response.json({ error: "failed to aggregate risk zones" }, { status: 500 });
  }
}
