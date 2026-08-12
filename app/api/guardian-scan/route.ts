import { complianceRules } from "@/data/complianceRules";
import { AI_MODEL } from "@/lib/ai-config";
import type { GuardianResult, PhiFinding } from "@/lib/guardian-types";
import OpenAI from "openai";

export const runtime = "nodejs";

export type { GuardianResult, PhiFinding } from "@/lib/guardian-types";

function mockScan(text: string): GuardianResult {
  const findings: PhiFinding[] = [];
  const patterns: { re: RegExp; type: string; risk: PhiFinding["risk"] }[] = [
    { re: /\b\d{3}-\d{2}-\d{4}\b/g, type: "SSN-like", risk: "high" },
    { re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, type: "Email", risk: "medium" },
    { re: /\b(?:MRN|DOB|date of birth)[:\s]+\S+/gi, type: "Clinical ID", risk: "high" },
    { re: /\b(?:diagnosed with|diagnosis of)\s+[^.,\n]+/gi, type: "Diagnosis detail", risk: "high" },
    {
      re: /\b(?:fall|blood pressure|SpO2|medication)\b[^.]{0,40}/gi,
      type: "Health detail",
      risk: "medium",
    },
    { re: /\bACCT-[A-Z0-9-]+\b/g, type: "Account ID", risk: "low" },
  ];

  for (const p of patterns) {
    const re = new RegExp(p.re.source, p.re.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      findings.push({
        span: m[0],
        type: p.type,
        risk: p.risk,
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }

  const ruleHits = complianceRules.filter((r) => {
    const blob = `${r.title} ${r.plainEnglish}`.toLowerCase();
    return /phi|vital|diagnos|name|identity|sensor/.test(blob)
      ? /diagnos|vital|mrn|ssn|blood pressure|spo2|fall/i.test(text)
      : false;
  });

  let redacted = text;
  for (const f of [...findings].sort((a, b) => b.start - a.start)) {
    if (f.risk === "high" || f.risk === "medium") {
      redacted = redacted.slice(0, f.start) + `[${f.type} redacted]` + redacted.slice(f.end);
    }
  }

  const high = findings.some((f) => f.risk === "high") || ruleHits.length > 0;
  const med = findings.some((f) => f.risk === "medium");

  return {
    phi_findings: findings,
    hipaa_risk_level: high ? "high" : med ? "medium" : "low",
    redacted_version: redacted,
    recommendation: high
      ? "Remove clinical identifiers before sending to family channels."
      : med
        ? "Prefer plain language; drop precise vitals unless care team asks."
        : "Looks care-circle safe — still avoid adding new clinical detail.",
    source: "mock",
  };
}

export async function POST(req: Request) {
  const body = (await req.json()) as { text?: string };
  const text = body.text ?? "";
  const fallback = mockScan(text);

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || text.trim().length < 8) {
    console.log("[AI:mock] guardian-scan");
    return Response.json(fallback);
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: `CareOps Compliance Guardian. Rules: ${complianceRules.map((r) => r.title).join("; ")}. JSON: {phi_findings:[{span,type,risk,start,end}], hipaa_risk_level, redacted_version, recommendation}. No real company names.`,
        },
        { role: "user", content: text },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(start, end + 1)) as GuardianResult;
    console.log("[AI:live] guardian-scan");
    return Response.json({ ...fallback, ...parsed, source: "live" });
  } catch (err) {
    console.log("[AI:mock] guardian-scan —", err instanceof Error ? err.message : err);
    return Response.json(fallback);
  }
}
