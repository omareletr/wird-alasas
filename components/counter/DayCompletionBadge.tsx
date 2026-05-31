"use client";

import { useSessionStore } from "@/lib/store/sessionStore";
import { classifyDay } from "@/lib/utils/completionClassifier";

export function DayCompletionBadge() {
  const counts = useSessionStore((s) => s.counts);
  const mode = useSessionStore((s) => s.mode);

  const level = classifyDay(counts, mode);

  if (level === "none") return null;

  if (level === "full") {
    return (
      <span className="text-[10px] font-sans tracking-wide uppercase text-green-500 border border-green-500/40 px-2 py-0.5 rounded-full">
        complete
      </span>
    );
  }

  return (
    <span className="text-[10px] font-sans tracking-wide uppercase text-accent border border-accent/40 px-2 py-0.5 rounded-full">
      Partial Completion
    </span>
  );
}
