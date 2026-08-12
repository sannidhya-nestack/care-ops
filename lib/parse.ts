/** Text / PDF ingestion for Ops Copilot knowledge growth. */

export async function parseUploadedFile(file: {
  name: string;
  type: string;
  buffer: Buffer;
}): Promise<{ text: string; kind: "pdf" | "text" }> {
  const lower = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
  if (isPdf) {
    try {
      const pdfParse = (await import("pdf-parse")).default as (
        buf: Buffer
      ) => Promise<{ text: string }>;
      const parsed = await pdfParse(file.buffer);
      return { text: parsed.text || "", kind: "pdf" };
    } catch (err) {
      console.log("[AI:mock] pdf-parse fail:", err instanceof Error ? err.message : err);
      return {
        text: `PDF could not be parsed (${file.name}). Paste text instead.`,
        kind: "pdf",
      };
    }
  }
  return { text: file.buffer.toString("utf8"), kind: "text" };
}
