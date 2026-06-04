"use client";

import React from "react";
import { ActivityCalendar } from "react-activity-calendar";
import type { Activity, BlockElement } from "react-activity-calendar";
import "react-activity-calendar/tooltips.css";
import { classifyDay } from "@/lib/utils/completionClassifier";
import type { DailyRecord } from "@/lib/storage/schema";
import { useThemeStore } from "@/lib/store/themeStore";

interface HeatmapCalendarProps {
  data: Activity[];
  onDayClick?: (date: string) => void;
}

interface RecordsToActivityDataOptions {
  endDayKey?: string;
  dayCount?: number;
}

const DEFAULT_DAY_COUNT = 91;

function dayLevel(record: DailyRecord): 0 | 1 | 2 | 3 | 4 {
  const level = classifyDay(record.counts, record.mode);
  return level === "full"
    ? 4
    : level === "multi"
      ? 3
      : level === "one"
        ? 2
        : level === "partial"
          ? 1
          : 0;
}

export function formatActivityDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function buildActivityRange(endDayKey: string, dayCount: number = DEFAULT_DAY_COUNT): string[] {
  if (dayCount <= 0) return [];

  const endDate = new Date(`${endDayKey}T00:00:00`);
  return Array.from({ length: dayCount }, (_, index) =>
    formatActivityDate(addDays(endDate, index - dayCount + 1))
  );
}

/**
 * Maps DailyRecord[] to Activity[] for react-activity-calendar.
 *
 * Level mapping (5 levels, 0–4):
 *   none    → level=0, count=0  (no taps)
 *   partial → level=1, count=1  (taps but 0 dhikr completed)
 *   one     → level=2, count=2  (exactly 1 dhikr completed)
 *   multi   → level=3, count=3  (2–3 dhikr completed)
 *   full    → level=4, count=4  (all 4 dhikr completed)
 *
 * Output is sorted ascending by dayKey (ISO strings sort lexicographically).
 */
export function recordsToActivityData(
  records: DailyRecord[],
  options: RecordsToActivityDataOptions = {}
): Activity[] {
  const recordLevels = new Map(records.map((record) => [record.dayKey, dayLevel(record)]));
  const visibleDayKeys =
    options.endDayKey !== undefined
      ? buildActivityRange(options.endDayKey, options.dayCount ?? DEFAULT_DAY_COUNT)
      : null;

  if (visibleDayKeys !== null) {
    return visibleDayKeys.map((dayKey) => {
      const levelNum = recordLevels.get(dayKey) ?? 0;
      return {
        date: dayKey,
        count: levelNum,
        level: levelNum,
      } satisfies Activity;
    });
  }

  return records
    .map((r) => {
      const levelNum = recordLevels.get(r.dayKey) ?? 0;
      return {
        date: r.dayKey,
        count: levelNum,
        level: levelNum,
      } satisfies Activity;
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Colors indexed by level 0–4
const DARK_COLORS = [
  "oklch(0.27 0.01 260)",  // 0 — none
  "oklch(0.65 0.10 70)",   // 1 — partial (faded amber)
  "oklch(0.72 0.18 70)",   // 2 — one (amber)
  "oklch(0.62 0.10 150)",  // 3 — multi (faded green)
  "oklch(0.65 0.18 150)",  // 4 — full (green)
] as const;

const LIGHT_COLORS = [
  "oklch(0.88 0.015 85)",  // 0 — none
  "oklch(0.82 0.08 70)",   // 1 — partial (faded amber)
  "oklch(0.72 0.15 65)",   // 2 — one (amber)
  "oklch(0.78 0.09 150)",  // 3 — multi (faded green)
  "oklch(0.60 0.17 150)",  // 4 — full (green)
] as const;

const CALENDAR_THEME = {
  dark: [...DARK_COLORS],
  light: [...LIGHT_COLORS],
};

/** Minimal color legend for the heatmap levels. */
export function HeatmapLegend() {
  const theme = useThemeStore((s) => s.theme);
  const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
  const legendItems = [
    { color: colors[0], label: "No completion" },
    { color: colors[1], label: "Partial" },
    { color: colors[2], label: "1 of 4" },
    { color: colors[3], label: "2-3 of 4" },
    { color: colors[4], label: "All 4" },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {legendItems.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="text-[9px] font-sans tracking-widest uppercase text-muted-foreground/60">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HeatmapCalendar({ data, onDayClick }: HeatmapCalendarProps) {
  const theme = useThemeStore((s) => s.theme);

  if (data.length === 0) {
    return null;
  }

  return (
    <ActivityCalendar
      data={data}
      maxLevel={4}
      colorScheme={theme}
      theme={CALENDAR_THEME}
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
