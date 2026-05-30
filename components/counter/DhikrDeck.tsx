"use client";
import { motion, useAnimation } from "motion/react";
import { useCallback } from "react";
import { ADHKAR } from "@/lib/data/adhkar";
import { DhikrCard } from "@/components/counter/DhikrCard";
import { TapSurface } from "@/components/counter/TapSurface";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { DhikrIndex } from "@/lib/storage/schema";

const SWIPE_OFFSET_THRESHOLD = 80; // px — horizontal drag before snapping
const SWIPE_VELOCITY_THRESHOLD = 500; // px/s — fast flick counts even at short distance

export function DhikrDeck() {
  const activeIndex = useSessionStore((s) => s.activeIndex);
  const setActiveIndex = useSessionStore((s) => s.setActiveIndex);
  const counts = useSessionStore((s) => s.counts);
  const mode = useSessionStore((s) => s.mode);
  const controls = useAnimation();

  const handleDragEnd = useCallback(
    async (
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

      let newIndex = activeIndex;
      if (swipedLeft && activeIndex < ADHKAR.length - 1) {
        newIndex = (activeIndex + 1) as DhikrIndex;
      } else if (swipedRight && activeIndex > 0) {
        newIndex = (activeIndex - 1) as DhikrIndex;
      }

      // Snap back to center regardless (dragMomentum:false + this animate ensures clean state)
      await controls.start({ x: 0, transition: { duration: 0.1 } });
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    },
    [activeIndex, setActiveIndex, controls]
  );

  const entry = ADHKAR[activeIndex];
  const count = counts[activeIndex];

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="w-full h-full"
      style={{ touchAction: "pan-y" }} // allow vertical scroll; handle horizontal drag
    >
      <TapSurface dhikrIndex={activeIndex}>
        <DhikrCard entry={entry} count={count} mode={mode} />
      </TapSurface>
    </motion.div>
  );
}
