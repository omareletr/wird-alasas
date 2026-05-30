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
import { HeatmapCalendar, recordsToActivityData } from "@/components/history/HeatmapCalendar";
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
          className="p-2 text-white/30 hover:text-white/60 transition-colors"
          aria-label="History"
        >
          <History size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-card border-t border-border">
        <SheetHeader>
          <SheetTitle className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/50 text-left">
            History
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {records === null ? (
            <p className="text-[10px] font-mono text-white/30">Loading…</p>
          ) : (
            <>
              <StreakDisplay current={streaks.current} longest={streaks.longest} />
              <HeatmapCalendar
                data={activityData}
                onDayClick={(date) => setSelectedDay(date)}
              />
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
