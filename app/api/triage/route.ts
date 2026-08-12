import { sseResponse, paced, type SseEvent } from "@/lib/stream";
import { richTriageMessage } from "@/lib/triage-ai";
import { PIPELINE } from "@/lib/triage-rich";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    rawText?: string;
    channel?: string;
    stream?: boolean;
    ticketId?: string;
  };

  // Legacy non-stream ticketId path kept for compatibility
  if (body.ticketId && !body.rawText) {
    const { getTicket } = await import("@/data/tickets");
    const { triageTicket } = await import("@/lib/ai");
    const ticket = getTicket(body.ticketId);
    if (!ticket) return Response.json({ error: "not found" }, { status: 404 });
    const result = await triageTicket(ticket);
    return Response.json(result);
  }

  const raw = body.rawText?.trim() || "";
  if (!raw) return Response.json({ error: "rawText required" }, { status: 400 });

  async function* gen(): AsyncGenerator<SseEvent> {
    for await (const step of paced(
      PIPELINE.map((label, index) => ({ index, label })),
      320
    )) {
      yield { event: "step", data: { index: step.index, label: step.label, total: PIPELINE.length } };
    }
    const result = await richTriageMessage(raw, body.channel);
    yield { event: "result", data: result };
  }

  if (body.stream === false) {
    const result = await richTriageMessage(raw, body.channel);
    return Response.json(result);
  }

  return sseResponse(gen());
}
