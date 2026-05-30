"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getDailyRecord } from "@/lib/storage/idb";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";
import type { DailyRecord } from "@/lib/storage/schema";

interface DayDetailSheetProps {
  dayKey: string | null;
  onClose: () => void;
}

export function DayDetailSheet({ dayKey, onClose }: DayDetailSheetProps) {
  const [record, setRecord] = useState<DailyRecord | null | undefined>(null);

  useEffect(() => {
    if (dayKey !== null) {
      getDailyRecord(dayKey).then(setRecord);
    } else {
      setRecord(null);
    }
  }, [dayKey]);

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
    <div className="absolute inset-0 bg-card z-10 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onClose}
          className="p-1 text-white/50 hover:text-white/80 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-white/50">
          {formattedDate}
        </span>
      </div>

      {/* Content */}
      {record === null ? (
        <p className="text-[10px] font-mono text-white/30">Loading…</p>
      ) : record === undefined ? (
        <p className="text-[10px] font-mono text-white/30">
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
                className={`flex items-center justify-between py-2 border-b border-white/5 ${
                  completed ? "text-white" : "text-white/40"
                }`}
              >
                <span className="text-[10px] font-mono tracking-wide flex-1 mr-4 truncate">
                  {entry.transliteration}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono tabular-nums">
                    {count}
                    <span className="text-white/30"> / </span>
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
