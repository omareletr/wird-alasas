"use client";

import { useEffect, useRef } from "react";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { addDailyRecord } from "@/lib/storage/idb";
import { getDevotionalDay } from "@/lib/utils/devotionalDay";
import type { Location } from "@/lib/utils/devotionalDay";

const MECCA_FALLBACK: Location = { latitude: 21.4225, longitude: 39.8262 };

/**
 * Returns the next Fajr Date for a given location.
 * If today's Fajr is still in the future, returns it; otherwise returns tomorrow's.
 */
function getNextFajr(location: Location): Date {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  const now = new Date();

  // Use UTC calendar components for consistency (matches getDevotionalDay)
  const todayCalendar = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const todayTimes = new PrayerTimes(coords, todayCalendar, params);

  if (now < todayTimes.fajr) {
    return todayTimes.fajr;
  }

  // Today's Fajr has passed — schedule for tomorrow
  const tomorrowCalendar = new Date(todayCalendar);
  tomorrowCalendar.setDate(tomorrowCalendar.getDate() + 1);
  const tomorrowTimes = new PrayerTimes(coords, tomorrowCalendar, params);
  return tomorrowTimes.fajr;
}

/**
 * Reads the current devotional day key using the stored location (or Mecca fallback).
 */
function currentDevotionalDay(): string {
  const location =
    useSettingsStore.getState().location ?? MECCA_FALLBACK;
  return getDevotionalDay(new Date(), location);
}

/**
 * Archives the current session to IndexedDB (if active) and resets the store.
 * Also re-schedules the next Fajr timer via the provided scheduleNext callback.
 */
export async function archiveAndReset(
  scheduleNext: () => void
): Promise<void> {
  const { counts, mode, sessionStartedAt } = useSessionStore.getState();

  if (sessionStartedAt !== null) {
    const dayKey = currentDevotionalDay();
    await addDailyRecord({
      dayKey,
      counts,
      mode,
      completedAt: Date.now(),
    });
  }

  useSessionStore.getState().reset();
  scheduleNext();
}

/**
 * useFajrRollover — schedules a daily archive+reset at Fajr time.
 *
 * - Sets a setTimeout to fire at the next Fajr.
 * - Listens for visibilitychange to handle tab sleep/wake boundary crossing.
 * - Cleans up timer and listener on unmount.
 */
export function useFajrRollover(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store the devotional day key at mount time for visibilitychange comparison
  const storedDayRef = useRef<string>(currentDevotionalDay());

  useEffect(() => {
    function scheduleNext(): void {
      // Clear any existing timer to prevent double-scheduling
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const location =
        useSettingsStore.getState().location ?? MECCA_FALLBACK;
      const nextFajr = getNextFajr(location);
      const delay = Math.max(nextFajr.getTime() - Date.now(), 0);

      timerRef.current = setTimeout(() => {
        timerRef.current = null; // clear ref before async work
        // Update stored day to the new devotional day
        storedDayRef.current = currentDevotionalDay();
        archiveAndReset(scheduleNext);
      }, delay);
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState !== "visible") return;

      const currentDay = currentDevotionalDay();
      if (currentDay !== storedDayRef.current) {
        // Day boundary was crossed while tab was hidden — archive immediately
        storedDayRef.current = currentDay;
        archiveAndReset(scheduleNext);
      }
    }

    // Initial scheduling
    storedDayRef.current = currentDevotionalDay();
    scheduleNext();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
