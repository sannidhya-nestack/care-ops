import { sseResponse, paced, type SseEvent } from "@/lib/stream";
import { AI_MODEL } from "@/lib/ai-config";
import { alerts } from "@/data/alerts";
import { familyContacts } from "@/data/familyContacts";
import { customers } from "@/data/customers";
import OpenAI from "openai";

export const runtime = "nodejs";

export type FamilyDraft = {
  subject: string;
  message: string;
  tone_variants: { tone: "Reassuring" | "Action-needed"; message: string }[];
  reading_level: string;
  language: string;
  source: "live" | "mock";
};

function mockDraft(input: {
  alertId: string;
  contactId: string;
  tone: "Reassuring" | "Action-needed";
  language: string;
}): FamilyDraft {
  const alert = alerts.find((a) => a.id === input.alertId) ?? alerts[0]!;
  const contact = familyContacts.find((c) => c.id === input.contactId) ?? familyContacts[0]!;
  const customer = customers.find((c) => c.id === alert.customerId);
  const name = customer?.name.split(" ")[0] ?? "your loved one";

  const lang = input.language || contact.preferred_language;
  const reassuringEn = `Hi ${contact.name.split(" ")[0]},\n\nJust a calm update: our home monitoring noted a “${alert.title.toLowerCase()}” around the usual pattern. ${name} appears to be following a familiar routine — no emergency signal from the care team right now.\n\nWe’ll keep watching and only call if something needs action. You’re always welcome to reply here.\n\n— CareOps care circle`;
  const actionEn = `Hi ${contact.name.split(" ")[0]},\n\nPlease take a moment: we received a “${alert.title}” notice that may need your eyes. Detail: ${alert.detail}\n\nIf you can, check in with ${name} or reply so we know you’ve seen this. If this is an emergency, call local emergency services first.\n\n— CareOps care circle`;

  const reassuringEs = `Hola ${contact.name.split(" ")[0]},\n\nActualización tranquila: el monitoreo del hogar registró “${alert.title}” dentro de un patrón habitual. Por ahora no hay señal de emergencia.\n\nSeguimos atentos.\n\n— Círculo de cuidado CareOps`;
  const actionEs = `Hola ${contact.name.split(" ")[0]},\n\nPor favor revise: recibimos “${alert.title}”. Detalle: ${alert.detail}\n\nSi puede, confirme que está al tanto. En una emergencia, llame primero a los servicios locales.\n\n— Círculo de cuidado CareOps`;

  const reassuring = lang === "es" ? reassuringEs : reassuringEn;
  const action = lang === "es" ? actionEs : actionEn;
  const primary = input.tone === "Action-needed" ? action : reassuring;

  return {
    subject:
      input.tone === "Action-needed"
        ? `Please review: ${alert.title}`
        : `Update: ${alert.title} (routine)`,
    message: primary,
    tone_variants: [
      { tone: "Reassuring", message: reassuring },
      { tone: "Action-needed", message: action },
    ],
    reading_level: "Grade 6–8 plain language",
    language: lang === "es" ? "Spanish" : lang === "fr" ? "French" : "English",
    source: "mock",
  };
}

export async function GET() {
  return Response.json({
    alerts: alerts.map((a) => ({
      ...a,
      customerName: customers.find((c) => c.id === a.customerId)?.name ?? "Resident",
    })),
    contacts: familyContacts,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    alertId?: string;
    contactId?: string;
    tone?: "Reassuring" | "Action-needed";
    language?: string;
  };

  async function* gen(): AsyncGenerator<SseEvent> {
    for await (const step of paced(
      [
        { index: 0, label: "Reading alert payload" },
        { index: 1, label: "Removing sensitive detail" },
        { index: 2, label: "Drafting family language" },
      ],
      300
    )) {
      yield { event: "step", data: step };
    }

    const fallback = mockDraft({
      alertId: body.alertId ?? "al-01",
      contactId: body.contactId ?? "fc-01",
      tone: body.tone ?? "Reassuring",
      language: body.language ?? "en",
    });

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      console.log("[AI:mock] family-draft");
      for await (const word of paced(fallback.message.split(/(?=\s)/), 16)) {
        yield { event: "token", data: { text: word } };
      }
      yield { event: "result", data: fallback };
      return;
    }

    try {
      const alert = alerts.find((a) => a.id === body.alertId) ?? alerts[0]!;
      const contact = familyContacts.find((c) => c.id === body.contactId) ?? familyContacts[0]!;
      const client = new OpenAI({ apiKey: key });
      const completion = await client.chat.completions.create({
        model: AI_MODEL,
        response_format: { type: "json_object" },
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "CareOps Patient & Family Connect. Warm, plain-English, PHI-minimal family updates. Explain routine alerts; never invent diagnoses. JSON: {subject, message, tone_variants:[{tone,message}], reading_level, language}. Tones: Reassuring | Action-needed. No real company names.",
          },
          {
            role: "user",
            content: JSON.stringify({
              alert,
              contact,
              tone: body.tone ?? "Reassuring",
              language: body.language ?? contact.preferred_language,
            }),
          },
        ],
      });
      const text = completion.choices[0]?.message?.content ?? "";
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      const parsed = JSON.parse(text.slice(start, end + 1)) as FamilyDraft;
      console.log("[AI:live] family-draft");
      const message = String(parsed.message ?? fallback.message);
      for await (const word of paced(message.split(/(?=\s)/), 12)) {
        yield { event: "token", data: { text: word } };
      }
      yield {
        event: "result",
        data: { ...fallback, ...parsed, message, source: "live" },
      };
    } catch (err) {
      console.log("[AI:mock] family-draft —", err instanceof Error ? err.message : err);
      yield { event: "result", data: fallback };
    }
  }

  return sseResponse(gen());
}
