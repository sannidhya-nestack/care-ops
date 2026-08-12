import { PageTransition } from "@/components/motion/ai-motion";

export function PlaceholderModule({ title }: { title: string }) {
  return (
    <PageTransition>
      <div className="flex h-full items-center justify-center p-8">
        <h1 className="font-display text-2xl font-semibold text-slate-900">{title}</h1>
      </div>
    </PageTransition>
  );
}
