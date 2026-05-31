"use client";
import { motion } from "motion/react";

export function BismillahHeader() {
  return (
    <motion.div
      className="flex flex-col items-center gap-5 select-none pointer-events-none"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
    >
      {/* Bismillah ligature — U+FDFD renders as wide ornate calligraphic form in Amiri */}
      <p
        dir="rtl"
        lang="ar"
        className="text-muted-foreground leading-none"
        style={{
          fontFamily: "var(--font-amiri)",
          fontSize: "clamp(24px, 6vw, 36px)",
        }}
      >
        ﷽
      </p>

      {/* Subtitle row */}
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
          AL WIRD AL-ASAS
        </span>
        <span className="text-muted-foreground/60 text-[10px]">✦</span>
        <span
          dir="rtl"
          lang="ar"
          className="text-[13px] text-muted-foreground"
          style={{ fontFamily: "var(--font-arabic)" }}
        >
          الورد الأساس
        </span>
      </div>
    </motion.div>
  );
}
