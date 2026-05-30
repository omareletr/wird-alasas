"use client";
import { motion } from "motion/react";

interface CompletionOverlayProps {
  onDismiss: () => void;
}

export function CompletionOverlay({ onDismiss }: CompletionOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeIn" }}
      onClick={onDismiss}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 cursor-pointer"
    >
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        <p
          dir="rtl"
          lang="ar"
          className="text-4xl text-white"
          style={{ fontFamily: "var(--font-arabic)", lineHeight: 2.2 }}
        >
          تَقَبَّلَ اللَّهُ
        </p>
        <p className="text-[11px] font-mono text-accent tracking-[0.25em] uppercase">
          May Allah accept
        </p>
      </div>
    </motion.div>
  );
}
