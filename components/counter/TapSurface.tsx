"use client";
import { useRef, useCallback } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { DhikrIndex } from "@/lib/storage/schema";

interface TapSurfaceProps {
  dhikrIndex: DhikrIndex;
  onTap?: () => void;
  children: React.ReactNode;
}

export function TapSurface({ dhikrIndex, onTap, children }: TapSurfaceProps) {
  const incrementCount = useSessionStore((s) => s.incrementCount);
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
      incrementCount(dhikrIndex);
      onTap?.();
    },
    [dhikrIndex, incrementCount, onTap]
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
