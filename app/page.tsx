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

export default function CounterPage() {
  const { sessionStartedAt, setSessionStartedAt, counts, mode } =
    useSessionStore();

  const [mounted, setMounted] = useState(false);
  const [storesHydrated, setStoresHydrated] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [overlayHydrationChecked, setOverlayHydrationChecked] = useState(false);

  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);

  useEffect(() => {
    setMounted(true);

    const updateHydrationState = () => {
      setStoresHydrated(
        useSessionStore.persist.hasHydrated() &&
          useSettingsStore.persist.hasHydrated()
      );
    };

    updateHydrationState();
    const unsubscribeSession =
      useSessionStore.persist.onFinishHydration(updateHydrationState);
    const unsubscribeSettings =
      useSettingsStore.persist.onFinishHydration(updateHydrationState);

    return () => {
      unsubscribeSession();
      unsubscribeSettings();
    };
  }, []);

  useWakeLock();
  useResetTimer(mounted && storesHydrated);

  useEffect(() => {
    if (mounted && storesHydrated && sessionStartedAt === null) {
      setSessionStartedAt(Date.now());
    }
  }, [mounted, sessionStartedAt, setSessionStartedAt, storesHydrated]);

  const allComplete = ADHKAR.every(
    (entry) => counts[entry.index] >= getTarget(entry, mode)
  );

  useEffect(() => {
    if (!mounted || !storesHydrated || overlayHydrationChecked) return;
    setOverlayDismissed(allComplete);
    setOverlayHydrationChecked(true);
  }, [allComplete, mounted, overlayHydrationChecked, storesHydrated]);

  if (!mounted || !storesHydrated) {
    return <main className="h-dvh w-full bg-background" />;
  }

  if (!hasOnboarded) return <OnboardingScreen />;

  const showOverlay = allComplete && !overlayDismissed;

  return (
    <main className="relative flex flex-col h-dvh w-full bg-background overflow-hidden">
      <div
        className="grid grid-cols-3 items-center px-4 pb-2 shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
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
