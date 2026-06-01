/**
 * Returns the devotional day key (YYYY-MM-DD) for a given moment.
 * The day starts at resetHour (local time), not midnight.
 * If `now` is before resetHour on calendar day D, the key is D-1.
 *
 * Pure — never calls Date.now() or new Date() without arguments.
 */
export function getDevotionalDay(now: Date, resetHour: number): string {
  const localHour = now.getHours();
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (localHour < resetHour) {
    const yesterday = new Date(localDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDayKey(yesterday);
  }
  return formatDayKey(localDate);
}

function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
