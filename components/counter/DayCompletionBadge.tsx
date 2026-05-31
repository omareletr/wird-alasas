"use client";

import { motion, AnimatePresence } from "motion/react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { classifyDay } from "@/lib/utils/completionClassifier";

const badgeAnimation = {
  initial: { opacity: 0, scale: 0.75, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.75, filter: "blur(4px)" },
  transition: { type: "spring", stiffness: 400, damping: 22 },
};

export function DayCompletionBadge() {
  const counts = useSessionStore((s) => s.counts);
  const mode = useSessionStore((s) => s.mode);

  const level = classifyDay(counts, mode);

  return (
    <AnimatePresence mode="wait">
      {level !== "none" && (
        level === "full" ? (
          <motion.span
            key="full"
            className="inline-block text-[10px] font-sans tracking-wide uppercase text-green-500 border border-green-500/40 px-2 py-0.5 rounded-full"
            {...badgeAnimation}
          >
            complete
          </motion.span>
        ) : (
          <motion.span
            key="partial"
            className="inline-block whitespace-nowrap text-[10px] font-sans tracking-wide uppercase text-accent border border-accent/40 px-2 py-0.5 rounded-full"
            {...badgeAnimation}
          >
            Partial Completion
          </motion.span>
        )
      )}
    </AnimatePresence>
  );
}
