import { describe, it, expect } from "vitest";
import { getDevotionalDay } from "./devotionalDay";

// Tests run with TZ=UTC so local time === UTC time.
// new Date(year, month, day, hour) creates a local-time Date.

describe("getDevotionalDay", () => {
  it("returns today's key when now is after reset hour", () => {
    // 8am local, resetHour=5 → 8 >= 5 → today
    const now = new Date(2026, 0, 16, 8, 0, 0); // 2026-01-16 08:00 local
    expect(getDevotionalDay(now, 5)).toBe("2026-01-16");
  });

  it("returns yesterday's key when now is before reset hour", () => {
    // 3am local, resetHour=5 → 3 < 5 → yesterday
    const now = new Date(2026, 0, 16, 3, 0, 0); // 2026-01-16 03:00 local
    expect(getDevotionalDay(now, 5)).toBe("2026-01-15");
  });

  it("returns today's key when now equals reset hour exactly", () => {
    // 5am exactly, resetHour=5 → 5 >= 5 → today
    const now = new Date(2026, 0, 16, 5, 0, 0);
    expect(getDevotionalDay(now, 5)).toBe("2026-01-16");
  });

  it("returns yesterday's key at one minute before reset hour", () => {
    // 4:59am, resetHour=5 → still yesterday
    const now = new Date(2026, 0, 16, 4, 59, 0);
    expect(getDevotionalDay(now, 5)).toBe("2026-01-15");
  });

  it("handles reset hour of 0 (midnight): always returns today", () => {
    // With resetHour=0, any hour >= 0 → today
    const now = new Date(2026, 0, 16, 0, 1, 0);
    expect(getDevotionalDay(now, 0)).toBe("2026-01-16");
  });

  it("handles late reset hour (e.g. 23)", () => {
    // 22:00 local, resetHour=23 → 22 < 23 → yesterday
    const now = new Date(2026, 0, 16, 22, 0, 0);
    expect(getDevotionalDay(now, 23)).toBe("2026-01-15");
  });

  it("handles year boundary: Dec 31 before reset → Dec 30 key", () => {
    const now = new Date(2026, 11, 31, 3, 0, 0); // 2026-12-31 03:00
    expect(getDevotionalDay(now, 5)).toBe("2026-12-30");
  });

  it("handles month boundary: Feb 1 before reset → Jan 31 key", () => {
    const now = new Date(2026, 1, 1, 3, 0, 0); // 2026-02-01 03:00
    expect(getDevotionalDay(now, 5)).toBe("2026-01-31");
  });
});
