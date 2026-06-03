"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProgressRing } from "@/components/counter/ProgressRing";
import { ResetButton } from "@/components/counter/ResetButton";
import type { DhikrEntry } from "@/lib/data/adhkar";
import { getTarget } from "@/lib/data/adhkar";
import type { DhikrIndex } from "@/lib/storage/schema";

interface DhikrCardProps {
  entry: DhikrEntry;
  count: number;
  mode: "full" | "shortened";
  dhikrIndex: DhikrIndex;
  isActive?: boolean;
}

export function DhikrCard({ entry, count, mode, dhikrIndex, isActive = true }: DhikrCardProps) {
  const target = getTarget(entry, mode);
  const prevCount = useRef(count);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (count !== prevCount.current) {
      const hitTarget = prevCount.current < target && count >= target;

      if (hitTarget) {
        setShowPulse(true);
      }
      prevCount.current = count;
    }
  }, [count, target]);

  useEffect(() => {
    if (!showPulse) return;
    const id = setTimeout(() => setShowPulse(false), 1100);
    return () => clearTimeout(id);
  }, [showPulse]);

  return (
    <div className="flex h-full w-full select-none flex-col px-6 sm:px-8">
      {/* Ring + text — share all remaining space, centered together */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 py-2 sm:gap-6">
        {/* Progress ring — reset button floats above without affecting layout */}
        <div className="relative flex items-center justify-center shrink-0">
          <AnimatePresence>
            {count > 0 && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-max"
                style={{ bottom: "calc(100% + 14px)" }}
                initial={{ opacity: 0, scale: 0.94, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 30 } }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.08, ease: "easeIn" } }}
              >
                <ResetButton dhikrIndex={dhikrIndex} />
              </motion.div>
            )}
          </AnimatePresence>
          <ProgressRing
            count={count}
            target={target}
            size={220}
            strokeWidth={4}
            showPulse={isActive && showPulse}
            animateProgress={isActive}
          />
          <div className="absolute flex flex-col items-center gap-1">
            <motion.span
              key={count}
              className="text-4xl font-mono tabular-nums text-foreground leading-none sm:text-5xl"
              initial={{ scale: 1.08, y: 1 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 24 }}
            >
              {count}
            </motion.span>
            <span className="text-[11px] font-mono tracking-widest text-accent">
              [ {target} ]
            </span>
          </div>
        </div>

        {/* Text block */}
        <div className="flex w-full max-w-[340px] flex-col items-center gap-3.5 sm:gap-4">
          {/* Arabic text */}
          <p
            dir="rtl"
            lang="ar"
            className="text-center text-[1.45rem] text-foreground sm:text-2xl"
            style={{ fontFamily: "var(--font-arabic)", lineHeight: 1.9 }}
          >
            {entry.arabic}
          </p>

          {/* Transliteration */}
          <p className="text-center text-[13px] italic leading-relaxed text-muted-foreground" dir="ltr">
            {entry.transliteration}
          </p>

          {/* Translation */}
          <p className="max-w-xs text-center text-[12px] leading-relaxed text-muted-foreground/80" dir="ltr">
            {entry.translation}
          </p>
        </div>
      </div>
    </div>
  );
}
