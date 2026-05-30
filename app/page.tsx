"use client";
import { useEffect, useState } from "react";
import { DhikrDeck } from "@/components/counter/DhikrDeck";
import { ModeToggle } from "@/components/counter/ModeToggle";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { CompletionOverlay } from "@/components/counter/CompletionOverlay";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { useFajrRollover } from "@/lib/hooks/useFajrRollover";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { DayCompletionBadge } from "@/components/counter/DayCompletionBadge";
import { HistorySheet } from "@/components/history/HistorySheet";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";

export default function CounterPage() {
  const { sessionStartedAt, setMode, setSessionStartedAt, counts, mode } =
    useSessionStore();
  const defaultMode = useSettingsStore((s) => s.defaultMode);
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  // Keep the screen awake while the counter is open
  useWakeLock();
  // Archive completed day at Fajr and reset session
  useFajrRollover();
  // Silently acquire geolocation for prayer time calculation; status surfaced in SettingsSheet
  useGeolocation();

  // Initialize a new session from defaultMode if no session is in progress
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

  return (
    <main className="relative flex flex-col h-dvh w-full bg-background overflow-hidden">
      {/* Header: left=[ModeToggle, HistorySheet], right=[DayCompletionBadge, SettingsSheet] */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top, 16px)" }}
      >
        <div className="flex items-center gap-1">
          <ModeToggle />
          <HistorySheet />
        </div>
        <div className="flex items-center gap-1">
          <DayCompletionBadge />
          <SettingsSheet />
        </div>
      </div>
      {/* Counter deck fills remaining space */}
      <div className="flex-1 min-h-0">
        <DhikrDeck />
      </div>
      {showOverlay && (
        <CompletionOverlay onDismiss={() => setOverlayDismissed(true)} />
      )}
    </main>
  );
}
