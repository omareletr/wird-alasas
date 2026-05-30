"use client";
import { useEffect } from "react";
import { ADHKAR } from "@/lib/data/adhkar";
import { DhikrCard } from "@/components/counter/DhikrCard";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";

export default function CounterPage() {
  const { activeIndex, counts, mode, sessionStartedAt, setMode, setSessionStartedAt } =
    useSessionStore();
  const defaultMode = useSettingsStore((s) => s.defaultMode);

  // Initialize a new session from defaultMode if no session is in progress
  useEffect(() => {
    if (sessionStartedAt === null) {
      setMode(defaultMode);
      setSessionStartedAt(Date.now());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const entry = ADHKAR[activeIndex];
  const count = counts[activeIndex];

  return (
    <main className="flex flex-col h-dvh w-full bg-black overflow-hidden">
      <DhikrCard entry={entry} count={count} mode={mode} />
    </main>
  );
}
