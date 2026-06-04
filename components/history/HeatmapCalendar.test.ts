/**
 * Tests for recordsToActivityData (HeatmapCalendar).
 *
 * Level mapping (5 levels, 0–4):
 *   none    → level=0, count=0  (no taps)
 *   partial → level=1, count=1  (taps but 0 dhikr completed)
 *   one     → level=2, count=2  (exactly 1 dhikr completed)
 *   multi   → level=3, count=3  (2–3 dhikr completed)
 *   full    → level=4, count=4  (all 4 dhikr completed)
 */

import { describe, it, expect } from "vitest";
import { buildActivityRange, recordsToActivityData } from "@/components/history/HeatmapCalendar";
import { mergeDisplayRecords } from "@/lib/utils/displayRecords";
import type { DailyRecord } from "@/lib/storage/schema";
import type { DhikrIndex } from "@/lib/storage/schema";

function makeRecord(
  dayKey: string,
  a: number,
  b: number,
  c: number,
  d: number,
  mode: "full" | "shortened" = "full"
): DailyRecord {
  return {
    dayKey,
    counts: { 0: a, 1: b, 2: c, 3: d } as Record<DhikrIndex, number>,
    mode,
    completedAt: 0,
  };
}

it("none record (all zeros) maps to level=0, count=0", () => {
  const result = recordsToActivityData([makeRecord("2026-05-28", 0, 0, 0, 0)]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-05-28", level: 0, count: 0 });
});

it("partial record (taps but 0 dhikr complete) maps to level=1, count=1", () => {
  const result = recordsToActivityData([makeRecord("2026-05-28", 5, 0, 0, 0)]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-05-28", level: 1, count: 1 });
});

it("one record (exactly 1 dhikr complete) maps to level=2, count=2", () => {
  const result = recordsToActivityData([makeRecord("2026-05-29", 200, 0, 0, 0)]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-05-29", level: 2, count: 2 });
});

it("multi record (2 dhikr complete) maps to level=3, count=3", () => {
  const result = recordsToActivityData([makeRecord("2026-05-29", 200, 200, 0, 0)]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-05-29", level: 3, count: 3 });
});

it("multi record (3 dhikr complete) maps to level=3, count=3", () => {
  const result = recordsToActivityData([makeRecord("2026-05-29", 200, 200, 100, 0)]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-05-29", level: 3, count: 3 });
});

it("full record (all 4 dhikr complete) maps to level=4, count=4", () => {
  const result = recordsToActivityData([makeRecord("2026-05-30", 200, 200, 100, 100)]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-05-30", level: 4, count: 4 });
});

describe("recordsToActivityData", () => {
  it("builds an inclusive fixed date range ending on the supplied day", () => {
    expect(buildActivityRange("2026-05-30", 3)).toEqual([
      "2026-05-28",
      "2026-05-29",
      "2026-05-30",
    ]);
  });

  it("fills a fixed range with level-0 days when no records exist", () => {
    const result = recordsToActivityData([], { endDayKey: "2026-05-30", dayCount: 3 });

    expect(result).toEqual([
      { date: "2026-05-28", level: 0, count: 0 },
      { date: "2026-05-29", level: 0, count: 0 },
      { date: "2026-05-30", level: 0, count: 0 },
    ]);
  });

  it("overlays archived records onto a zero-filled fixed range", () => {
    const result = recordsToActivityData(
      [makeRecord("2026-05-29", 200, 0, 0, 0)],
      { endDayKey: "2026-05-30", dayCount: 3 }
    );

    expect(result).toEqual([
      { date: "2026-05-28", level: 0, count: 0 },
      { date: "2026-05-29", level: 2, count: 2 },
      { date: "2026-05-30", level: 0, count: 0 },
    ]);
  });

  it("uses the live current-day record over an archived same-day record", () => {
    const records = mergeDisplayRecords(
      [makeRecord("2026-05-30", 0, 0, 0, 0)],
      makeRecord("2026-05-30", 200, 200, 100, 100)
    );
    const result = recordsToActivityData(records, { endDayKey: "2026-05-30", dayCount: 1 });

    expect(result).toEqual([{ date: "2026-05-30", level: 4, count: 4 }]);
  });

  it("output sorted ascending by date", () => {
    const records = [
      makeRecord("2026-05-30", 200, 200, 100, 100),
      makeRecord("2026-05-28", 0, 0, 0, 0),
      makeRecord("2026-05-29", 200, 0, 0, 0),
    ];
    const result = recordsToActivityData(records);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe("2026-05-28");
    expect(result[1].date).toBe("2026-05-29");
    expect(result[2].date).toBe("2026-05-30");
  });

  it("shortened mode — all at shortened targets → level=4", () => {
    const result = recordsToActivityData([makeRecord("2026-05-28", 20, 20, 10, 10, "shortened")]);
    expect(result[0]).toMatchObject({ level: 4, count: 4 });
  });
});
