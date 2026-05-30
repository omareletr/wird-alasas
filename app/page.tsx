"use client";
import { useEffect, useState } from "react";
import { DhikrDeck } from "@/components/counter/DhikrDeck";
import { ModeToggle } from "@/components/counter/ModeToggle";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { CompletionOverlay } from "@/components/counter/CompletionOverlay";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";

export default function CounterPage() {
  const { sessionStartedAt, setMode, setSessionStartedAt, counts, mode } =
    useSessionStore();
  const defaultMode = useSettingsStore((s) => s.defaultMode);
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  // Keep the screen awake while the counter is open
  useWakeLock();

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
    <main className="relative flex flex-col h-dvh w-full bg-black overflow-hidden">
      {/* Header: mode toggle on left, settings gear on right */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top, 16px)" }}
      >
        <ModeToggle />
        <SettingsSheet />
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
