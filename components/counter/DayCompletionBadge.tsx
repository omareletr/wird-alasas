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
      <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400">
        complete
      </span>
    );
  }

  // partial
  return (
    <span className="text-[10px] font-mono tracking-widest uppercase text-white/40">
      partial
    </span>
  );
}
