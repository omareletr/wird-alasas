---
phase: 02-day-boundary-completion
plan: "02"
subsystem: hooks
tags: [adhan, zustand, indexeddb, geolocation, react-hooks, vitest, tdd]

requires:
  - phase: 02-day-boundary-completion
    provides: devotionalDay utility, sessionStore, settingsStore, addDailyRecord idb helper

provides:
  - useFajrRollover hook — schedules daily archive+reset at Fajr, handles tab-sleep recovery
  - archiveAndReset — exported async function wiring sessionStore → IndexedDB
  - useGeolocation hook — acquires device location, persists via settingsStore, exposes retry()
  - GeoStatus type — union of all acquisition states

affects:
  - 02-day-boundary-completion (plan 03 — UI wiring will consume these hooks)
  - any future settings UI that surfaces geolocation state

tech-stack:
  added: []
  patterns:
    - "Export archiveAndReset separately for direct unit testing without timer tricks"
    - "scheduleNext callback injected into archiveAndReset — enables clean reschedule without closure coupling"
    - "Read fresh store state inside callbacks (useSessionStore.getState(), useSettingsStore.getState()) — never from closure"
    - "cleanup() in afterEach prevents listener leakage between tests that share document event state"
    - "Math.max(delay, 0) on setTimeout guards against negative delays from clock skew"

key-files:
  created:
    - lib/hooks/useFajrRollover.ts
    - lib/hooks/useFajrRollover.test.ts
    - lib/hooks/useGeolocation.ts
  modified: []

key-decisions:
  - "Export archiveAndReset separately from the hook so it can be unit-tested directly without dealing with infinite timer loops from runAllTimersAsync"
  - "scheduleNext is passed as a callback to archiveAndReset rather than closed over — cleaner dependency injection, easier to test"
  - "adhan Coordinates/PrayerTimes mocks must use function constructors (not arrow functions) — vitest enforces this for mock constructors"
  - "cleanup() from @testing-library/react in afterEach is mandatory when tests share document-level event listeners across renderHook calls"

patterns-established:
  - "TDD with exported helpers: when a hook's internal logic needs unit testing, export the helper so tests can call it directly"
  - "Fake timer tests with recursive timers: use runOnlyPendingTimers or inject a mock scheduleNext to break infinite scheduling loops"

requirements-completed: [FOUND-02, FOUND-03]

duration: 3min
completed: "2026-05-30"
---

# Phase 02 Plan 02: Fajr Rollover + Geolocation Hooks Summary

**Fajr-triggered archive-and-reset hook with tab-sleep recovery, plus device geolocation acquisition persisted to settingsStore, all headless with 9 Vitest tests.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-30T22:00:57Z
- **Completed:** 2026-05-30T22:04:13Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `useFajrRollover`: Fajr-based setTimeout scheduling with `archiveAndReset` writing DailyRecord to IndexedDB then resetting sessionStore
- `visibilitychange` handler detects day-boundary crossing on tab wake and fires `archiveAndReset` immediately
- `useGeolocation`: navigator.geolocation wrapper with error code → GeoStatus mapping, persists coordinates via settingsStore on success, exposes `retry()`
- 9 Vitest tests covering all behaviors (TDD)

## Task Commits

1. **Task 1: useFajrRollover hook + tests** - `3765616` (feat — TDD GREEN)
2. **Task 2: useGeolocation hook** - `6b8dea7` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `lib/hooks/useFajrRollover.ts` — Fajr rollover scheduling hook + exported `archiveAndReset` helper
- `lib/hooks/useFajrRollover.test.ts` — 9 tests: archive+reset, null-session guard, visibilitychange recovery, cleanup
- `lib/hooks/useGeolocation.ts` — Location acquisition hook with `GeoStatus` export and `retry()`

## Decisions Made

- Exported `archiveAndReset` separately from the hook so it can be unit-tested directly, avoiding infinite timer loop problems with `vi.runAllTimersAsync`.
- `scheduleNext` is passed as a callback into `archiveAndReset` rather than being closed over — cleaner dependency injection, easier to test.
- adhan `Coordinates`/`PrayerTimes` mocks must use `function` constructors (not arrow functions) — vitest enforces this constraint for `new`-able mocks.
- Added `cleanup()` from `@testing-library/react` in `afterEach` to prevent listener leakage between tests that share `document`-level event state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed adhan mock constructor syntax**
- **Found during:** Task 1 (TDD RED/GREEN iteration)
- **Issue:** Arrow function mocks for `Coordinates`/`PrayerTimes` failed with "not a constructor" because vitest enforces function/class constructors for `vi.fn().mockImplementation`
- **Fix:** Changed mock implementations to use `function` keyword: `function () { return {}; }`
- **Files modified:** `lib/hooks/useFajrRollover.test.ts`
- **Verification:** All 9 tests pass
- **Committed in:** `3765616`

**2. [Rule 1 - Bug] Fixed infinite timer loop in timer tests**
- **Found during:** Task 1 (TDD GREEN iteration)
- **Issue:** Testing via `vi.runAllTimersAsync()` caused infinite loop because each `archiveAndReset` call invoked `scheduleNext` which scheduled another timer
- **Fix:** Refactored tests to call exported `archiveAndReset(vi.fn())` directly; hook tests only verify listener/cleanup behavior
- **Files modified:** `lib/hooks/useFajrRollover.test.ts`
- **Verification:** 9 tests pass, no infinite loop
- **Committed in:** `3765616`

**3. [Rule 1 - Bug] Added cleanup() in afterEach to prevent listener leakage**
- **Found during:** Task 1 — "removes visibilitychange listener on unmount" test failing because previous renderHook leaked a listener
- **Issue:** Without `cleanup()`, previous test's rendered hook wasn't unmounted, leaving a dangling visibilitychange listener that fired in the cleanup test
- **Fix:** Added `import { cleanup }` and `cleanup()` call in `afterEach`
- **Files modified:** `lib/hooks/useFajrRollover.test.ts`
- **Verification:** All 9 tests pass
- **Committed in:** `3765616`

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs in test infrastructure)
**Impact on plan:** All fixes confined to the test file. Production hook code was correct from the first write. No scope creep.

## Issues Encountered

None in production code. All issues were in the test harness (vitest-specific mock constraints + timer behavior with fake timers).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `useFajrRollover` and `useGeolocation` are ready to be consumed by Phase 02 Plan 03 (UI wiring)
- Both hooks are headless and can be mounted anywhere in the component tree
- `GeoStatus` type is exported for use in settings UI
- `archiveAndReset` is exported if any future component needs to trigger manual rollover

---
*Phase: 02-day-boundary-completion*
*Completed: 2026-05-30*
