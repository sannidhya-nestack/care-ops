import { playbooks } from "@/data/playbooks";
import { resolvedTickets } from "@/data/resolvedTickets";
import { COPILOT_DEMO_DOCS, COPILOT_DEMO_QUESTIONS } from "@/data/copilot-demo";
import { THESSAI_KB_DOCUMENTS } from "@/data/thessai-kb";
import { chunkText, embedChunks, retrieve, type Chunk } from "@/lib/embed";
import { sseResponse, paced, type SseEvent } from "@/lib/stream";
import { AI_MODEL } from "@/lib/ai-config";
import OpenAI from "openai";

export const runtime = "nodejs";

let uploadedChunks: Chunk[] = [];
let demoLoaded = false;

function seedChunks(): Chunk[] {
  const fromThessaiKb = THESSAI_KB_DOCUMENTS.flatMap((doc) =>
    chunkText(doc.id, doc.title, doc.fullText)
  );

  const fromPlaybooks = playbooks.flatMap((p) =>
    chunkText(p.id, p.title, `${p.summary}\n${p.steps.join("\n")}`)
  );
  
  const fromResolved = resolvedTickets.flatMap((t) =>
    chunkText(t.id, t.subject, `${t.resolutionNotes}\nKeywords: ${t.keywords.join(", ")}`)
  );

  return [...fromThessaiKb, ...fromPlaybooks, ...fromResolved, ...uploadedChunks];
}

function listSources(chunks: Chunk[]) {
  const map = new Map<string, { id: string; title: string; chunks: number; category?: string; fullText?: string; tags?: string[] }>();
  
  for (const doc of THESSAI_KB_DOCUMENTS) {
    map.set(doc.id, {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      fullText: doc.fullText,
      tags: doc.tags,
      chunks: 0,
    });
  }

  for (const c of chunks) {
    const existing = map.get(c.sourceId);
    if (existing) {
      existing.chunks += 1;
    } else {
      map.set(c.sourceId, {
        id: c.sourceId,
        title: c.sourceTitle,
        chunks: 1,
        fullText: c.text,
      });
    }
  }
  return Array.from(map.values());
}

function isGreeting(question: string) {
  return /^(hi|hello|hey|good\s+(morning|afternoon|evening)|what can you( help)?|who are you|help me)\b/i.test(
    question.trim()
  );
}

function greetingAnswer() {
  return `Hi — I’m **CareOps AI Ops Copilot**, your support operations teammate for CareOps AI senior safety platform.

I can help you right now with:
• **AI Gateway**: Placement & ~90ft RF indoor coverage rule
• **mmWave Radar Fall Detection**: Camera-free 60GHz vector calibration & room boundary setup
• **Smart Wearable**: Vital sign syncing & emergency SOS button response
• **Gateway LED Diagnostics**: Wi-Fi reconnection & solid red recovery
• **Subscription & Billing**: Home Plus vs Essential plan adjustments & promo add-ons
• **Family Communication**: Overnight nocturnal bathroom motion & Quiet Hours tuning

Ask a specific technical or support question, or select a prompt — I'll ground the response directly in our official Knowledge Base.`;
}

