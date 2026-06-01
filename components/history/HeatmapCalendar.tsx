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
export function recordsToActivityData(records: DailyRecord[]): Activity[] {
  return records
    .map((r) => {
      const level = classifyDay(r.counts, r.mode);
      const levelNum =
        level === "full"
          ? 4
          : level === "multi"
            ? 3
            : level === "one"
              ? 2
              : level === "partial"
                ? 1
                : 0;
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
  "oklch(0.15 0 0)",       // 0 — none
  "oklch(0.65 0.10 70)",   // 1 — partial (faded amber)
  "oklch(0.72 0.18 70)",   // 2 — one (amber)
  "oklch(0.62 0.10 150)",  // 3 — multi (faded green)
  "oklch(0.65 0.18 150)",  // 4 — full (green)
] as const;

const LIGHT_COLORS = [
  "oklch(0.92 0.01 80)",   // 0 — none
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
    { color: colors[1], label: "Partial" },
    { color: colors[2], label: "1 of 4" },
    { color: colors[3], label: "2–3 of 4" },
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
    return (
      <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/60">
        No history yet
      </p>
    );
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
