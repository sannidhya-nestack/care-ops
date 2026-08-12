import { Suspense } from "react";
import { FamilyBoard } from "@/components/family/family-board";

export default function FamilyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading Patient & Family Connect…</div>}>
      <FamilyBoard />
    </Suspense>
  );
}
