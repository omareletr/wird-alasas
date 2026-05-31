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
          className="flex items-center justify-center h-10 w-10 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          aria-label="History"
        >
          <History size={18} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-card border-t border-border max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="text-[11px] font-sans tracking-[0.2em] uppercase text-muted-foreground text-left">
            History
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-6">
          {records === null ? (
            <p className="text-[10px] font-sans text-muted-foreground/70">Loading…</p>
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
