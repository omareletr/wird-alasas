"use client";
import { useEffect } from "react";
import { DhikrDeck } from "@/components/counter/DhikrDeck";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";

export default function CounterPage() {
  const { sessionStartedAt, setMode, setSessionStartedAt } = useSessionStore();
  const defaultMode = useSettingsStore((s) => s.defaultMode);

  // Initialize a new session from defaultMode if no session is in progress
  useEffect(() => {
    if (sessionStartedAt === null) {
      setMode(defaultMode);
      setSessionStartedAt(Date.now());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="flex flex-col h-dvh w-full bg-black overflow-hidden">
      <DhikrDeck />
    </main>
  );
}
