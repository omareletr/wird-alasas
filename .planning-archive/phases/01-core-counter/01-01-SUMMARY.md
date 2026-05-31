---
phase: 01-core-counter
plan: 01
subsystem: testing
tags: [vitest, zustand, typescript, adhkar, data]

# Dependency graph
requires:
  - phase: 00-foundation-cleanup
    provides: "lib/storage/schema.ts with DhikrIndex type, lib/store/sessionStore.ts and settingsStore.ts"
provides:
  - "Static 4-dhikr ADHKAR array with DhikrEntry type and getTarget() helper (lib/data/adhkar.ts)"
  - "Unit test coverage for ADHKAR data shape and getTarget behavior (lib/data/adhkar.test.ts)"
  - "Unit test coverage for sessionStore.incrementCount and reset() behavioral contracts (lib/store/sessionStore.test.ts)"
  - "Unit test coverage for settingsStore.setDefaultMode persistence (lib/store/settingsStore.test.ts)"
affects: [01-02, 01-03, 01-04, 01-05, all counter UI tasks]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zustand store testing without React: getState()/setState() directly in Vitest jsdom, skipHydration avoids localStorage interference"
    - "ADHKAR array as single source of truth for all target values — never hardcode 200/20/100/10 elsewhere"
    - "getTarget(entry, mode) as the canonical API for retrieving per-dhikr targets"

key-files:
  created:
    - lib/data/adhkar.ts
    - lib/data/adhkar.test.ts
    - lib/store/sessionStore.test.ts
    - lib/store/settingsStore.test.ts
  modified: []

key-decisions:
  - "ADHKAR data file is the single source of truth for all target values — UI and logic layers must import from lib/data/adhkar.ts, never hardcode counts"
  - "Zustand store tests use getState()/setState() directly (no React component wrapper) — works in jsdom because skipHydration: true prevents localStorage auto-read"

patterns-established:
  - "Store test pattern: useStore.setState(initialState) in beforeEach, call actions via getState(), assert via getState()"

requirements-completed: [COUNT-01, COUNT-03, COUNT-04, COUNT-05, COUNT-07, COUNT-08, SET-01]

# Metrics
duration: 5min
completed: 2026-05-30
---

# Phase 01 Plan 01: Core Counter Foundation — Data + Tests Summary

**Static 4-dhikr ADHKAR array with DhikrEntry type, getTarget() helper, and 18 unit tests locking store and data behavioral contracts**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-30T17:54:08Z
- **Completed:** 2026-05-30T17:59:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `lib/data/adhkar.ts` — the canonical source of truth for all 4 adhkar entries (arabic, transliteration, translation, targets) and the `getTarget()` helper
- Created `lib/data/adhkar.test.ts` — 6 tests covering entry count, required fields, full/shortened targets, progress clamp logic, and index field correctness
- Created `lib/store/sessionStore.test.ts` — 5 tests locking incrementCount isolation, no-clamp behavior, and reset() contract
- Created `lib/store/settingsStore.test.ts` — 3 tests locking setDefaultMode round-trip persistence
- Full test suite: 4 test files, 18 tests, 0 failures (`npm run test:run` exits 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create adhkar data file with DhikrEntry type and getTarget helper** - `00249f6` (feat)
2. **Task 2: Write unit tests for sessionStore and settingsStore** - `231b449` (test)

## Files Created/Modified

- `lib/data/adhkar.ts` — DhikrEntry interface, ADHKAR array (4 entries), getTarget() helper
- `lib/data/adhkar.test.ts` — 6 unit tests for data shape, getTarget, and progress clamp
- `lib/store/sessionStore.test.ts` — 5 unit tests for incrementCount and reset() behavioral contracts
- `lib/store/settingsStore.test.ts` — 3 unit tests for setDefaultMode persistence

## Decisions Made

- ADHKAR array is the single source of truth for all target values — all downstream code must call `getTarget(entry, mode)`, never hardcode 200/20/100/10
- Zustand store testing uses `getState()`/`setState()` directly without React components; `skipHydration: true` prevents localStorage interference in jsdom

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 0 complete: all 4 test files now exist, `npm run test:run` provides a runnable gate for every downstream plan
- Plans 01-02 through 01-05 can safely import `ADHKAR`, `DhikrEntry`, and `getTarget` from `lib/data/adhkar.ts`
- Store behavioral contracts are locked via tests — regressions will be caught immediately

---
*Phase: 01-core-counter*
*Completed: 2026-05-30*
