import { classifyDay } from "@/lib/utils/completionClassifier";
import type { DailyRecord } from "@/lib/storage/schema";

export interface StreakResult {
  current: number;
  longest: number;
}

/**
 * Computes current and longest streaks from an array of DailyRecord.
 *
 * Streak policy:
 * - A day is "active" if classifyDay returns "full" OR "partial".
 * - A "none" day (zero completions) breaks the streak.
 * - Current streak = unbroken run ending at the MOST RECENT active day key,
 *   not today. (If the user hasn't completed anything today, current streak
 *   ends on the last active day — no off-by-one.)
 * - Longest streak = max unbroken run across all time.
 */
export function computeStreaks(records: DailyRecord[]): StreakResult {
  if (records.length === 0) return { current: 0, longest: 0 };

  // Build sorted array of unique active day keys (days with at least 1 dhikr completed)
  const activeDays = Array.from(
    new Set(
      records
        .filter((r) => classifyDay(r.counts, r.mode) !== "none")
        .map((r) => r.dayKey)
    )
  ).sort();

  if (activeDays.length === 0) return { current: 0, longest: 0 };

  // Compute longest streak (single forward pass)
  let longest = 1;
  let run = 1;
  for (let i = 1; i < activeDays.length; i++) {
    if (isConsecutive(activeDays[i - 1], activeDays[i])) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Compute current streak (walk backward from last active day)
  let current = 1;
  for (let i = activeDays.length - 1; i > 0; i--) {
    if (isConsecutive(activeDays[i - 1], activeDays[i])) {
      current++;
    } else {
      break;
    }
  }

  return { current, longest };
}

/** Returns true if dayKeyB is exactly 1 calendar day after dayKeyA (UTC). */
function isConsecutive(dayKeyA: string, dayKeyB: string): boolean {
  const a = new Date(dayKeyA + "T00:00:00Z").getTime();
  const b = new Date(dayKeyB + "T00:00:00Z").getTime();
  return b - a === 86_400_000;
}
