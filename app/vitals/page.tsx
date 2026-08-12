import { Metadata } from "next";
import { VitalIntelligenceBoard } from "@/components/vitals/vital-board";

export const metadata: Metadata = {
  title: "Vital Intelligence | CareOps AI",
  description: "Deterioration Early-Warning Score (EWS), Heart Rate + Immobility Fusion, and SBAR Shift Handoff for connected care.",
};

export default function VitalsPage() {
  return <VitalIntelligenceBoard />;
}
