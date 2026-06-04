"use client";

import { useState, useEffect, useMemo } from "react";
import { Flame } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StreakDisplay } from "@/components/history/StreakDisplay";
import {
  HeatmapCalendar,
  HeatmapLegend,
  recordsToActivityData,
} from "@/components/history/HeatmapCalendar";
import { DayDetailSheet } from "@/components/history/DayDetailSheet";
import { getAllDailyRecords } from "@/lib/storage/idb";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { getDevotionalDay } from "@/lib/utils/devotionalDay";
import { mergeDisplayRecords } from "@/lib/utils/displayRecords";
import { computeStreaks } from "@/lib/utils/streaks";
import type { DailyRecord } from "@/lib/storage/schema";

export function HistorySheet() {
  const [records, setRecords] = useState<DailyRecord[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const counts = useSessionStore((s) => s.counts);
  const mode = useSessionStore((s) => s.mode);
  const resetHour = useSettingsStore((s) => s.resetHour);

  useEffect(() => {
    getAllDailyRecords().then(setRecords);
  }, []);

  const currentDayKey = getDevotionalDay(new Date(), resetHour);
  const liveRecord = useMemo<DailyRecord>(
    () => ({
      dayKey: currentDayKey,
      counts,
      mode,
      completedAt: Date.now(),
    }),
    [counts, currentDayKey, mode]
  );
  const displayRecords = useMemo(
    () => (records !== null ? mergeDisplayRecords(records, liveRecord) : []),
    [records, liveRecord]
  );
  const activityData = recordsToActivityData(displayRecords, { endDayKey: currentDayKey });
  const streaks = records !== null ? computeStreaks(displayRecords) : { current: 0, longest: 0 };
  const showFirstRunCopy =
    records !== null && records.length === 0 && Object.values(counts).every((count) => count === 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground active:bg-muted/60"
          aria-label="Streaks"
        >
          <Flame size={18} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[86vh] border-t border-border bg-card">
        <SheetHeader>
          <SheetTitle className="text-[11px] font-sans tracking-[0.2em] uppercase text-muted-foreground text-left">
            Streaks
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-7 space-y-6 [-webkit-overflow-scrolling:touch]">
          {records === null ? (
            <p className="text-sm font-sans text-muted-foreground/70">Loading streaks...</p>
          ) : (
            <>
              <StreakDisplay current={streaks.current} longest={streaks.longest} />
              {showFirstRunCopy && (
                <p className="text-xs leading-relaxed text-muted-foreground/70">
                  Your activity grid is ready. Today&apos;s progress appears here as soon as you count.
                </p>
              )}
              <HeatmapCalendar
                data={activityData}
                onDayClick={(date) => setSelectedDay(date)}
              />
              <HeatmapLegend />
            </>
          )}
        </div>
        <DayDetailSheet
          dayKey={selectedDay}
          records={displayRecords}
          onClose={() => setSelectedDay(null)}
        />
      </SheetContent>
    </Sheet>
  );
}
