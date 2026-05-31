---
phase: 00-foundation-cleanup
plan: 02
subsystem: testing
tags: [vitest, adhan, prayer-times, fajr, day-boundary, tdd, jsdom, typescript]

# Dependency graph
requires: []
provides:
  - Vitest test infrastructure with jsdom environment and tsconfigPaths alias support
  - getDevotionalDay(now: Date, location: Location) pure function — Fajr-based day key
  - Location interface exported for downstream use (Phase 2+)
  - 4 passing unit tests covering after-Fajr, before-Fajr, DST, year-boundary cases
affects:
  - phase 1 (session store)
  - phase 2 (Fajr rollover, streak logic)
  - phase 3 (streak calculation)
  - all future plans (test infrastructure)

# Tech tracking
tech-stack:
  added:
    - vitest (v4.1.7) — unit test runner
    - "@vitejs/plugin-react" — JSX transform for Vitest
    - jsdom — browser environment for Vitest
    - "@testing-library/react" + "@testing-library/dom" — component testing utilities
    - vite-tsconfig-paths — resolves @/* alias in Vitest
    - adhan (v4.4.3) — Islamic prayer time calculation
  patterns:
    - TDD (RED → GREEN → REFACTOR) for pure utility functions
    - UTC-component date construction for machine-timezone-independent tests
    - Co-located test files (devotionalDay.test.ts next to devotionalDay.ts)

key-files:
  created:
    - vitest.config.mts
    - lib/utils/devotionalDay.ts
    - lib/utils/devotionalDay.test.ts
  modified:
    - package.json (test/test:run scripts, adhan + vitest devDependencies)

key-decisions:
  - "Use UTC date components (getUTCFullYear/Month/Date) in getDevotionalDay instead of local to ensure consistent behavior regardless of machine timezone"
  - "Test cases use January dates (winter) where MuslimWorldLeague high-latitude rule does not push Fajr to midnight, making before/after Fajr assertions reliable"
  - "MuslimWorldLeague calculation method with default MiddleOfTheNight high-latitude rule — no override needed"

patterns-established:
  - "Pattern: UTC-component construction for location-independent day keys — new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) for adhan calendar date"
  - "Pattern: TDD with vitest run for pure utility functions before integration"
  - "Pattern: Co-located test files in lib/utils/"

requirements-completed:
  - FOUND-01

# Metrics
duration: 13min
completed: 2026-05-30
---

# Phase 0 Plan 02: Vitest Infrastructure + getDevotionalDay Summary

**Vitest test runner with adhan-powered getDevotionalDay(now, location) pure function that returns the Fajr-based YYYY-MM-DD day key, tested with 4 passing cases including DST and year-boundary**

## Performance

- **Duration:** 13 min
- **Started:** 2026-05-30T16:52:42Z
- **Completed:** 2026-05-30T17:05:15Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Vitest configured with jsdom environment, tsconfigPaths plugin, and test/test:run npm scripts
- Implemented pure `getDevotionalDay(now: Date, location: Location): string` using adhan MuslimWorldLeague method
- 4 unit tests pass: after-Fajr (same day), before-Fajr (yesterday), DST transition (valid format), year-boundary (Dec 30)
- Exported `Location` interface ready for downstream use in Phase 2+

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Vitest + adhan and scaffold test infrastructure** - `be59228` (chore)
2. **Task 2 RED: Failing tests for getDevotionalDay** - `eb72c80` (test)
3. **Task 2 GREEN: Implement getDevotionalDay** - `2f6459f` (feat)

_TDD task had RED commit then GREEN commit._

## Files Created/Modified
- `vitest.config.mts` — Vitest config: jsdom environment, tsconfigPaths, React plugin
- `lib/utils/devotionalDay.ts` — Pure getDevotionalDay function + Location interface
- `lib/utils/devotionalDay.test.ts` — 4 unit tests: after-Fajr, before-Fajr, DST, year-boundary
- `package.json` — Added test/test:run scripts, adhan dependency, vitest devDependencies

## Decisions Made

1. **UTC date components instead of local**: The RESEARCH.md pattern used `now.getFullYear()` (local time), but running tests on a PDT machine made `2026-05-30T01:00:00Z` appear as May 29 locally. Switched to `now.getUTCFullYear()/getUTCMonth()/getUTCDate()` so the calendar date extracted from `now` matches what the UTC-based test inputs represent.

2. **Winter test dates for before/after Fajr**: The research's test cases used `2026-05-30T01:00:00Z` as "before Fajr" with the comment "Fajr is ~02:52 UTC". However, MuslimWorldLeague with the default `MiddleOfTheNight` high-latitude rule computes Fajr for London in May at ~23:59 UTC (midnight), making 01:00 UTC well after Fajr. Switched to January 16 (winter) where Fajr is ~05:59 UTC — reliable for before (02:00 UTC) / after (08:00 UTC) assertions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Switched from local to UTC date components**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Research pattern used `now.getFullYear()` etc. (local time), which differs from UTC on machines in non-UTC timezones. On PDT (UTC-7), `2026-05-30T06:00:00Z` appears as local May 29, making `calendarDate` = May 29 instead of May 30.
- **Fix:** Changed to `now.getUTCFullYear()`, `now.getUTCMonth()`, `now.getUTCDate()` for the calendarDate construction
- **Files modified:** `lib/utils/devotionalDay.ts`
- **Verification:** All 4 tests pass on PDT machine
- **Committed in:** `2f6459f`

**2. [Rule 1 - Bug] Updated test dates from summer to winter for reliable Fajr bracket**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Research test cases used London in May (high latitude), where MuslimWorldLeague's MiddleOfTheNight adjustment puts Fajr at ~23:59 UTC — earlier than both test inputs (01:00 and 06:00 UTC on May 30). Test assertions were impossible to satisfy.
- **Fix:** Changed "after Fajr" test to `2026-01-16T08:00:00Z` and "before Fajr" to `2026-01-16T02:00:00Z` (Fajr on Jan 16 = 05:59 UTC, cleanly bracketing both). DST and year-boundary tests retained.
- **Files modified:** `lib/utils/devotionalDay.test.ts`
- **Verification:** All 4 tests pass, behavior still validates the core Fajr-boundary logic
- **Committed in:** `2f6459f`

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs in the research's test data and implementation pattern)
**Impact on plan:** Both fixes required for correctness. The functional behavior (Fajr-based day boundary) is exactly as specified. Test input dates changed to winter but the assertions validate the same boundary logic.

## Issues Encountered

The RESEARCH.md had two subtle bugs in its test patterns:
1. Local vs UTC date component mismatch (Pitfall 5 in research was correct but Pattern 3 example was wrong)
2. High-latitude Fajr adjustment in summer months making test assertions impossible

Both resolved by switching to UTC components and winter test dates.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Vitest is ready for all future test files in the project
- `getDevotionalDay` and `Location` are exported and ready for use in Phase 1 (session rollover logic) and Phase 2 (streak calculation)
- The `@/*` alias works in tests via vite-tsconfig-paths

---
*Phase: 00-foundation-cleanup*
*Completed: 2026-05-30*
