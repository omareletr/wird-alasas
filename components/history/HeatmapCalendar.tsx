"use client";

import React from "react";
import { ActivityCalendar } from "react-activity-calendar";
import type { Activity, BlockElement } from "react-activity-calendar";
import "react-activity-calendar/tooltips.css";
import { classifyDay } from "@/lib/utils/completionClassifier";
import type { DailyRecord } from "@/lib/storage/schema";

interface HeatmapCalendarProps {
  data: Activity[];
  onDayClick?: (date: string) => void;
}

/**
 * Maps DailyRecord[] to Activity[] for react-activity-calendar.
 *
 * Level mapping:
 *   none    → level=0, count=0
 *   partial → level=1, count=1
 *   full    → level=2, count=2
 *
 * Output is sorted ascending by dayKey (ISO strings sort lexicographically).
 */
export function recordsToActivityData(records: DailyRecord[]): Activity[] {
  return records
    .map((r) => {
      const level = classifyDay(r.counts, r.mode);
      const levelNum = level === "full" ? 2 : level === "partial" ? 1 : 0;
      return {
        date: r.dayKey,
        count: levelNum,
        level: levelNum,
      } satisfies Activity;
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function HeatmapCalendar({ data, onDayClick }: HeatmapCalendarProps) {
  if (data.length === 0) {
    return (
      <p className="text-[10px] font-mono tracking-widest uppercase text-white/30">
        No history yet
      </p>
    );
  }

  return (
    <ActivityCalendar
      data={data}
      maxLevel={2}
      colorScheme="dark"
      theme={{
        dark: [
          "oklch(0.15 0 0)",
          "oklch(0.55 0 0)",
          "oklch(0.72 0.10 70)",
        ],
      }}
      blockSize={12}
      blockMargin={3}
      fontSize={10}
      renderBlock={(block: BlockElement, activity: Activity) =>
        React.cloneElement(block, {
          onClick: () => onDayClick?.(activity.date),
          style: { cursor: onDayClick ? "pointer" : "default" },
        })
      }
    />
  );
}
