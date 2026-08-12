import { NextResponse } from "next/server";
import { analyzeRoomVision } from "@/lib/vision";
import type { InstallIntake } from "@/lib/install-types";
import { emptyIntake } from "@/lib/install-types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      roomName?: string;
      sampleKey?: string;
      imageDataUrl?: string | null;
      intake?: InstallIntake;
    };
    const result = await analyzeRoomVision({
      roomName: body.roomName ?? "Room",
      sampleKey: body.sampleKey,
      imageDataUrl: body.imageDataUrl,
      intake: body.intake ?? emptyIntake(),
    });
    return NextResponse.json(result);
  } catch (err) {
    console.log("[AI:mock] /api/install-vision error:", err);
    return NextResponse.json(
      {
        room_detected: "Room",
        sensors: [],
        fall_hazards: [],
        gateway_range_assessment: "Unavailable",
        coverage_score: 0,
        source: "mock",
      },
      { status: 200 }
    );
  }
}
