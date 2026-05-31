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
    <div className="relative h-full w-full select-none">
      {/* Reset button — sits just above the progress ring */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex justify-center"
        style={{ top: "calc(40% - 182px)" }}
      >
        <ResetButton dhikrIndex={dhikrIndex} />
      </div>

      {/* Progress ring — center pinned at 40% of card height on every card */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: "calc(40% - 130px)" }}
      >
        <div className="relative flex items-center justify-center">
          <ProgressRing count={count} target={target} size={260} strokeWidth={4} showPulse={showPulse} />
          <div className="absolute flex flex-col items-center gap-1">
            <motion.span
              key={count}
              className="text-5xl font-mono tabular-nums text-foreground leading-none"
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
      </div>

      {/* Text — always 32px below ring bottom; text may vary, ring does not */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center gap-6 px-8"
        style={{ top: "calc(40% + 162px)" }}
      >
        {/* Arabic text */}
        <p
          dir="rtl"
          lang="ar"
          className="text-center text-3xl text-foreground"
          style={{ fontFamily: "var(--font-arabic)", lineHeight: 2.2 }}
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
  );
}
