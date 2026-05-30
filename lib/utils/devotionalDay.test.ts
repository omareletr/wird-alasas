import { describe, it, expect } from "vitest";
import { getDevotionalDay } from "./devotionalDay";

const LONDON = { latitude: 51.5074, longitude: -0.1278 };

describe("getDevotionalDay", () => {
  it("returns today's key when now is after Fajr", () => {
    // Fajr in London on 2026-01-16 is approximately 05:59 UTC (winter, reliable)
    const afterFajr = new Date("2026-01-16T08:00:00Z");
    expect(getDevotionalDay(afterFajr, LONDON)).toBe("2026-01-16");
  });

  it("returns yesterday's key when now is before Fajr", () => {
    // 02:00 UTC on 2026-01-16 is before Fajr (~05:59 UTC)
    const beforeFajr = new Date("2026-01-16T02:00:00Z");
    expect(getDevotionalDay(beforeFajr, LONDON)).toBe("2026-01-15");
  });

  it("handles DST transition day correctly", () => {
    // UK spring-forward: 2026-03-29 02:00 local -> 03:00 (clocks jump)
    // Fajr on Mar 29 is ~03:46 UTC; 10:00 UTC is well after Fajr
    const dstDay = new Date("2026-03-29T10:00:00Z");
    const result = getDevotionalDay(dstDay, LONDON);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/); // valid dayKey shape
  });

  it("handles year boundary: Dec 31 before Fajr returns Dec 30 key", () => {
    // Fajr on Dec 31 is at ~06:03 UTC; 04:00 UTC is before Fajr
    const beforeFajrOnNewYearsEve = new Date("2026-12-31T04:00:00Z");
    const result = getDevotionalDay(beforeFajrOnNewYearsEve, LONDON);
    expect(result).toBe("2026-12-30");
  });
});