function mockAnswer(question: string, hits: { chunk: Chunk; score: number }[]) {
  const cites = hits.map((h) => ({
    sourceId: h.chunk.sourceId,
    title: h.chunk.sourceTitle,
    snippet: h.chunk.text.slice(0, 180),
    score: Number(h.score.toFixed(3)),
  }));

  if (isGreeting(question)) {
    return {
      answer: greetingAnswer(),
      citations: cites.slice(0, 2),
      source: "mock" as const,
    };
  }

  let answer = "";
  if (/radar|fall|camera|privacy|mmwave|doppler/i.test(question)) {
    answer +=
      "**mmWave Radar Fall Detection**: Uses 60GHz micro-Doppler radar point-clouds with **100% camera-free zero-optical privacy**. It detects rapid posture drops below 18 inches (<0.8s) and impact energy without vertical kinetic motion (>15s). Ceiling mount at 7.5–8.5 ft angled 15° downward; filter out pets (<25 lbs) and ceiling fans via Room Scanner App.\n\n";
  }
  if (/nocturnal|prolonged|room.?dwell|sleep.?timing|family|alert|bathroom/i.test(question)) {
    answer +=
      "**Nocturnal Motion & Family Alert Protocol**: Overnight bathroom alerts explain monitoring patterns (Quiet Hours 10pm–6am) to families—they are NOT automatic clinical diagnoses. Script: Acknowledge worry, explain routine pattern in plain language, offer to tune Quiet Hours or increase dwell grace timer (15m to 25m), and confirm instant Fall/SOS emergency alerts remain active 24/7.\n\n";
  }
  if (/90|range|out of range|placement|gateway/i.test(question)) {
    answer +=
      "**Gateway ~90ft RF Range Standard**: Indoor reliable coverage is ~90 ft line-of-sight (concrete reduces propagation by 40-60%). Out-of-range banners mean Gateway placement or RF Relay Node—do NOT reset firmware first. Elevate Gateway 3.5–5 ft near geometric center of sensor cluster, wait 5 min, then hit Devices → Refresh.\n\n";
  }
  if (/wearable|sync|bluetooth|vitals|sos/i.test(question)) {
    answer +=
      "**Smart Wearable & SOS**: Vitals sync via BLE 5.3 within 30 ft. SOS button press for 2.0s vibrates 3 times and triggers immediate priority alert dispatch. Stale vitals: toggle phone Bluetooth, disable iOS Low Power Mode overnight, hold band 3 ft from Gateway for 45s force sync, or recharge if battery < 15%.\n\n";
  }
  if (/bill|charge|invoice|addon|add-on|subscription|home plus/i.test(question)) {
    answer +=
      "**Subscription & Billing SOP**: Renewal price deltas ($79 Home Plus vs $49 Essential) stem from Wearable Insight promo auto-enrollment. Support SOP: Review plan + invoice in Billing Tool, route Billing for statement credit next cycle if unauthorized, cancel add-on for subsequent cycle, and email confirmation. No instant cash promises over chat without Tier-2 approval.\n\n";
  }
  if (/led|red|amber|wifi|offline/i.test(question)) {
    answer +=
      "**Gateway LED Status & Recovery**: Solid Green = Online; Flashing Amber = Searching Wi-Fi; Solid Red = Network link down. Recovery: Unplug 30s → power in → wait 2 min. If solid red, hold rear reset button 5s until LED flashes Blue, then re-select SSID in app. Do not factory wipe 15s without Tier-3 direction.\n\n";
  }

  if (hits[0]) {
    answer += `*Grounded in Documentation (“${hits[0].chunk.sourceTitle}”)*:\n${hits[0].chunk.text.slice(0, 340)}${hits[0].chunk.text.length > 340 ? "…" : ""}`;
  } else if (!answer) {
    answer =
      "I couldn’t find a direct match in the Knowledge Base. Select one of the prompts or search the Knowledge Base tab for full technical documentation.";
  }

  return { answer: answer.trim(), citations: cites, source: "mock" as const };
}

async function seedDemoPack() {
  uploadedChunks = uploadedChunks.filter((c) => !c.sourceId.startsWith("demo-"));
  const fresh: Chunk[] = [];
  for (const doc of COPILOT_DEMO_DOCS) {
    let parts = chunkText(doc.id, doc.title, doc.text, 380);
    parts = await embedChunks(parts);
    fresh.push(...parts);
  }
  uploadedChunks = [...uploadedChunks, ...fresh];
  demoLoaded = true;
  return fresh.length;
}

