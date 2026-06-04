"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getDailyRecord } from "@/lib/storage/idb";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";
import type { DailyRecord } from "@/lib/storage/schema";

interface DayDetailSheetProps {
  dayKey: string | null;
  records?: DailyRecord[];
  onClose: () => void;
}

export function DayDetailSheet({ dayKey, records = [], onClose }: DayDetailSheetProps) {
  const [record, setRecord] = useState<DailyRecord | null | undefined>(null);

  useEffect(() => {
    if (dayKey !== null) {
      const displayRecord = records.find((item) => item.dayKey === dayKey);
      if (displayRecord !== undefined) {
        setRecord(displayRecord);
        return;
      }

      getDailyRecord(dayKey).then(setRecord);
    } else {
      setRecord(null);
    }
  }, [dayKey, records]);

  if (dayKey === null) return null;

  const formattedDate =
    dayKey !== null
      ? new Date(dayKey + "T00:00:00Z").toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        })
      : "";

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-card px-5 pb-6 pt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground active:bg-muted/60"
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[11px] font-sans tracking-[0.15em] uppercase text-muted-foreground">
          {formattedDate}
        </span>
      </div>

      {/* Content */}
      {record === null ? (
        <p className="text-[10px] font-sans text-muted-foreground/70">Loading…</p>
      ) : record === undefined ? (
        <p className="text-[10px] font-sans text-muted-foreground/70">
          No record for this day
        </p>
      ) : (
        <div className="space-y-3">
          {ADHKAR.map((entry) => {
            const count = record.counts[entry.index] ?? 0;
            const target = getTarget(entry, record.mode);
            const completed = count >= target;
            return (
              <div
                key={entry.index}
                className={`flex items-center justify-between py-2 border-b border-border/30 ${
                  completed ? "text-foreground" : "text-muted-foreground/70"
                }`}
              >
                <span className="text-[10px] font-sans tracking-wide flex-1 mr-4 line-clamp-1">
                  {entry.transliteration}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono tabular-nums">
                    {count}
                    <span className="text-muted-foreground/50"> / </span>
                    {target}
                  </span>
                  {completed && (
                    <span className="text-[11px]" aria-label="complete">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
