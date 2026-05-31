"use client";
import { useRef, useCallback } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useHaptic } from "@/lib/hooks/useHaptic";
import type { DhikrIndex } from "@/lib/storage/schema";

const LONG_PRESS_MS = 500;

interface TapSurfaceProps {
  dhikrIndex: DhikrIndex;
  onTap?: () => void;
  children: React.ReactNode;
}

export function TapSurface({ dhikrIndex, onTap, children }: TapSurfaceProps) {
  const incrementCount = useSessionStore((s) => s.incrementCount);
  const resetCount = useSessionStore((s) => s.resetCount);
  const vibrate = useHaptic();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;
      pointerStart.current = { x: e.clientX, y: e.clientY };
      longPressTriggered.current = false;
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        resetCount(dhikrIndex);
        vibrate(25);
      }, LONG_PRESS_MS);
    },
    [dhikrIndex, resetCount, vibrate]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary || pointerStart.current === null) return;
      cancelLongPress();
      if (longPressTriggered.current) {
        pointerStart.current = null;
        return;
      }
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      pointerStart.current = null;
      if (Math.hypot(dx, dy) > 10) return;
      incrementCount(dhikrIndex);
      onTap?.();
    },
    [dhikrIndex, incrementCount, onTap, cancelLongPress]
  );

  const handlePointerCancel = useCallback(() => {
    cancelLongPress();
    pointerStart.current = null;
    longPressTriggered.current = false;
  }, [cancelLongPress]);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        touchAction: "manipulation",
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
