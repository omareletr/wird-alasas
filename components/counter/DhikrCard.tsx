"use client";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ProgressRing } from "@/components/counter/ProgressRing";
import type { DhikrEntry } from "@/lib/data/adhkar";
import { getTarget } from "@/lib/data/adhkar";
import { useHaptic } from "@/lib/hooks/useHaptic";

interface DhikrCardProps {
  entry: DhikrEntry;
  count: number;
  mode: "full" | "shortened";
}

export function DhikrCard({ entry, count, mode }: DhikrCardProps) {
  const target = getTarget(entry, mode);
  const vibrate = useHaptic();
  const prevCount = useRef(count);

  // Fire haptic feedback whenever count changes (tap-driven)
  useEffect(() => {
    if (count !== prevCount.current) {
      vibrate(10);
      prevCount.current = count;
    }
  });

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6 px-6 select-none">
      {/* Progress ring + count overlay */}
      <div className="relative flex items-center justify-center">
        <ProgressRing count={count} target={target} size={280} strokeWidth={6} />
        <div className="absolute flex flex-col items-center">
          <motion.span
            key={count}
            className="text-5xl font-light tabular-nums text-white"
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {count}
          </motion.span>
          <span className="text-sm text-white/40">/ {target}</span>
        </div>
      </div>

      {/* Arabic text */}
      <p
        dir="rtl"
        lang="ar"
        className="text-center text-2xl text-white/90"
        style={{ fontFamily: "var(--font-arabic)", lineHeight: 2 }}
      >
        {entry.arabic}
      </p>

      {/* Transliteration — always LTR */}
      <p
        className="text-center text-sm text-white/60 italic leading-relaxed"
        dir="ltr"
      >
        {entry.transliteration}
      </p>

      {/* Translation — always LTR */}
      <p
        className="text-center text-sm text-white/40 leading-relaxed max-w-xs"
        dir="ltr"
      >
        {entry.translation}
      </p>
    </div>
  );
}
