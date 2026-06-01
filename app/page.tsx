"use client";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { DhikrDeck } from "@/components/counter/DhikrDeck";
import { ThemeToggle } from "@/components/counter/ThemeToggle";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { CompletionOverlay } from "@/components/counter/CompletionOverlay";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { useResetTimer } from "@/lib/hooks/useResetTimer";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { DayCompletionBadge } from "@/components/counter/DayCompletionBadge";
import { HistorySheet } from "@/components/history/HistorySheet";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
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

// Read localStorage synchronously to avoid a flash of the onboarding screen
// for returning users while the Zustand store hydrates.
function wasAlreadyOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = JSON.parse(localStorage.getItem("wird-settings") || "{}");
    return stored?.state?.hasOnboarded === true;
  } catch {
    return false;
  }
}

export default function CounterPage() {
  const { sessionStartedAt, setSessionStartedAt, counts, mode } =
    useSessionStore();

  const [overlayDismissed, setOverlayDismissed] = useState(wasSessionAlreadyComplete);

  // showOnboarding starts from localStorage so returning users see no flash.
  // The useEffect syncs it once the store hydrates (catches the OnboardingScreen
  // setting hasOnboarded → true).
  const [showOnboarding, setShowOnboarding] = useState(() => !wasAlreadyOnboarded());
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);
  useEffect(() => {
    if (hasOnboarded) setShowOnboarding(false);
  }, [hasOnboarded]);

  useWakeLock();
  useResetTimer();

  useEffect(() => {
    if (sessionStartedAt === null) {
      setSessionStartedAt(Date.now());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (showOnboarding) return <OnboardingScreen />;

  const allComplete = ADHKAR.every(
    (entry) => counts[entry.index] >= getTarget(entry, mode)
  );
  const showOverlay = allComplete && !overlayDismissed;

  return (
    <main className="relative flex flex-col h-dvh w-full bg-background overflow-hidden">
      <div
        className="grid grid-cols-3 items-center px-5 pb-3 shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
      >
        <div className="flex items-center gap-0">
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
