"use client";
import { motion } from "motion/react";

const RING_COUNT = 4;

const textContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.35 },
  },
};

const textItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

interface CompletionOverlayProps {
  onDismiss: () => void;
}

export function CompletionOverlay({ onDismiss }: CompletionOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      onClick={onDismiss}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/93 backdrop-blur-xl cursor-pointer overflow-hidden"
    >
      <style>{`
        @keyframes ring-expand {
          0%   { transform: translate(-50%, -50%) scale(0.15); opacity: 0.55; }
          100% { transform: translate(-50%, -50%) scale(3.0);  opacity: 0; }
        }
      `}</style>

      {/* Concentric pulsing rings */}
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 w-44 h-44 rounded-full pointer-events-none"
          style={{
            border: "1px solid oklch(0.72 0.10 70 / 13%)",
            animation: `ring-expand 4.4s ease-out ${i * 1.1}s infinite`,
          }}
        />
      ))}

      {/* Ambient radial glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0, 0.07, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, oklch(0.72 0.10 70 / 100%), transparent)",
        }}
      />

      {/* Text */}
      <motion.div
        variants={textContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center gap-4 px-8 text-center"
      >
        <motion.p
          variants={textItem}
          dir="rtl"
          lang="ar"
          className="text-5xl text-foreground"
          style={{ fontFamily: "var(--font-arabic)", lineHeight: 2 }}
        >
          اللَّهُمَّ بَارِكْ
        </motion.p>

        <motion.p
          variants={textItem}
          dir="rtl"
          lang="ar"
          className="text-2xl text-muted-foreground"
          style={{ fontFamily: "var(--font-arabic)", lineHeight: 2 }}
        >
          تَقَبَّلَ اللَّهُ
        </motion.p>

        <motion.p
          variants={textItem}
          className="text-[11px] font-sans text-accent tracking-[0.25em] uppercase"
        >
          May Allah accept your Dhikr
        </motion.p>
      </motion.div>

      {/* Dismiss hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 2.4, duration: 0.9 }}
        className="absolute bottom-10 text-[10px] font-sans text-muted-foreground tracking-[0.2em] uppercase"
      >
        Tap to continue
      </motion.p>
    </motion.div>
  );
}
