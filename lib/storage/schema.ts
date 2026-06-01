/**
 * Canonical TypeScript interfaces for local-first storage.
 * All field names are locked — do not rename without a schema migration.
 */

export const DHIKR_COUNT = 4 as const;

export type DhikrIndex = 0 | 1 | 2 | 3;

/** Active session state persisted to localStorage under "wird-session". */
export interface ActiveSession {
  /** One count per dhikr index (0–3). */
  counts: Record<DhikrIndex, number>;
  mode: "full" | "shortened";
  /** Unix ms timestamp set when session starts; null before first tap. */
  sessionStartedAt: number | null;
  /** Dhikr the user was last viewing. */
  activeIndex: DhikrIndex;
}

/** User preferences persisted to localStorage under "wird-settings". */
export interface UserSettings {
  /** Hour in 0.5 steps (0–23.5, local time) at which the daily wird resets. Default 5 (5am). */
  resetHour: number;
  /** True after the user has completed the first-launch onboarding screen. */
  hasOnboarded: boolean;
}

/**
 * Archived daily record persisted to IndexedDB.
 * Written when a day is completed or when the day boundary is crossed.
 */
export interface DailyRecord {
  /** YYYY-MM-DD key, e.g. "2026-05-30". Primary key in IndexedDB. */
  dayKey: string;
  counts: Record<DhikrIndex, number>;
  mode: "full" | "shortened";
  /** Unix ms timestamp of archival. */
  completedAt: number;
}
