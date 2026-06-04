"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { cn } from "@/lib/utils";
import type { DhikrIndex } from "@/lib/storage/schema";

const AUTO_CANCEL_MS = 2500;
const DONE_MS = 1400;

type State = "idle" | "confirming" | "done";

interface ResetButtonProps {
  dhikrIndex: DhikrIndex;
}

export function ResetButton({ dhikrIndex }: ResetButtonProps) {
  const resetCount = useSessionStore((s) => s.resetCount);
  const vibrate = useHaptic();
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    if (state === "confirming") {
      clearTimer();
      timer.current = setTimeout(() => setState("idle"), AUTO_CANCEL_MS);
    } else if (state === "done") {
      clearTimer();
      timer.current = setTimeout(() => setState("idle"), DONE_MS);
    }
    return clearTimer;
  }, [state, clearTimer]);

  const stopTapSurfacePropagation = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (state === "idle") {
        setState("confirming");
        vibrate(10);
      } else if (state === "confirming") {
        clearTimer();
        resetCount(dhikrIndex);
        setState("done");
        vibrate(25);
      }
    },
    [state, clearTimer, dhikrIndex, resetCount, vibrate]
  );

  const isConfirming = state === "confirming";
  const isDone = state === "done";
  const Icon = isDone ? Check : RotateCcw;
  const label = isConfirming ? "Confirm reset?" : "Reset";

  return (
    <motion.button
      type="button"
      data-counter-control
      aria-disabled={isDone}
      aria-label={isConfirming ? "Confirm reset" : "Reset counter"}
      aria-live="polite"
      layout={!prefersReducedMotion}
      whileTap={!prefersReducedMotion && !isDone ? { scale: 0.97 } : undefined}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { layout: { type: "spring", stiffness: 500, damping: 35, mass: 0.6 } }
      }
      onPointerDown={stopTapSurfacePropagation}
      onPointerUp={stopTapSurfacePropagation}
      onPointerCancel={stopTapSurfacePropagation}
      onClick={handleClick}
      className={cn(
        isConfirming &&
          "flex min-h-9 items-center gap-1.5 rounded-full bg-accent/18 px-3 py-1.5 text-[11px] font-sans tracking-widest text-accent uppercase ring-1 ring-accent/25 select-none",
        isDone &&
          "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-green-500/40 px-3 py-1.5 text-[11px] font-sans tracking-widest text-green-500 uppercase select-none",
        !isConfirming &&
          !isDone &&
          "flex min-h-9 items-center gap-1.5 text-[11px] font-sans tracking-widest text-muted-foreground/80 uppercase select-none hover:text-foreground"
      )}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <motion.span
        key={state}
        className="inline-flex items-center gap-1.5"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
      >
        <Icon size={12} strokeWidth={isDone ? 2.5 : 2} />
        <span>{label}</span>
      </motion.span>
    </motion.button>
  );
}
