import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Returns the devotional day key (YYYY-MM-DD) for a given moment and location.
 * The day starts at Fajr, not midnight. If `now` is before Fajr on calendar date D,
 * the day key returned is D-1 (the previous calendar day's wird is still active).
 *
 * This function is pure — it never calls Date.now() or new Date() without arguments.
 */
export function getDevotionalDay(now: Date, location: Location): string {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = CalculationMethod.MuslimWorldLeague();

  // Construct calendar date using UTC components so the day key is consistent
  // regardless of the machine timezone. adhan interprets the Date's local
  // year/month/day when computing prayer times, so we create a local-midnight
  // Date that matches the UTC calendar date of `now`.
  const calendarDate = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const prayerTimes = new PrayerTimes(coords, calendarDate, params);
  const fajr = prayerTimes.fajr; // JS Date (UTC value)

  if (now < fajr) {
    // Before today's Fajr — still belongs to yesterday's wird
    const yesterday = new Date(calendarDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDayKey(yesterday);
  }
  return formatDayKey(calendarDate);
}

function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
