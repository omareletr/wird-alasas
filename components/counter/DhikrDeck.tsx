"use client";
import { motion, AnimatePresence } from "motion/react";
import { useState, useCallback } from "react";
import { ADHKAR } from "@/lib/data/adhkar";
import { BismillahHeader } from "@/components/counter/BismillahHeader";
import { DhikrCard } from "@/components/counter/DhikrCard";
import { TapSurface } from "@/components/counter/TapSurface";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { DhikrIndex } from "@/lib/storage/schema";
import { IOSInstallCTA } from "@/components/counter/IOSInstallCTA";

const SWIPE_OFFSET_THRESHOLD = 80; // px — horizontal drag before snapping
const SWIPE_VELOCITY_THRESHOLD = 500; // px/s — fast flick counts even at short distance

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%" }),
};

export function DhikrDeck() {
  const activeIndex = useSessionStore((s) => s.activeIndex);
  const setActiveIndex = useSessionStore((s) => s.setActiveIndex);
  const counts = useSessionStore((s) => s.counts);
  const mode = useSessionStore((s) => s.mode);
  const [direction, setDirection] = useState<1 | -1>(1);

  const handleDragEnd = useCallback(
    (
      _e: PointerEvent,
      info: { offset: { x: number }; velocity: { x: number } }
    ) => {
      const { offset, velocity } = info;
      const swipedLeft =
        offset.x < -SWIPE_OFFSET_THRESHOLD ||
        velocity.x < -SWIPE_VELOCITY_THRESHOLD;
      const swipedRight =
        offset.x > SWIPE_OFFSET_THRESHOLD ||
        velocity.x > SWIPE_VELOCITY_THRESHOLD;

      if (swipedLeft && activeIndex < ADHKAR.length - 1) {
        setDirection(1);
        setActiveIndex((activeIndex + 1) as DhikrIndex);
      } else if (swipedRight && activeIndex > 0) {
        setDirection(-1);
        setActiveIndex((activeIndex - 1) as DhikrIndex);
      }
      // No else: dragConstraints spring the card back to x:0 automatically
    },
    [activeIndex, setActiveIndex]
  );

  const entry = ADHKAR[activeIndex];
  const count = counts[activeIndex];

  return (
    <div className="relative flex flex-col w-full h-full">
      {/* Bismillah header — part of the flow, above the swipeable card area */}
      <div className="flex justify-center shrink-0 pt-5 pb-2 pointer-events-none">
        <BismillahHeader />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
            style={{ touchAction: "pan-y" }}
          >
            <TapSurface dhikrIndex={activeIndex}>
              <DhikrCard entry={entry} count={count} mode={mode} dhikrIndex={activeIndex} />
            </TapSurface>
          </motion.div>
        </AnimatePresence>
      </div>
      <IOSInstallCTA />
      <div
        className="flex items-center justify-center gap-2 shrink-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        {ADHKAR.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full bg-foreground"
            animate={{ opacity: i === activeIndex ? 1 : 0.25 }}
            transition={{ duration: 0.2 }}
            style={{ width: 6, height: 6 }}
          />
        ))}
      </div>
    </div>
  );
}
