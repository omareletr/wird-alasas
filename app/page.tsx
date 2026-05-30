"use client";
import { useEffect } from "react";
import { DhikrDeck } from "@/components/counter/DhikrDeck";
import { ModeToggle } from "@/components/counter/ModeToggle";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useWakeLock } from "@/lib/hooks/useWakeLock";

export default function CounterPage() {
  const { sessionStartedAt, setMode, setSessionStartedAt } = useSessionStore();
  const defaultMode = useSettingsStore((s) => s.defaultMode);

  // Keep the screen awake while the counter is open
  useWakeLock();

  // Initialize a new session from defaultMode if no session is in progress
  useEffect(() => {
    if (sessionStartedAt === null) {
      setMode(defaultMode);
      setSessionStartedAt(Date.now());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="flex flex-col h-dvh w-full bg-black overflow-hidden">
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
    </main>
  );
}
