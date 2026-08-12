/** Single HF text-to-image model constant — override via HF_IMAGE_MODEL. */
export const HF_IMAGE_MODEL =
  process.env.HF_IMAGE_MODEL?.trim() || "black-forest-labs/FLUX.1-schnell";

export type BlueprintResult = {
  imageUrl: string | null;
  /** Inline SVG markup when offline mock */
  svgMarkup: string | null;
  source: "live" | "mock";
};

function mockBlueprintSvg(planSummary: string): string {
  const lines = planSummary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);

  const dots = lines
    .map((line, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 80 + col * 140;
      const y = 100 + row * 100;
      const label = line.slice(0, 28).replace(/[<>&]/g, "");
      return `<circle cx="${x}" cy="${y}" r="10" fill="#0f766e"/><text x="${x}" y="${y + 28}" text-anchor="middle" font-size="11" fill="#334155">${label}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0fdfa"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" fill="url(#g)"/>
  <rect x="40" y="48" width="560" height="320" rx="16" fill="#fff" stroke="#94a3b8" stroke-width="2"/>
  <text x="320" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" font-weight="600" fill="#0f172a">CareOps AI · Placement blueprint</text>
  <rect x="60" y="70" width="200" height="120" rx="8" fill="#ecfeff" stroke="#5eead4"/>
  <text x="160" y="135" text-anchor="middle" font-size="13" fill="#0f766e">Living</text>
  <rect x="280" y="70" width="140" height="120" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
  <text x="350" y="135" text-anchor="middle" font-size="13" fill="#475569">Hall</text>
  <rect x="440" y="70" width="140" height="120" rx="8" fill="#fef3c7" stroke="#fbbf24"/>
  <text x="510" y="135" text-anchor="middle" font-size="13" fill="#92400e">Bath</text>
  <rect x="60" y="210" width="300" height="140" rx="8" fill="#ede9fe" stroke="#a78bfa"/>
  <text x="210" y="285" text-anchor="middle" font-size="13" fill="#5b21b6">Bedroom</text>
  <rect x="380" y="210" width="200" height="140" rx="8" fill="#f1f5f9" stroke="#94a3b8"/>
  <text x="480" y="285" text-anchor="middle" font-size="13" fill="#475569">Entry</text>
  ${dots}
  <text x="320" y="400" text-anchor="middle" font-size="11" fill="#64748b">Offline blueprint · Gateway ~90 ft rule</text>
</svg>`;
}

/** SERVER ONLY — HF text-to-image with SVG mock fallback. */
export async function generatePlacementBlueprint(prompt: string): Promise<BlueprintResult> {
  const key = process.env.HUGGINGFACE_API_KEY?.trim();
  const svgMarkup = mockBlueprintSvg(prompt);

  if (!key) {
    console.log("[AI:mock] blueprint — no HUGGINGFACE_API_KEY");
    return { imageUrl: null, svgMarkup, source: "mock" };
  }

  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${HF_IMAGE_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Clean annotated top-down home blueprint illustration, soft clinical SaaS style, labeled sensor dots, no brand logos, no real company names. ${prompt.slice(0, 800)}`,
      }),
    });

    if (!res.ok) {
      console.log("[AI:mock] blueprint — HF status", res.status);
      return { imageUrl: null, svgMarkup, source: "mock" };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const b64 = buf.toString("base64");
    const mime = res.headers.get("content-type") || "image/png";
    console.log("[AI:live] blueprint");
    return {
      imageUrl: `data:${mime};base64,${b64}`,
      svgMarkup: null,
      source: "live",
    };
  } catch (err) {
    console.log("[AI:mock] blueprint — error:", err instanceof Error ? err.message : err);
    return { imageUrl: null, svgMarkup, source: "mock" };
  }
}
