"use client";

import { useState } from "react";
import { useSettingsStore } from "@/lib/store/settingsStore";

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

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
        <h1 className="font-heading text-2xl tracking-tight text-foreground">
          wird الأساس
        </h1>
        <p className="text-[11px] font-sans tracking-[0.25em] uppercase text-muted-foreground text-center">
          Your daily wird, beautifully simple
        </p>
        <p className="text-sm font-sans text-muted-foreground text-center leading-relaxed max-w-[260px]">
          A quiet space to count your dhikr and keep your daily wird alive.
        </p>
      </div>

      {/* Reset time picker */}
      <div className="flex flex-col px-6 gap-4">
        <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/70 text-center">
          When should your wird reset each day?
        </p>

        {/* 4 rows × 6 cols: 12am–11pm */}
        <div className="grid grid-cols-6 gap-2">
          {HOURS.map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHour(h)}
              className={[
                "text-[10px] font-sans tracking-wide rounded-md py-2 transition-colors",
                selectedHour === h
                  ? "bg-accent text-accent-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              ].join(" ")}
            >
              {formatHour(h)}
            </button>
          ))}
        </div>

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
