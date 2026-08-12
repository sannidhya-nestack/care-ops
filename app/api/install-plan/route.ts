import { NextResponse } from "next/server";
import { generateInstallPlan } from "@/lib/ai";
import { mockAggregatedPlan } from "@/lib/vision-mock";
import type { AggregatedInstallPlan, InstallIntake, RoomVisionResult } from "@/lib/install-types";
import { emptyIntake } from "@/lib/install-types";
import { DEVICE_LABEL, normalizeDeviceType } from "@/data/devices";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mode?: "plan" | "aggregate";
      homeDescription?: string;
      rooms?: string[];
      gatewayLocation?: string;
      intake?: InstallIntake;
      visions?: { room: string; result: RoomVisionResult }[];
    };

    if (body.mode === "aggregate" && body.visions?.length) {
      const intake = body.intake ?? emptyIntake();
      const aggregated = mockAggregatedPlan(intake, body.visions);
      // Enrich with AI checklist when possible
      const legacy = await generateInstallPlan({
        homeDescription: JSON.stringify({
          dwelling: intake.dwellingType,
          construction: intake.construction,
          wifi: intake.wifiQuality,
          mobility: intake.mobilityAid,
          fallHistory: intake.fallHistory,
        }),
        rooms: intake.rooms.map((r) => r.name),
        gatewayLocation: intake.gatewayLocation || "Living room",
      });
      const merged: AggregatedInstallPlan = {
        ...aggregated,
        install_checklist: legacy.install_checklist?.length
          ? legacy.install_checklist
          : aggregated.install_checklist,
        warnings: Array.from(new Set([...aggregated.warnings, ...(legacy.warnings ?? [])])),
        source: legacy.source === "live" ? "live" : aggregated.source,
        placement_plan: aggregated.placement_plan.map((p) => ({
          ...p,
          type: normalizeDeviceType(p.type),
        })),
        bill_of_materials: aggregated.bill_of_materials.map((b) => ({
          ...b,
          type: normalizeDeviceType(b.type),
        })),
      };
      return NextResponse.json(merged);
    }

    const result = await generateInstallPlan({
      homeDescription: body.homeDescription ?? "",
      rooms: body.rooms ?? [],
      gatewayLocation: body.gatewayLocation ?? "Living room",
    });
    return NextResponse.json({
      ...result,
      placement_plan: result.placement_plan.map((p) => ({
        room: p.room,
        type: normalizeDeviceType(p.sensor_type),
        placement: p.sensor_type,
        within_range: p.within_range,
        reasoning: p.rationale,
        label: DEVICE_LABEL[normalizeDeviceType(p.sensor_type)],
      })),
    });
  } catch (err) {
    console.log("[AI:mock] /api/install-plan handler error:", err);
    return NextResponse.json(
      {
        placement_plan: [],
        install_checklist: ["Review layout manually."],
        warnings: ["Install plan unavailable."],
        bill_of_materials: [],
        fall_hazards: [],
        hazard_summary: { high: 0, med: 0, low: 0, total: 0 },
        source: "mock",
      },
      { status: 200 }
    );
  }
}
