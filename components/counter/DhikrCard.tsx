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

  useEffect(() => {
    if (count !== prevCount.current) {
      vibrate(10);
      prevCount.current = count;
    }
  });

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8 px-8 select-none">
      {/* Progress ring + count overlay */}
      <div className="relative flex items-center justify-center">
        <ProgressRing count={count} target={target} size={260} strokeWidth={4} />
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
  );
}
