import OpenAI from "openai";
import { EMBED_MODEL } from "@/lib/ai-config";

export type Chunk = {
  id: string;
  sourceId: string;
  sourceTitle: string;
  text: string;
  embedding?: number[];
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/** Local TF-IDF-ish cosine over bag-of-words — mock retrieval when no key. */
export function tfidfScore(query: string, doc: string): number {
  const q = new Set(tokenize(query));
  const d = tokenize(doc);
  if (!q.size || !d.length) return 0;
  let hit = 0;
  for (const t of d) if (q.has(t)) hit += 1;
  return hit / Math.sqrt(q.size * d.length);
}

export function chunkText(sourceId: string, sourceTitle: string, text: string, size = 420): Chunk[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const out: Chunk[] = [];
  for (let i = 0; i < clean.length; i += size) {
    const slice = clean.slice(i, i + size);
    if (slice.length < 40) continue;
    out.push({
      id: `${sourceId}-${out.length}`,
      sourceId,
      sourceTitle,
      text: slice,
    });
  }
  return out.length ? out : [{ id: `${sourceId}-0`, sourceId, sourceTitle, text: clean.slice(0, size) }];
}

async function openaiEmbed(texts: string[]): Promise<number[][] | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  try {
    const client = new OpenAI({ apiKey: key });
    const res = await client.embeddings.create({ model: EMBED_MODEL, input: texts });
    console.log("[AI:live] embed —", texts.length);
    return res.data.map((d) => d.embedding);
  } catch (err) {
    console.log("[AI:mock] embed —", err instanceof Error ? err.message : err);
    return null;
  }
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function embedChunks(chunks: Chunk[]): Promise<Chunk[]> {
  const vectors = await openaiEmbed(chunks.map((c) => c.text));
  if (!vectors) {
    console.log("[AI:mock] embed — TF-IDF fallback");
    return chunks;
  }
  return chunks.map((c, i) => ({ ...c, embedding: vectors[i] }));
}

export async function retrieve(
  query: string,
  chunks: Chunk[],
  k = 4
): Promise<{ chunk: Chunk; score: number }[]> {
  const qVec = (await openaiEmbed([query]))?.[0];
  const scored = chunks.map((chunk) => {
    let score = 0;
    if (qVec && chunk.embedding) score = cosine(qVec, chunk.embedding);
    else score = tfidfScore(query, chunk.text);
    return { chunk, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).filter((s) => s.score > 0);
}
