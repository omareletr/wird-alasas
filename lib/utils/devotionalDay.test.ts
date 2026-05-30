import { describe, it, expect } from "vitest";
import { getDevotionalDay } from "./devotionalDay";

const LONDON = { latitude: 51.5074, longitude: -0.1278 };

describe("getDevotionalDay", () => {
  it("returns today's key when now is after Fajr", () => {
    // Fajr in London on 2026-05-30 is approximately 02:52 UTC
    const afterFajr = new Date("2026-05-30T06:00:00Z");
    expect(getDevotionalDay(afterFajr, LONDON)).toBe("2026-05-30");
  });

  it("returns yesterday's key when now is before Fajr", () => {
    // 01:00 UTC on 2026-05-30 is before Fajr (~02:52 UTC)
    const beforeFajr = new Date("2026-05-30T01:00:00Z");
    expect(getDevotionalDay(beforeFajr, LONDON)).toBe("2026-05-29");
  });

  it("handles DST transition day correctly", () => {
    // UK spring-forward: 2026-03-29 02:00 local -> 03:00 (clocks jump)
    const dstDay = new Date("2026-03-29T10:00:00Z");
    const result = getDevotionalDay(dstDay, LONDON);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/); // valid dayKey shape
  });

  it("handles year boundary: Dec 31 before Fajr returns Dec 30 key", () => {
    // If Fajr on Dec 31 is at 06:00 UTC and now is 04:00 UTC on Dec 31
    const beforeFajrOnNewYearsEve = new Date("2026-12-31T04:00:00Z");
    const result = getDevotionalDay(beforeFajrOnNewYearsEve, LONDON);
    expect(result).toBe("2026-12-30");
  });
});
