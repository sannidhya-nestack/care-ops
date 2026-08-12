/** Single model config constants — swap via env. */
export const AI_MODEL = process.env.AI_MODEL?.trim() || "gpt-4o";
export const EMBED_MODEL = process.env.EMBED_MODEL?.trim() || "text-embedding-3-small";
