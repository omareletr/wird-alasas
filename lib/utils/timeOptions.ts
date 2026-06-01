export interface TimeOption {
  value: number;
  label: string;
}

export function formatResetTime(hour: number): string {
  const h = Math.floor(hour);
  const mins = hour % 1 === 0.5 ? "30" : "00";
  const period = h < 12 ? "AM" : "PM";
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${mins} ${period}`;
}

export const TIME_OPTIONS: TimeOption[] = Array.from({ length: 48 }, (_, i) => {
  const value = i * 0.5;
  return { value, label: formatResetTime(value) };
});
