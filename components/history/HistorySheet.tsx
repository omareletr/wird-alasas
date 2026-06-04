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
  type DayAnchorRect,
  recordsToActivityData,
} from "@/components/history/HeatmapCalendar";
import { DayDetailPopover } from "@/components/history/DayDetailPopover";
import { getAllDailyRecords } from "@/lib/storage/idb";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { getDevotionalDay } from "@/lib/utils/devotionalDay";
import { mergeDisplayRecords } from "@/lib/utils/displayRecords";
import { computeStreaks } from "@/lib/utils/streaks";
import type { DailyRecord } from "@/lib/storage/schema";

const HISTORY_GRID_DAY_COUNT = 91;

interface InspectedDay {
  dayKey: string;
  anchorRect: DayAnchorRect;
}

export function HistorySheet() {
  const [records, setRecords] = useState<DailyRecord[] | null>(null);
  const [inspectedDay, setInspectedDay] = useState<InspectedDay | null>(null);
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
  const activityData = recordsToActivityData(displayRecords, {
    endDayKey: currentDayKey,
    dayCount: HISTORY_GRID_DAY_COUNT,
  });
  const streaks = records !== null ? computeStreaks(displayRecords) : { current: 0, longest: 0 };
  const showFirstRunCopy =
    records !== null && records.length === 0 && Object.values(counts).every((count) => count === 0);

  return (
    <Sheet onOpenChange={(open) => {
      if (!open) setInspectedDay(null);
    }}>
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
        <div
          className="flex-1 min-h-0 overflow-y-auto px-5 pb-7 space-y-4 [-webkit-overflow-scrolling:touch]"
          onScroll={() => setInspectedDay(null)}
        >
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
              <section className="space-y-2" aria-labelledby="recent-activity-heading">
                <h3
                  id="recent-activity-heading"
                  className="text-[10px] font-sans tracking-[0.18em] uppercase text-muted-foreground/55"
                >
                  Recent activity
                </h3>
                <HeatmapCalendar
                  data={activityData}
                  onDayInspect={(dayKey, anchorRect) => setInspectedDay({ dayKey, anchorRect })}
                  onDayInspectEnd={() => setInspectedDay(null)}
                />
                <HeatmapLegend />
              </section>
            </>
          )}
        </div>
        <DayDetailPopover
          dayKey={inspectedDay?.dayKey ?? null}
          anchorRect={inspectedDay?.anchorRect ?? null}
          records={displayRecords}
          onClose={() => setInspectedDay(null)}
        />
      </SheetContent>
    </Sheet>
  );
}