export async function GET() {
  const chunks = seedChunks();
  return Response.json({
    sources: listSources(chunks),
    totalChunks: chunks.length,
    uploaded: uploadedChunks.length,
    demoLoaded: true,
    demoQuestions: COPILOT_DEMO_QUESTIONS,
    documents: THESSAI_KB_DOCUMENTS,
  });
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "file required" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const { parseUploadedFile } = await import("@/lib/parse");
    const parsed = await parseUploadedFile({
      name: file.name,
      type: file.type,
      buffer: buf,
    });
    const sourceId = `upload-${Date.now()}`;
    let chunks = chunkText(sourceId, file.name, parsed.text || "Empty document");
    chunks = await embedChunks(chunks);
    uploadedChunks = [...uploadedChunks, ...chunks];
    return Response.json({
      sourceId,
      title: file.name,
      chunksAdded: chunks.length,
      totalChunks: seedChunks().length,
    });
  }

  const body = (await req.json()) as { question?: string; mode?: string };
  if (body.mode === "seed-demo") {
    const added = await seedDemoPack();
    const chunks = seedChunks();
    return Response.json({
      ok: true,
      chunksAdded: added,
      sources: listSources(chunks),
      totalChunks: chunks.length,
      demoLoaded: true,
      demoQuestions: COPILOT_DEMO_QUESTIONS,
      documents: THESSAI_KB_DOCUMENTS,
    });
  }

  const question = body.question?.trim() || "";
  if (!question) return Response.json({ error: "question required" }, { status: 400 });

  async function* gen(): AsyncGenerator<SseEvent> {
    yield { event: "step", data: { label: "Searching Knowledge Base…", index: 0 } };
    await new Promise((r) => setTimeout(r, 240));
    const corpus = seedChunks();
    const hits = isGreeting(question)
      ? await retrieve("CareOps AI Gateway mmWave fall wearable vital SOS billing nocturnal", corpus, 3)
      : await retrieve(question, corpus, 4);
    yield {
      event: "sources",
      data: {
        citations: hits.map((h) => ({
          sourceId: h.chunk.sourceId,
          title: h.chunk.sourceTitle,
          snippet: h.chunk.text.slice(0, 180),
          score: Number(h.score.toFixed(3)),
        })),
      },
    };
    yield { event: "step", data: { label: "Drafting grounded answer…", index: 1 } };

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      const mock = mockAnswer(question, hits);
      for await (const word of paced(mock.answer.split(/(?=\s)/), 16)) {
        yield { event: "token", data: { text: word } };
      }
      yield { event: "result", data: mock };
      return;
    }

    try {
      const client = new OpenAI({ apiKey: key });
      const context = hits.map((h) => `[${h.chunk.sourceTitle}] ${h.chunk.text}`).join("\n\n");
      const completion = await client.chat.completions.create({
        model: AI_MODEL,
        max_tokens: 750,
        messages: [
          {
            role: "system",
            content:
              "You are CareOps AI Ops Copilot — an expert, professional support operations assistant for CareOps AI senior safety platform. Greet warmly for greetings, introducing yourself as CareOps AI Ops Copilot. For technical/support queries, answer strictly grounded in the provided Knowledge Base chunks (AI Gateway ~90ft range, mmWave camera-free fall radar, Smart Wearable vital/SOS sync, zero-camera privacy protocol, quiet hours nocturnal tracking, billing SOP). Format clearly with markdown bullet points.",
          },
          {
            role: "user",
            content: `Question: ${question}\n\nKnowledge Base Chunks:\n${context || "(none — introduce yourself and list support areas)"}`,
          },
        ],
      });
      const answer = completion.choices[0]?.message?.content ?? mockAnswer(question, hits).answer;
      for await (const word of paced(answer.split(/(?=\s)/), 12)) {
        yield { event: "token", data: { text: word } };
      }
      yield {
        event: "result",
        data: {
          answer,
          citations: hits.map((h) => ({
            sourceId: h.chunk.sourceId,
            title: h.chunk.sourceTitle,
            snippet: h.chunk.text.slice(0, 180),
            score: Number(h.score.toFixed(3)),
          })),
          source: "live",
        },
      };
    } catch (err) {
      const mock = mockAnswer(question, hits);
      for await (const word of paced(mock.answer.split(/(?=\s)/), 16)) {
        yield { event: "token", data: { text: word } };
      }
      yield { event: "result", data: mock };
    }
  }

  return sseResponse(gen());
}
