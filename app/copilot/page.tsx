import { Suspense } from "react";
import { CopilotBoard } from "@/components/copilot/copilot-board";

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading Ops Copilot…</div>}>
      <CopilotBoard />
    </Suspense>
  );
}
