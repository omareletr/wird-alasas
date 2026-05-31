import { ADHKAR, getTarget } from "@/lib/data/adhkar";
import type { DhikrIndex } from "@/lib/storage/schema";

/**
 * 5-level completion classification:
 *   "none"    — zero dhikr have any taps (completedCount === 0, no partial progress)
 *   "partial" — at least one dhikr has some taps but NONE have hit their target
 *   "one"     — exactly 1 dhikr has hit its target
 *   "multi"   — 2 or 3 dhikr have hit their targets
 *   "full"    — all 4 dhikr have hit their targets
 */
export type CompletionLevel = "none" | "partial" | "one" | "multi" | "full";

/**
 * Derives the completion level from raw count data and mode.
 *
 * Pure function — always computed at read time, never stored.
 * Uses the mode from the record (not current settings) so historical
 * records classify correctly regardless of settings changes.
 */
export function classifyDay(
  counts: Record<DhikrIndex, number>,
  mode: "full" | "shortened"
): CompletionLevel {
  const completedCount = ADHKAR.filter(
    (entry) => counts[entry.index] >= getTarget(entry, mode)
  ).length;

  const anyTaps = completedCount === 0 && ADHKAR.some((entry) => counts[entry.index] > 0);

  if (completedCount === ADHKAR.length) return "full";
  if (completedCount >= 2) return "multi";
  if (completedCount === 1) return "one";
  if (anyTaps) return "partial";
  return "none";
}
