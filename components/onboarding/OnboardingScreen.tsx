"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { BismillahHeader } from "@/components/counter/BismillahHeader";
import { ResetTimePicker } from "@/components/ui/reset-time-picker";

export function OnboardingScreen() {
  const resetHour = useSettingsStore((s) => s.resetHour);
  const [selectedHour, setSelectedHour] = useState(resetHour);
  const setResetHour = useSettingsStore((s) => s.setResetHour);
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);

  useEffect(() => {
    setSelectedHour(resetHour);
  }, [resetHour]);

  function handleBegin() {
    setResetHour(selectedHour);
    setHasOnboarded(true);
  }

  return (
    <main
      className="flex flex-col h-dvh w-full bg-background overflow-hidden"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      {/* Welcome */}
      <div className="flex flex-col items-center justify-center flex-1 px-8 gap-5">
        <BismillahHeader />
        <p className="text-sm font-sans text-muted-foreground text-center leading-relaxed max-w-[260px]">
          A quiet space to count your dhikr and keep your daily wird alive.
        </p>
      </div>

      {/* Reset time picker */}
      <div className="flex flex-col px-6 gap-4">
        <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/70 text-center">
          When should your wird reset each day?
        </p>

        <ResetTimePicker value={selectedHour} onChange={setSelectedHour} />

        <button
          onClick={handleBegin}
          className="w-full py-3 rounded-lg bg-foreground text-background text-sm font-sans tracking-[0.15em] uppercase transition-opacity hover:opacity-80 active:opacity-70"
        >
          Begin
        </button>
      </div>
    </main>
  );
}
