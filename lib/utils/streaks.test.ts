import { describe, it, expect } from "vitest";
import { computeStreaks } from "./streaks";
import type { DailyRecord } from "@/lib/storage/schema";
import type { DhikrIndex } from "@/lib/storage/schema";

/** Helper: create a DailyRecord with all counts at full-mode targets (full). */
function fullRecord(dayKey: string): DailyRecord {
  return {
    dayKey,
    counts: { 0: 200, 1: 200, 2: 100, 3: 100 } as Record<DhikrIndex, number>,
    mode: "full",
    completedAt: 0,
  };
}

/** Helper: create a DailyRecord classified as "none" (all counts zero). */
function noneRecord(dayKey: string): DailyRecord {
  return {
    dayKey,
    counts: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<DhikrIndex, number>,
    mode: "full",
    completedAt: 0,
  };
}

/**
 * Helper: create a DailyRecord classified as "one".
 * Only counts[0] = 200, rest = 0 → exactly 1 dhikr completed, classifyDay → "one".
 */
function oneRecord(dayKey: string): DailyRecord {
  return {
    dayKey,
    counts: { 0: 200, 1: 0, 2: 0, 3: 0 } as Record<DhikrIndex, number>,
    mode: "full",
    completedAt: 0,
  };
}

/**
 * Helper: create a DailyRecord classified as "partial".
 * counts[0] = 5 (some taps), rest = 0 → 0 dhikr completed, classifyDay → "partial".
 */
function partialRecord(dayKey: string): DailyRecord {
  return {
    dayKey,
    counts: { 0: 5, 1: 0, 2: 0, 3: 0 } as Record<DhikrIndex, number>,
    mode: "full",
    completedAt: 0,
  };
}

describe("computeStreaks", () => {
  // Case 1: empty records
  it("empty records -> { current: 0, longest: 0 }", () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 });
  });

  // Case 2: single "full" record
  it("single full record -> { current: 1, longest: 1 }", () => {
    const records = [fullRecord("2026-05-30")];
    expect(computeStreaks(records)).toEqual({ current: 1, longest: 1 });
  });

  // Case 3: single "none" record
  it("single none record (all counts 0) -> { current: 0, longest: 0 }", () => {
    const records = [noneRecord("2026-05-30")];
    expect(computeStreaks(records)).toEqual({ current: 0, longest: 0 });
  });

  // Case 4: 3 consecutive "full" days
  it("3 consecutive full days -> { current: 3, longest: 3 }", () => {
    const records = [
      fullRecord("2026-05-28"),
      fullRecord("2026-05-29"),
      fullRecord("2026-05-30"),
    ];
    expect(computeStreaks(records)).toEqual({ current: 3, longest: 3 });
  });

  // Case 5: 2 consecutive then gap then 1
  it("2 consecutive then gap then 1 -> { current: 1, longest: 2 }", () => {
    const records = [
      fullRecord("2026-05-28"),
      fullRecord("2026-05-29"),
      // May 30 missing — gap
      fullRecord("2026-05-31"),
    ];
    expect(computeStreaks(records)).toEqual({ current: 1, longest: 2 });
  });

  // Case 6: "partial" day sustains streak (taps only, 0 dhikr complete)
  it("partial day sustains streak — 3-day run with partial on day 2 -> { current: 3, longest: 3 }", () => {
    const records = [
      fullRecord("2026-05-28"),
      partialRecord("2026-05-29"),
      fullRecord("2026-05-30"),
    ];
    expect(computeStreaks(records)).toEqual({ current: 3, longest: 3 });
  });

  // Case 6b: "one" day (1 dhikr complete) sustains streak
  it("one-dhikr day sustains streak — 3-day run with one on day 2 -> { current: 3, longest: 3 }", () => {
    const records = [
      fullRecord("2026-05-28"),
      oneRecord("2026-05-29"),
      fullRecord("2026-05-30"),
    ];
    expect(computeStreaks(records)).toEqual({ current: 3, longest: 3 });
  });

  // Case 7: mixed run: full, full, none, full, full, full
  it("mixed run with none gap — last run 3 days -> { current: 3, longest: 3 }", () => {
    const records = [
      fullRecord("2026-05-24"),
      fullRecord("2026-05-25"),
      noneRecord("2026-05-26"), // breaks streak
      fullRecord("2026-05-27"),
      fullRecord("2026-05-28"),
      fullRecord("2026-05-29"),
    ];
    expect(computeStreaks(records)).toEqual({ current: 3, longest: 3 });
  });

  // Case 8: today has no record but yesterday has a full record (no off-by-one)
  it("only yesterday has a record, today has none -> { current: 1, longest: 1 }", () => {
    // Today is "2026-05-30" but no record for it; only "2026-05-29"
    const records = [fullRecord("2026-05-29")];
    expect(computeStreaks(records)).toEqual({ current: 1, longest: 1 });
  });
});
