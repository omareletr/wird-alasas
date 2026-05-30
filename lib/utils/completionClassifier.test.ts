import { describe, it, expect } from "vitest";
import { classifyDay } from "./completionClassifier";
import type { DhikrIndex } from "@/lib/storage/schema";

function counts(a: number, b: number, c: number, d: number): Record<DhikrIndex, number> {
  return { 0: a, 1: b, 2: c, 3: d };
}

describe("classifyDay", () => {
  // ── full mode ──────────────────────────────────────────────────────────────

  it("full mode — all at target → 'full'", () => {
    expect(classifyDay(counts(200, 200, 100, 100), "full")).toBe("full");
  });

  it("full mode — one below target → 'partial'", () => {
    expect(classifyDay(counts(200, 200, 100, 99), "full")).toBe("partial");
  });

  it("full mode — only first meets target → 'partial'", () => {
    expect(classifyDay(counts(200, 0, 0, 0), "full")).toBe("partial");
  });

  it("full mode — none meet target → 'none'", () => {
    expect(classifyDay(counts(0, 0, 0, 0), "full")).toBe("none");
  });

  // ── shortened mode ─────────────────────────────────────────────────────────

  it("shortened mode — all at target → 'full'", () => {
    expect(classifyDay(counts(20, 20, 10, 10), "shortened")).toBe("full");
  });

  it("shortened mode — one below target → 'partial'", () => {
    expect(classifyDay(counts(20, 20, 10, 9), "shortened")).toBe("partial");
  });

  it("shortened mode — none meet target → 'none'", () => {
    expect(classifyDay(counts(0, 0, 0, 0), "shortened")).toBe("none");
  });

  // ── mode independence ──────────────────────────────────────────────────────

  it("mode independence — shortened counts with full mode → 'none' (20 < 200, none reach full targets)", () => {
    // Same counts that yield "full" in shortened mode yield "none" in full mode
    // because none of the counts (20, 20, 10, 10) reach the full targets (200, 200, 100, 100)
    expect(classifyDay(counts(20, 20, 10, 10), "full")).toBe("none");
  });

  // ── boundary / over-target ─────────────────────────────────────────────────

  it("exact boundary — counts exactly at target → 'full'", () => {
    expect(classifyDay(counts(200, 200, 100, 100), "full")).toBe("full");
  });

  it("over-target — counts exceeding target → 'full'", () => {
    expect(classifyDay(counts(250, 200, 100, 100), "full")).toBe("full");
  });
});
