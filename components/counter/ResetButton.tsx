"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useIsPresent } from "motion/react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useHaptic } from "@/lib/hooks/useHaptic";
import type { DhikrIndex } from "@/lib/storage/schema";

const AUTO_CANCEL_MS = 2500;

interface ResetButtonProps {
  dhikrIndex: DhikrIndex;
}

export function ResetButton({ dhikrIndex }: ResetButtonProps) {
  const resetCount = useSessionStore((s) => s.resetCount);
  const vibrate = useHaptic();
  const isPresent = useIsPresent();
  const [confirming, setConfirming] = useState(false);
  const cancelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCancel = useCallback(() => {
    if (cancelTimer.current) {
      clearTimeout(cancelTimer.current);
      cancelTimer.current = null;
    }
  }, []);

  // Auto-cancel when confirming state expires; also cleans up on unmount
  useEffect(() => {
    if (!confirming) return;
    // Explicitly cancel any prior timer before arming a new one
    clearCancel();
    cancelTimer.current = setTimeout(() => setConfirming(false), AUTO_CANCEL_MS);
    return clearCancel;
  }, [confirming, clearCancel]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Prevent the underlying TapSurface from receiving this pointer event
      e.stopPropagation();
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Guard: ignore if this card is in the process of being removed
      if (!isPresent) return;
      if (!confirming) {
        setConfirming(true);
        vibrate(10);
      } else {
        clearCancel();
        setConfirming(false);
        resetCount(dhikrIndex);
        vibrate(25);
      }
    },
    [confirming, clearCancel, dhikrIndex, isPresent, resetCount, vibrate]
  );

  return (
    <button
      aria-label={confirming ? "Confirm reset" : "Reset counter"}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "text-[11px] font-sans tracking-widest uppercase transition-all duration-200",
        "select-none",
        confirming
          ? "bg-accent/15 text-accent"
          : "text-muted-foreground/40 hover:text-muted-foreground/70",
      ].join(" ")}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <RotateCcw size={12} strokeWidth={2} />
      <span>{confirming ? "Confirm reset?" : "Reset"}</span>
    </button>
  );
}
