"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";
import { getDailyRecord } from "@/lib/storage/idb";
import type { DailyRecord } from "@/lib/storage/schema";
import type { DayAnchorRect } from "@/components/history/HeatmapCalendar";

interface DayDetailPopoverProps {
  dayKey: string | null;
  records?: DailyRecord[];
  anchorRect: DayAnchorRect | null;
  onClose: () => void;
}

interface PopoverPosition {
  top: number;
  left: number;
  width: number;
  caretLeft: number;
  placement: "above" | "below";
}

const POPOVER_GAP = 12;
const EDGE_PADDING = 16;
const MAX_POPOVER_WIDTH = 320;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getSheetBounds(): DOMRect | null {
  return document.querySelector('[data-slot="sheet-content"]')?.getBoundingClientRect() ?? null;
}

function formatDay(dayKey: string): string {
  return new Date(dayKey + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function DayDetailPopover({
  dayKey,
  records = [],
  anchorRect,
  onClose,
}: DayDetailPopoverProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion() === true;
  const [record, setRecord] = useState<DailyRecord | null | undefined>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  useEffect(() => {
    if (dayKey === null) {
      setRecord(null);
      return;
    }

    const displayRecord = records.find((item) => item.dayKey === dayKey);
    if (displayRecord !== undefined) {
      setRecord(displayRecord);
      return;
    }

    let cancelled = false;
    setRecord(null);
    getDailyRecord(dayKey).then((storedRecord) => {
      if (!cancelled) setRecord(storedRecord);
    });

    return () => {
      cancelled = true;
    };
  }, [dayKey, records]);

  useEffect(() => {
    if (dayKey === null) return;

    function handlePointerDown(event: PointerEvent) {
      const card = cardRef.current;
      if (card !== null && card.contains(event.target as Node)) return;
      onClose();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [dayKey, onClose]);

  useLayoutEffect(() => {
    if (dayKey === null || anchorRect === null) {
      setPosition(null);
      return;
    }

    const activeAnchorRect = anchorRect;

    function updatePosition() {
      const sheetBounds = getSheetBounds();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const horizontalMin = Math.max(sheetBounds?.left ?? 0, 0) + EDGE_PADDING;
      const horizontalMax = Math.min(sheetBounds?.right ?? viewportWidth, viewportWidth) - EDGE_PADDING;
      const verticalMin = Math.max(sheetBounds?.top ?? 0, 0) + EDGE_PADDING;
      const verticalMax = Math.min(sheetBounds?.bottom ?? viewportHeight, viewportHeight) - EDGE_PADDING;
      const width = Math.min(MAX_POPOVER_WIDTH, viewportWidth - EDGE_PADDING * 2, horizontalMax - horizontalMin);
      const cardHeight = cardRef.current?.offsetHeight ?? 180;
      const anchorCenterX = activeAnchorRect.left + activeAnchorRect.width / 2;
      const idealLeft = anchorCenterX - width / 2;
      const left = clamp(idealLeft, horizontalMin, horizontalMax - width);
      const aboveTop = activeAnchorRect.top - cardHeight - POPOVER_GAP;
      const belowTop = activeAnchorRect.bottom + POPOVER_GAP;
      const hasRoomAbove = aboveTop >= verticalMin;
      const placement = hasRoomAbove ? "above" : "below";
      const preferredTop = hasRoomAbove ? aboveTop : belowTop;
      const top = clamp(preferredTop, verticalMin, verticalMax - cardHeight);

      setPosition({
        top,
        left,
        width,
        caretLeft: clamp(anchorCenterX - left, 18, width - 18),
        placement,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [anchorRect, dayKey, record]);

  if (dayKey === null || anchorRect === null) return null;

  const formattedDate = formatDay(dayKey);

  return (
    <motion.div
      ref={cardRef}
      role="dialog"
      aria-label={`Activity for ${formattedDate}`}
      className="fixed z-10 rounded-[20px] border border-border/70 bg-popover p-4 text-popover-foreground shadow-2xl shadow-black/15 outline-none dark:shadow-black/40"
      style={{
        top: position?.top ?? anchorRect.bottom + POPOVER_GAP,
        left: position?.left ?? EDGE_PADDING,
        width: position?.width ?? `min(${MAX_POPOVER_WIDTH}px, calc(100vw - ${EDGE_PADDING * 2}px))`,
      }}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.05 : 0.16, ease: "easeOut" }}
    >
      {position !== null && (
        <span
          className="absolute h-3 w-3 rotate-45 border-border/70 bg-popover"
          style={{
            left: position.caretLeft - 6,
            top: position.placement === "below" ? -7 : undefined,
            bottom: position.placement === "above" ? -7 : undefined,
            borderTopWidth: position.placement === "below" ? 1 : 0,
            borderLeftWidth: position.placement === "below" ? 1 : 0,
            borderRightWidth: position.placement === "above" ? 1 : 0,
            borderBottomWidth: position.placement === "above" ? 1 : 0,
          }}
          aria-hidden="true"
        />
      )}

      <div className="mb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-sans tracking-[0.16em] uppercase text-muted-foreground/65">
            Day activity
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-foreground">{formattedDate}</p>
        </div>
      </div>

      {record === null ? (
        <p className="text-xs font-sans text-muted-foreground/70">Loading...</p>
      ) : record === undefined ? (
        <p className="text-xs font-sans text-muted-foreground/70">No record for this day</p>
      ) : (
        <div className="space-y-1.5">
          {ADHKAR.map((entry) => {
            const count = record.counts[entry.index] ?? 0;
            const target = getTarget(entry, record.mode);
            const completed = count >= target;
            return (
              <div
                key={entry.index}
                className={`flex items-center justify-between gap-3 rounded-xl px-2 py-2 ${
                  completed ? "bg-muted/55 text-foreground" : "text-muted-foreground/75"
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-[11px] font-sans tracking-wide">
                  {entry.transliteration}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-[11px] tabular-nums">
                    {count}
                    <span className="text-muted-foreground/50"> / </span>
                    {target}
                  </span>
                  {completed && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-primary">
                      Done
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
