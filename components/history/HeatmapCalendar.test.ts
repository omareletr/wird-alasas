/**
 * Wave 0 test scaffold for recordsToActivityData (HIST-03).
 *
 * recordsToActivityData is created in plan 03-02 (Task 1).
 * These tests are intentionally RED during Wave 1 — they turn GREEN
 * after HeatmapCalendar.tsx exports recordsToActivityData.
 *
 * Activity levels:
 *   0 = none (zero completions)
 *   1 = partial (at least one dhikr completed, not all)
 *   2 = full (all dhikr completed)
 */

import { describe, it, expect } from "vitest";
import { recordsToActivityData } from "@/components/history/HeatmapCalendar";
import type { DailyRecord } from "@/lib/storage/schema";
import type { DhikrIndex } from "@/lib/storage/schema";

// Case A: none record (all counts 0) → Activity with level=0, count=0
it("none record maps to level=0, count=0", () => {
  const record: DailyRecord = {
    dayKey: "2026-05-28",
    counts: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<DhikrIndex, number>,
    mode: "full",
    completedAt: 0,
  };
  const result = recordsToActivityData([record]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-05-28", level: 0, count: 0 });
});

// Case B: partial record (only counts[0] = 200, rest 0, mode="full") → level=1, count=1
it("partial record (only first dhikr complete) maps to level=1, count=1", () => {
  const record: DailyRecord = {
    dayKey: "2026-05-29",
    counts: { 0: 200, 1: 0, 2: 0, 3: 0 } as Record<DhikrIndex, number>,
    mode: "full",
    completedAt: 0,
  };
  const result = recordsToActivityData([record]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-05-29", level: 1, count: 1 });
});

// Case C: full record (all targets met) → level=2, count=2
it("full record (all dhikr complete) maps to level=2, count=2", () => {
  const record: DailyRecord = {
    dayKey: "2026-05-30",
    counts: { 0: 200, 1: 200, 2: 100, 3: 100 } as Record<DhikrIndex, number>,
    mode: "full",
    completedAt: 0,
  };
  const result = recordsToActivityData([record]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-05-30", level: 2, count: 2 });
});

// Case D: output is sorted ascending by date for 3 records with different dayKeys
describe("recordsToActivityData", () => {
  it("output sorted ascending by date for 3 records with different dayKeys", () => {
    const records: DailyRecord[] = [
      {
        dayKey: "2026-05-30",
        counts: { 0: 200, 1: 200, 2: 100, 3: 100 } as Record<DhikrIndex, number>,
        mode: "full",
        completedAt: 0,
      },
      {
        dayKey: "2026-05-28",
        counts: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<DhikrIndex, number>,
        mode: "full",
        completedAt: 0,
      },
      {
        dayKey: "2026-05-29",
        counts: { 0: 200, 1: 0, 2: 0, 3: 0 } as Record<DhikrIndex, number>,
        mode: "full",
        completedAt: 0,
      },
    ];
    const result = recordsToActivityData(records);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe("2026-05-28");
    expect(result[1].date).toBe("2026-05-29");
    expect(result[2].date).toBe("2026-05-30");
  });
});
