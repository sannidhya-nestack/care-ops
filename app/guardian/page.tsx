import { Suspense } from "react";
import { GuardianBoard } from "@/components/guardian/guardian-board";

export default function GuardianPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading Guardian…</div>}>
      <GuardianBoard />
    </Suspense>
  );
}
