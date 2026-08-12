import { NextResponse } from "next/server";
import { answerInstallChat } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { question?: string; context?: string };
    const q = [body.question?.trim(), body.context ? `Context: ${body.context}` : ""]
      .filter(Boolean)
      .join("\n");
    const result = await answerInstallChat(q || "pairing help");
    return NextResponse.json(result);
  } catch (err) {
    console.log("[AI:mock] /api/install-troubleshoot error:", err);
    return NextResponse.json(
      { answer: "Ask about pairing, ~90 ft range, or offline recovery.", source: "mock" },
      { status: 200 }
    );
  }
}
