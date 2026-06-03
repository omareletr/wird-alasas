"use client";
import { useRef, useCallback } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";
import { useFeedback } from "@/lib/hooks/useFeedback";
import type { DhikrIndex } from "@/lib/storage/schema";

const HUNDRED_MILESTONE = 100;

interface TapSurfaceProps {
  dhikrIndex: DhikrIndex;
  onTap?: () => void;
  children: React.ReactNode;
}

export function TapSurface({ dhikrIndex, onTap, children }: TapSurfaceProps) {
  const incrementCount = useSessionStore((s) => s.incrementCount);
  const { playTapFeedback, playMilestoneFeedback } = useFeedback();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary || pointerStart.current === null) return;
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      pointerStart.current = null;
      if (Math.hypot(dx, dy) > 10) return;

      const { counts, mode } = useSessionStore.getState();
      const currentCount = counts[dhikrIndex];
      const nextCount = currentCount + 1;
      const target = getTarget(ADHKAR[dhikrIndex], mode);
      const hitHundred = currentCount < HUNDRED_MILESTONE && nextCount >= HUNDRED_MILESTONE;
      const hitTarget = currentCount < target && nextCount >= target;

      incrementCount(dhikrIndex);
      if (hitHundred || hitTarget) {
        playMilestoneFeedback();
      } else {
        playTapFeedback();
      }
      onTap?.();
    },
    [dhikrIndex, incrementCount, onTap, playMilestoneFeedback, playTapFeedback]
  );

  const handlePointerCancel = useCallback(() => {
    pointerStart.current = null;
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        touchAction: "pan-x pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
        overscrollBehavior: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      className="w-full h-full"
    >
      {children}
    </div>
  );
}
