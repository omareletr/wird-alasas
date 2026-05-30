import { describe, it, expect } from "vitest";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";

describe("ADHKAR data", () => {
  it("exports exactly 4 entries", () => {
    expect(ADHKAR.length).toBe(4);
  });

  it("each entry has required fields with valid values", () => {
    ADHKAR.forEach((entry, i) => {
      expect(typeof entry.arabic).toBe("string");
      expect(entry.arabic.length).toBeGreaterThan(0);

      expect(typeof entry.transliteration).toBe("string");
      expect(entry.transliteration.length).toBeGreaterThan(0);

      expect(typeof entry.translation).toBe("string");
      expect(entry.translation.length).toBeGreaterThan(0);

      expect(typeof entry.targets.full).toBe("number");
      expect(entry.targets.full).toBeGreaterThan(0);

      expect(typeof entry.targets.shortened).toBe("number");
      expect(entry.targets.shortened).toBeGreaterThan(0);

      expect(entry.index).toBe(i);
    });
  });

  it("getTarget returns correct full-mode targets", () => {
    expect(getTarget(ADHKAR[0], "full")).toBe(200);
    expect(getTarget(ADHKAR[1], "full")).toBe(200);
    expect(getTarget(ADHKAR[2], "full")).toBe(100);
    expect(getTarget(ADHKAR[3], "full")).toBe(100);
  });

  it("getTarget returns correct shortened-mode targets", () => {
    expect(getTarget(ADHKAR[0], "shortened")).toBe(20);
    expect(getTarget(ADHKAR[1], "shortened")).toBe(20);
    expect(getTarget(ADHKAR[2], "shortened")).toBe(10);
    expect(getTarget(ADHKAR[3], "shortened")).toBe(10);
  });

  it("progress clamp: Math.min(count / target, 1) is capped at 1", () => {
    const entry = ADHKAR[0];
    const target = getTarget(entry, "full");

    // At exactly target
    expect(Math.min(target / target, 1)).toBe(1);
    // Beyond target
    expect(Math.min((target + 50) / target, 1)).toBe(1);
    // Below target
    expect(Math.min(100 / target, 1)).toBe(100 / target);
    expect(Math.min(100 / target, 1)).toBeLessThan(1);
  });

  it("ADHKAR index field matches array position", () => {
    expect(ADHKAR[0].index).toBe(0);
    expect(ADHKAR[1].index).toBe(1);
    expect(ADHKAR[2].index).toBe(2);
    expect(ADHKAR[3].index).toBe(3);
  });
});
