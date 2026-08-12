/** SSE helpers for route handlers + client readers. */

export type SseEvent = {
  event: string;
  data: unknown;
};

export function sseResponse(events: AsyncIterable<SseEvent> | SseEvent[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: SseEvent) => {
        controller.enqueue(
          encoder.encode(`event: ${ev.event}\ndata: ${JSON.stringify(ev.data)}\n\n`)
        );
      };
      try {
        if (Symbol.asyncIterator in Object(events)) {
          for await (const ev of events as AsyncIterable<SseEvent>) send(ev);
        } else {
          for (const ev of events as SseEvent[]) send(ev);
        }
        send({ event: "done", data: { ok: true } });
      } catch (err) {
        send({
          event: "error",
          data: { message: err instanceof Error ? err.message : "stream error" },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function* paced<T>(
  items: T[],
  ms = 280
): AsyncGenerator<T> {
  for (const item of items) {
    await new Promise((r) => setTimeout(r, ms));
    yield item;
  }
}

export async function readSse(
  res: Response,
  onEvent: (event: string, data: unknown) => void
) {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const lines = part.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;
      try {
        onEvent(event, JSON.parse(data));
      } catch {
        onEvent(event, data);
      }
    }
  }
}
