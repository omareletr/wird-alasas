"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ProgressRing } from "@/components/counter/ProgressRing";
import { ResetButton } from "@/components/counter/ResetButton";
import type { DhikrEntry } from "@/lib/data/adhkar";
import { getTarget } from "@/lib/data/adhkar";
import { useHaptic } from "@/lib/hooks/useHaptic";
import type { DhikrIndex } from "@/lib/storage/schema";

interface DhikrCardProps {
  entry: DhikrEntry;
  count: number;
  mode: "full" | "shortened";
  dhikrIndex: DhikrIndex;
}

export function DhikrCard({ entry, count, mode, dhikrIndex }: DhikrCardProps) {
  const target = getTarget(entry, mode);
  const vibrate = useHaptic();
  const prevCount = useRef(count);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (count !== prevCount.current) {
      vibrate(10);
      if (count >= target && prevCount.current < target) {
        setShowPulse(true);
      }
      prevCount.current = count;
    }
  }, [count, target, vibrate]);

  useEffect(() => {
    if (!showPulse) return;
    const id = setTimeout(() => setShowPulse(false), 1100);
    return () => clearTimeout(id);
  }, [showPulse]);

  return (
    <div className="flex flex-col h-full w-full select-none px-8">
      {/* Ring + text — share all remaining space, centered together */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-0">
        {/* Reset button sits just above the ring with breathing room */}
        <div className="flex justify-center shrink-0">
          <ResetButton dhikrIndex={dhikrIndex} />
        </div>

        {/* Progress ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <ProgressRing count={count} target={target} size={220} strokeWidth={4} showPulse={showPulse} />
          <div className="absolute flex flex-col items-center gap-1">
            <motion.span
              key={count}
              className="text-4xl font-mono tabular-nums text-foreground leading-none"
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {count}
            </motion.span>
            <span className="text-[11px] font-mono tracking-widest text-accent">
              [ {target} ]
            </span>
          </div>
        </div>

        {/* Text block */}
        <div className="flex flex-col items-center gap-4 w-full">
        {/* Arabic text */}
        <p
          dir="rtl"
          lang="ar"
          className="text-center text-2xl text-foreground"
          style={{ fontFamily: "var(--font-arabic)", lineHeight: 2.0 }}
        >
          {entry.arabic}
        </p>

        {/* Transliteration */}
        <p className="text-center text-[13px] italic text-muted-foreground leading-relaxed" dir="ltr">
          {entry.transliteration}
        </p>

        {/* Translation */}
        <p className="text-center text-[12px] text-muted-foreground/70 leading-relaxed max-w-xs" dir="ltr">
          {entry.translation}
        </p>
        </div>
      </div>
    </div>
  );
}
