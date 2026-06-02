"use client";
import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { motion, AnimatePresence } from "motion/react";
import { Share, SquarePlus, X } from "lucide-react";

const STORAGE_KEY = "install-prompt-dismissed";

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function IOSInstallCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    if (!isIOS() || isStandalone() || localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mx-4 mb-3 rounded-2xl bg-card border border-border px-4 py-3 flex items-start gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-sans tracking-[0.15em] uppercase text-foreground">
              Add to Home Screen
            </p>
            <p className="text-[10px] font-sans text-muted-foreground mt-1 leading-relaxed flex items-center flex-wrap gap-x-1">
              Tap
              <Share className="w-3 h-3 shrink-0 inline-block" />
              then
              <SquarePlus className="w-3 h-3 shrink-0 inline-block" />
              Add to Home Screen to keep your streak safe.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-muted-foreground/70 hover:text-muted-foreground transition-colors mt-0.5"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
