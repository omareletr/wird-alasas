"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Check } from "lucide-react";
import { motion, AnimatePresence, useIsPresent } from "motion/react";
import type { Variants } from "motion/react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useHaptic } from "@/lib/hooks/useHaptic";
import type { DhikrIndex } from "@/lib/storage/schema";

const AUTO_CANCEL_MS = 2500;
const DONE_MS = 1400;

const pillVariants: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 3 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
};

type State = "idle" | "confirming" | "done";

interface ResetButtonProps {
  dhikrIndex: DhikrIndex;
}

export function ResetButton({ dhikrIndex }: ResetButtonProps) {
  const resetCount = useSessionStore((s) => s.resetCount);
  const vibrate = useHaptic();
  const isPresent = useIsPresent();
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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isPresent) return;
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
    [state, clearTimer, dhikrIndex, isPresent, resetCount, vibrate]
  );

  return (
    <AnimatePresence mode="wait">
      {state === "confirming" && (
        <motion.button
          key="confirming"
          variants={pillVariants} initial="initial" animate="animate" exit="exit" transition={{ type: "spring", stiffness: 500, damping: 28 }}
          aria-label="Confirm reset"
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans tracking-widest uppercase select-none bg-accent/15 text-accent"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <RotateCcw size={12} strokeWidth={2} />
          <span>Confirm reset?</span>
        </motion.button>
      )}
      {state === "done" && (
        <motion.span
          key="done"
          variants={pillVariants} initial="initial" animate="animate" exit="exit" transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans tracking-widest uppercase select-none text-green-500 border border-green-500/40"
        >
          <Check size={12} strokeWidth={2.5} />
          <span>Reset</span>
        </motion.span>
      )}
      {state === "idle" && (
        <motion.button
          key="idle"
          variants={pillVariants} initial="initial" animate="animate" exit="exit" transition={{ type: "spring", stiffness: 500, damping: 28 }}
          aria-label="Reset counter"
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans tracking-widest uppercase select-none text-muted-foreground/40 hover:text-muted-foreground/70"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <RotateCcw size={12} strokeWidth={2} />
          <span>Reset</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
