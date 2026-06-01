"use client";

import { useEffect, useRef } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { addDailyRecord } from "@/lib/storage/idb";
import { getDevotionalDay } from "@/lib/utils/devotionalDay";

/** Returns the next Date at which the local clock will show the reset time. */
function getNextReset(resetHour: number): Date {
  const now = new Date();
  const hour = Math.floor(resetHour);
  const minute = resetHour % 1 === 0.5 ? 30 : 0;
  const todayReset = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0
  );
  if (now < todayReset) return todayReset;
  const tomorrowReset = new Date(todayReset);
  tomorrowReset.setDate(tomorrowReset.getDate() + 1);
  return tomorrowReset;
}

function currentDevotionalDay(): string {
  const resetHour = useSettingsStore.getState().resetHour;
  return getDevotionalDay(new Date(), resetHour);
}

export async function archiveAndReset(
  scheduleNext: () => void
): Promise<void> {
  try {
    const { counts, mode, sessionStartedAt } = useSessionStore.getState();
    if (sessionStartedAt !== null) {
      const dayKey = currentDevotionalDay();
      await addDailyRecord({ dayKey, counts, mode, completedAt: Date.now() });
    }
    useSessionStore.getState().reset();
  } finally {
    scheduleNext();
  }
}

/**
 * useResetTimer — schedules a daily archive+reset at the user's chosen hour.
 *
 * - Sets a setTimeout to fire at the next resetHour:00 local time.
 * - Listens for visibilitychange to handle tab sleep/wake boundary crossing.
 * - Cleans up on unmount.
 */
export function useResetTimer(enabled = true): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storedDayRef = useRef<string>(currentDevotionalDay());

  useEffect(() => {
    if (!enabled) return;

    function scheduleNext(): void {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const resetHour = useSettingsStore.getState().resetHour;
      const nextReset = getNextReset(resetHour);
      const delay = Math.max(nextReset.getTime() - Date.now(), 0);

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        storedDayRef.current = currentDevotionalDay();
        archiveAndReset(scheduleNext);
      }, delay);
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState !== "visible") return;
      const currentDay = currentDevotionalDay();
      if (currentDay !== storedDayRef.current) {
        storedDayRef.current = currentDay;
        archiveAndReset(scheduleNext);
      }
    }

    storedDayRef.current = currentDevotionalDay();
    scheduleNext();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const unsubscribeResetHour = useSettingsStore.subscribe((state, prev) => {
      if (state.resetHour !== prev.resetHour) scheduleNext();
    });

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribeResetHour();
    };
  }, [enabled]);
}
