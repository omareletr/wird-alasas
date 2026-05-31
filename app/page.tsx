"use client";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { DhikrDeck } from "@/components/counter/DhikrDeck";
import { ModeToggle } from "@/components/counter/ModeToggle";
import { ThemeToggle } from "@/components/counter/ThemeToggle";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { CompletionOverlay } from "@/components/counter/CompletionOverlay";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { useFajrRollover } from "@/lib/hooks/useFajrRollover";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { DayCompletionBadge } from "@/components/counter/DayCompletionBadge";
import { HistorySheet } from "@/components/history/HistorySheet";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";

function wasSessionAlreadyComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = JSON.parse(localStorage.getItem("wird-session") || "{}");
    const { counts = {}, mode = "full" } = stored?.state ?? {};
    return ADHKAR.every((e) => (counts[e.index] ?? 0) >= getTarget(e, mode));
  } catch {
    return false;
  }
}

export default function CounterPage() {
  const { sessionStartedAt, setMode, setSessionStartedAt, counts, mode } =
    useSessionStore();
  const defaultMode = useSettingsStore((s) => s.defaultMode);

  // Initialize dismissed if session was already complete when the page loaded,
  // so reloading a finished session doesn't re-show the overlay.
  const [overlayDismissed, setOverlayDismissed] = useState(wasSessionAlreadyComplete);

  useWakeLock();
  useFajrRollover();
  useGeolocation();

  useEffect(() => {
    if (sessionStartedAt === null) {
      setMode(defaultMode);
      setSessionStartedAt(Date.now());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allComplete = ADHKAR.every(
    (entry) => counts[entry.index] >= getTarget(entry, mode)
  );
  const showOverlay = allComplete && !overlayDismissed;

  // Auto-dismiss the overlay after 2 seconds
  useEffect(() => {
    if (!showOverlay) return;
    const timer = setTimeout(() => setOverlayDismissed(true), 2000);
    return () => clearTimeout(timer);
  }, [showOverlay]);

  return (
    <main className="relative flex flex-col h-dvh w-full bg-background overflow-hidden">
      {/* Header: three-column — left controls / app name / right controls */}
      <div
        className="grid grid-cols-3 items-center px-5 pb-3 shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top, 20px)" }}
      >
        <div className="flex items-center gap-0">
          <ModeToggle />
          <HistorySheet />
        </div>
        <div className="flex items-center justify-center">
          <DayCompletionBadge />
        </div>
        <div className="flex items-center gap-0 justify-end">
          <ThemeToggle />
          <SettingsSheet />
        </div>
      </div>
      {/* Counter deck fills remaining space */}
      <div className="flex-1 min-h-0">
        <DhikrDeck />
      </div>
      <AnimatePresence>
        {showOverlay && (
          <CompletionOverlay onDismiss={() => setOverlayDismissed(true)} />
        )}
      </AnimatePresence>
      <InstallPrompt />
    </main>
  );
}
