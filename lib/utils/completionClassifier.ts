import { ADHKAR, getTarget } from "@/lib/data/adhkar";
import type { DhikrIndex } from "@/lib/storage/schema";

export type CompletionLevel = "full" | "partial" | "none";

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

  if (completedCount === ADHKAR.length) return "full";
  if (completedCount > 0) return "partial";
  return "none";
}
