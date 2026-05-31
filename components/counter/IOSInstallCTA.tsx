"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Share, X } from "lucide-react";

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
          className="flex items-center justify-center gap-1.5 mb-3"
        >
          <p className="text-[10px] font-sans text-muted-foreground/60 flex items-center gap-1">
            <Share className="w-3 h-3 shrink-0" />
            Add to Home Screen
          </p>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
