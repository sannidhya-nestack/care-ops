import { NextResponse } from "next/server";
import { generatePlacementBlueprint } from "@/lib/imagegen";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: string };
    const result = await generatePlacementBlueprint(body.prompt ?? "CareOps home layout");
    return NextResponse.json(result);
  } catch (err) {
    console.log("[AI:mock] /api/install-blueprint error:", err);
    return NextResponse.json(
      { imageUrl: null, svgMarkup: null, source: "mock" },
      { status: 200 }
    );
  }
}
