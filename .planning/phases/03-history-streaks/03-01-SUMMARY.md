---
phase: 03-history-streaks
plan: "01"
subsystem: streaks
tags: [tdd, pure-function, streaks, history]
dependency_graph:
  requires: []
  provides: [computeStreaks, StreakResult, HeatmapCalendar-test-scaffold]
  affects: [03-02-PLAN.md]
tech_stack:
  added: []
  patterns: [TDD RED-GREEN-REFACTOR, pure-function, UTC-date-arithmetic]
key_files:
  created:
    - lib/utils/streaks.ts
    - lib/utils/streaks.test.ts
    - components/history/HeatmapCalendar.test.ts
  modified: []
decisions:
  - "Partial days sustain streak (classifyDay !== 'none') — consistent with STATE.md streak policy"
  - "Current streak walks backward from last active day (not today) — prevents off-by-one when today has no record"
  - "isConsecutive uses UTC T00:00:00Z parsing + 86_400_000ms diff — timezone-independent"
  - "HeatmapCalendar.test.ts scaffold is intentionally RED in Wave 1 — turns GREEN when plan 03-02 creates HeatmapCalendar.tsx"
metrics:
  duration_seconds: 77
  completed_date: "2026-05-30"
  tasks_completed: 3
  files_changed: 3
---

# Phase 3 Plan 1: computeStreaks Implementation + recordsToActivityData Test Scaffold Summary

**One-liner:** TDD-implemented `computeStreaks` pure function (8 cases, all GREEN) with Wave 0 test scaffold for `recordsToActivityData` (intentionally RED until plan 03-02).

## What Was Built

### `lib/utils/streaks.ts`

Exports `computeStreaks(records: DailyRecord[]): StreakResult` and the `StreakResult` interface.

Streak policy:
- Active day = `classifyDay(record.counts, record.mode) !== "none"` (partial sustains streak)
- Current streak = backward walk from last active day key (no off-by-one; today without a record doesn't reset to zero)
- Longest streak = single forward pass over sorted active days
- `isConsecutive` uses UTC `T00:00:00Z` parsing + 86,400,000ms diff — timezone-independent

### `lib/utils/streaks.test.ts`

8 test cases (all passing):
1. Empty records → `{ current: 0, longest: 0 }`
2. Single full record → `{ current: 1, longest: 1 }`
3. Single none record → `{ current: 0, longest: 0 }`
4. 3 consecutive full days → `{ current: 3, longest: 3 }`
5. Gap breaks streak → `{ current: 1, longest: 2 }`
6. Partial sustains streak → `{ current: 3, longest: 3 }`
7. Mixed run with none gap → `{ current: 3, longest: 3 }`
8. Yesterday active, today has no record → `{ current: 1, longest: 1 }` (no off-by-one)

### `components/history/HeatmapCalendar.test.ts`

Wave 0 scaffold for HIST-03. 4 test cases (intentionally RED — module not found):
- Case A: none record → `level=0, count=0`
- Case B: partial record → `level=1, count=1`
- Case C: full record → `level=2, count=2`
- Case D: output sorted ascending by date

## Commits

| Phase | Commit | Description |
|-------|--------|-------------|
| RED | `41fcabc` | test(03-01): add failing tests for computeStreaks + Wave 0 scaffold |
| GREEN | `038a869` | feat(03-01): implement computeStreaks pure function |

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- `npx vitest run lib/utils/streaks.test.ts` — 8/8 tests pass
- `npx vitest run components/history/HeatmapCalendar.test.ts` — FAIL with "Failed to resolve import" (expected: module not created until plan 03-02)

## What Plan 03-02 Gets

- `computeStreaks` ready to import from `@/lib/utils/streaks`
- `HeatmapCalendar.test.ts` scaffold waiting — implementing `recordsToActivityData` in `HeatmapCalendar.tsx` will turn these tests GREEN automatically
