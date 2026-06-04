"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import type { Activity, BlockElement } from "react-activity-calendar";
import "react-activity-calendar/tooltips.css";
import { classifyDay } from "@/lib/utils/completionClassifier";
import type { DailyRecord } from "@/lib/storage/schema";
import { useFeedback } from "@/lib/hooks/useFeedback";
import { useThemeStore } from "@/lib/store/themeStore";

export interface DayAnchorRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

interface HeatmapCalendarProps {
  data: Activity[];
  onDayInspect?: (date: string, anchorRect: DayAnchorRect) => void;
  onDayInspectEnd?: () => void;
}

interface PressSession {
  pointerId: number;
  activated: boolean;
  latestDay: string | null;
  latestCell: SVGRectElement | null;
  inspectedDay: string | null;
}

interface RecordsToActivityDataOptions {
  endDayKey?: string;
  dayCount?: number;
}

const DEFAULT_DAY_COUNT = 91;
const BLOCK_MARGIN = 3;
const MIN_BLOCK_SIZE = 12;
const MAX_BLOCK_SIZE = 22;
const FALLBACK_BLOCK_SIZE = 18;
const LONG_PRESS_MS = 400;

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

const LEGEND_ITEMS = [
  { label: "No completion", colorIndex: 0 },
  { label: "Partial", colorIndex: 1 },
  { label: "1 of 4", colorIndex: 2 },
  { label: "2-3 of 4", colorIndex: 3 },
  { label: "All 4", colorIndex: 4 },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getWeekCount(data: Activity[]): number {
  if (data.length === 0) return 0;

  const firstDate = new Date(`${data[0].date}T00:00:00`);
  const leadingDays = firstDate.getDay();
  return Math.ceil((data.length + leadingDays) / 7);
}

function toAnchorRect(rect: DOMRect): DayAnchorRect {
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

/** Semantic color legend for the heatmap completion levels. */
export function HeatmapLegend() {
  const theme = useThemeStore((s) => s.theme);
  const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[9px] font-sans tracking-[0.12em] uppercase text-muted-foreground/60">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: colors[item.colorIndex] }}
            aria-hidden="true"
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HeatmapCalendar({ data, onDayInspect, onDayInspectEnd }: HeatmapCalendarProps) {
  const theme = useThemeStore((s) => s.theme);
  const { playTapFeedback } = useFeedback();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressSessionRef = useRef<PressSession | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const weekCount = useMemo(() => getWeekCount(data), [data]);
  const blockSize = useMemo(() => {
    if (containerWidth <= 0 || weekCount <= 0) return FALLBACK_BLOCK_SIZE;

    const availableForBlocks = containerWidth - BLOCK_MARGIN * (weekCount - 1);
    return clamp(
      Math.floor(availableForBlocks / weekCount),
      MIN_BLOCK_SIZE,
      MAX_BLOCK_SIZE
    );
  }, [containerWidth, weekCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const updateWidth = () => setContainerWidth(container.clientWidth);
    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry !== undefined) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const clearLongPress = () => {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      pressSessionRef.current = null;
    };

    document.addEventListener("scroll", clearLongPress, true);
    return () => {
      clearLongPress();
      document.removeEventListener("scroll", clearLongPress, true);
    };
  }, []);

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function inspectDay(date: string, element: SVGRectElement) {
    onDayInspect?.(date, toAnchorRect(element.getBoundingClientRect()));
  }

  function findDayCellFromPoint(clientX: number, clientY: number): SVGRectElement | null {
    if (typeof document.elementsFromPoint === "function") {
      for (const element of document.elementsFromPoint(clientX, clientY)) {
        const cell = element.closest<SVGRectElement>("[data-heatmap-day]");
        if (cell !== null) return cell;
      }
    }

    const element = document.elementFromPoint(clientX, clientY);
    return element?.closest<SVGRectElement>("[data-heatmap-day]") ?? null;
  }

  function updateLatestCellFromPointer(event: React.PointerEvent<SVGRectElement>) {
    const session = pressSessionRef.current;
    if (session === null || session.pointerId !== event.pointerId) return null;

    const cell = findDayCellFromPoint(event.clientX, event.clientY);
    const day = cell?.dataset.heatmapDay ?? null;
    session.latestCell = cell;
    session.latestDay = day;

    return { cell, day };
  }

  function activatePressSession() {
    longPressTimerRef.current = null;
    const session = pressSessionRef.current;
    if (session === null || session.latestCell === null || session.latestDay === null) return;

    session.activated = true;
    session.inspectedDay = session.latestDay;
    inspectDay(session.latestDay, session.latestCell);
    playTapFeedback();
  }

  function clearPressSession(closeActivatedPopover: boolean) {
    clearLongPressTimer();
    const wasActivated = pressSessionRef.current?.activated === true;
    pressSessionRef.current = null;

    if (closeActivatedPopover && wasActivated) {
      onDayInspectEnd?.();
    }
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <ActivityCalendar
        data={data}
        maxLevel={4}
        colorScheme={theme}
        theme={CALENDAR_THEME}
        blockSize={blockSize}
        blockMargin={BLOCK_MARGIN}
        blockRadius={2}
        fontSize={9}
        showColorLegend={false}
        showMonthLabels
        showTotalCount={false}
        showWeekdayLabels={false}
        className="!w-full [&_.react-activity-calendar__scroll-container]:!overflow-x-hidden"
        renderBlock={(block: BlockElement, activity: Activity) =>
          React.cloneElement(block, {
            role: "button",
            tabIndex: 0,
            "aria-label": `View activity for ${new Date(
              `${activity.date}T00:00:00Z`
            ).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}`,
            "data-heatmap-day": activity.date,
            onPointerDown: (event: React.PointerEvent<SVGRectElement>) => {
              clearPressSession(false);
              const target = event.currentTarget;
              pressSessionRef.current = {
                pointerId: event.pointerId,
                activated: false,
                latestDay: activity.date,
                latestCell: target,
                inspectedDay: null,
              };

              try {
                target.setPointerCapture(event.pointerId);
              } catch {
                // Pointer capture can fail if the pointer is no longer active.
              }

              longPressTimerRef.current = setTimeout(activatePressSession, LONG_PRESS_MS);
            },
            onPointerMove: (event: React.PointerEvent<SVGRectElement>) => {
              const session = pressSessionRef.current;
              if (session === null || session.pointerId !== event.pointerId) return;

              const latest = updateLatestCellFromPointer(event);
              if (!session.activated || latest === null || latest.cell === null || latest.day === null) return;

              if (latest.day !== session.inspectedDay) {
                session.inspectedDay = latest.day;
                inspectDay(latest.day, latest.cell);
                playTapFeedback();
              }
            },
            onPointerUp: (event: React.PointerEvent<SVGRectElement>) => {
              if (pressSessionRef.current?.pointerId !== event.pointerId) return;

              try {
                event.currentTarget.releasePointerCapture(event.pointerId);
              } catch {
                // The browser may have already released capture before pointerup.
              }

              clearPressSession(true);
            },
            onPointerCancel: (event: React.PointerEvent<SVGRectElement>) => {
              if (pressSessionRef.current?.pointerId !== event.pointerId) return;

              clearPressSession(true);
            },
            onLostPointerCapture: (event: React.PointerEvent<SVGRectElement>) => {
              if (pressSessionRef.current?.pointerId !== event.pointerId) return;

              clearPressSession(true);
            },
            onKeyDown: (event: React.KeyboardEvent<SVGRectElement>) => {
              if (event.key === "Escape") {
                onDayInspectEnd?.();
                return;
              }

              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              inspectDay(activity.date, event.currentTarget);
            },
            onBlur: () => {
              onDayInspectEnd?.();
            },
            style: {
              ...block.props.style,
              cursor: onDayInspect ? "pointer" : "default",
              outline: "none",
              touchAction: "none",
            },
          } as React.SVGProps<SVGRectElement> & { "data-heatmap-day": string })
        }
      />
    </div>
  );
}
