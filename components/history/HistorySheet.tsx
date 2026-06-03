"use client";

import { useState, useEffect } from "react";
import { History } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StreakDisplay } from "@/components/history/StreakDisplay";
import { HeatmapCalendar, HeatmapLegend, recordsToActivityData } from "@/components/history/HeatmapCalendar";
import { DayDetailSheet } from "@/components/history/DayDetailSheet";
import { getAllDailyRecords } from "@/lib/storage/idb";
import { computeStreaks } from "@/lib/utils/streaks";
import type { DailyRecord } from "@/lib/storage/schema";

export function HistorySheet() {
  const [records, setRecords] = useState<DailyRecord[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    getAllDailyRecords().then(setRecords);
  }, []);

  const activityData = records !== null ? recordsToActivityData(records) : [];
  const streaks = records !== null ? computeStreaks(records) : { current: 0, longest: 0 };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-muted-foreground active:bg-muted/60"
          aria-label="History"
        >
          <History size={18} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[86vh] border-t border-border bg-card">
        <SheetHeader>
          <SheetTitle className="text-[11px] font-sans tracking-[0.2em] uppercase text-muted-foreground text-left">
            History
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-7 space-y-6 [-webkit-overflow-scrolling:touch]">
          {records === null ? (
            <p className="text-sm font-sans text-muted-foreground/70">Loading history...</p>
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-5 text-center">
              <p className="text-sm text-foreground">No completed days yet</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground/75">
                Your daily records will appear here after the first reset.
              </p>
            </div>
          ) : (
            <>
              <StreakDisplay current={streaks.current} longest={streaks.longest} />
              <HeatmapCalendar
                data={activityData}
                onDayClick={(date) => setSelectedDay(date)}
              />
              {activityData.length > 0 && <HeatmapLegend />}
            </>
          )}
        </div>
        <DayDetailSheet
          dayKey={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      </SheetContent>
    </Sheet>
  );
}
