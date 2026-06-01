"use client";

import { useState } from "react";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { BismillahHeader } from "@/components/counter/BismillahHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIME_OPTIONS } from "@/lib/utils/timeOptions";

export function OnboardingScreen() {
  const [selectedHour, setSelectedHour] = useState(5);
  const setResetHour = useSettingsStore((s) => s.setResetHour);
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);

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

        <Select
          value={String(selectedHour)}
          onValueChange={(v) => setSelectedHour(Number(v))}
        >
          <SelectTrigger className="w-full font-sans text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)} className="font-sans text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
