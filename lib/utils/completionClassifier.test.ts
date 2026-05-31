import { describe, it, expect } from "vitest";
import { classifyDay } from "./completionClassifier";
import type { DhikrIndex } from "@/lib/storage/schema";

function counts(a: number, b: number, c: number, d: number): Record<DhikrIndex, number> {
  return { 0: a, 1: b, 2: c, 3: d };
}

describe("classifyDay", () => {
  // ── none ──────────────────────────────────────────────────────────────────
  it("full mode — all zeros → 'none'", () => {
    expect(classifyDay(counts(0, 0, 0, 0), "full")).toBe("none");
  });

  it("shortened mode — all zeros → 'none'", () => {
    expect(classifyDay(counts(0, 0, 0, 0), "shortened")).toBe("none");
  });

  // ── partial (taps but 0 dhikr completed) ──────────────────────────────────
  it("full mode — some taps but no dhikr complete → 'partial'", () => {
    expect(classifyDay(counts(5, 0, 0, 0), "full")).toBe("partial");
  });

  it("full mode — multiple taps across dhikr, none complete → 'partial'", () => {
    expect(classifyDay(counts(50, 100, 30, 0), "full")).toBe("partial");
  });

  it("shortened mode — taps but none complete → 'partial'", () => {
    expect(classifyDay(counts(5, 0, 0, 0), "shortened")).toBe("partial");
  });

  // ── one (exactly 1 dhikr completed) ───────────────────────────────────────
  it("full mode — only first dhikr complete → 'one'", () => {
    expect(classifyDay(counts(200, 0, 0, 0), "full")).toBe("one");
  });

  it("full mode — only third dhikr complete → 'one'", () => {
    expect(classifyDay(counts(0, 0, 100, 0), "full")).toBe("one");
  });

  it("shortened mode — only first dhikr complete → 'one'", () => {
    expect(classifyDay(counts(20, 0, 0, 0), "shortened")).toBe("one");
  });

  it("full mode — one complete with extra taps on others → 'one'", () => {
    expect(classifyDay(counts(200, 50, 0, 0), "full")).toBe("one");
  });

  // ── multi (2 or 3 dhikr completed) ───────────────────────────────────────
  it("full mode — exactly 2 dhikr complete → 'multi'", () => {
    expect(classifyDay(counts(200, 200, 0, 0), "full")).toBe("multi");
  });

  it("full mode — 3 dhikr complete → 'multi'", () => {
    expect(classifyDay(counts(200, 200, 100, 0), "full")).toBe("multi");
  });

  it("shortened mode — 2 dhikr complete → 'multi'", () => {
    expect(classifyDay(counts(20, 20, 0, 0), "shortened")).toBe("multi");
  });

  // ── full (all 4 dhikr completed) ─────────────────────────────────────────
  it("full mode — all at target → 'full'", () => {
    expect(classifyDay(counts(200, 200, 100, 100), "full")).toBe("full");
  });

  it("full mode — all over target → 'full'", () => {
    expect(classifyDay(counts(250, 210, 120, 105), "full")).toBe("full");
  });

  it("shortened mode — all at target → 'full'", () => {
    expect(classifyDay(counts(20, 20, 10, 10), "shortened")).toBe("full");
  });

  // ── mode independence ──────────────────────────────────────────────────────
  it("mode independence — shortened counts with full mode → 'partial' (20 < 200, but taps exist)", () => {
    // counts(20, 20, 10, 10) are all > 0 but none reach full targets (200, 200, 100, 100)
    expect(classifyDay(counts(20, 20, 10, 10), "full")).toBe("partial");
  });

  it("mode independence — all-zero counts in any mode → 'none'", () => {
    expect(classifyDay(counts(0, 0, 0, 0), "full")).toBe("none");
  });

  it("exact boundary — counts exactly at full target → 'full'", () => {
    expect(classifyDay(counts(200, 200, 100, 100), "full")).toBe("full");
  });
});
