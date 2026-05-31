---
phase: 03-history-streaks
plan: "02"
subsystem: history-ui
tags: [react-activity-calendar, heatmap, streaks, bottom-sheet, indexeddb]

requires:
  - phase: 03-history-streaks-01
    provides: [computeStreaks, StreakResult, HeatmapCalendar-test-scaffold]
provides:
  - StreakDisplay component (current + longest streak number display)
  - HeatmapCalendar component (react-activity-calendar wrapper with 3 levels)
  - recordsToActivityData helper (DailyRecord[] → Activity[])
  - HistorySheet component (bottom sheet composing streak + heatmap from IndexedDB)
affects: [03-03-PLAN.md]

tech-stack:
  added: [react-activity-calendar@3.2.0]
  patterns:
    - named export from react-activity-calendar v3 ({ActivityCalendar} not default)
    - renderBlock+React.cloneElement for click handlers in react-activity-calendar v3
    - vitest css.postcss:{} override to neutralize PostCSS plugin errors from library CSS
    - bottom sheet pattern (side="bottom") matching SettingsSheet style

key-files:
  created:
    - components/history/StreakDisplay.tsx
    - components/history/HeatmapCalendar.tsx
    - components/history/HistorySheet.tsx
  modified:
    - package.json (added react-activity-calendar)
    - vitest.config.mts (added css.postcss:{} to fix test PostCSS error)

key-decisions:
  - "react-activity-calendar v3 uses named export {ActivityCalendar}, not default export — fixed at implementation time"
  - "eventHandlers API removed in v3 — use renderBlock + React.cloneElement to attach onClick"
  - "vitest css.postcss:{} overrides postcss.config.mjs to prevent tooltips.css transform error in tests"
  - "recordsToActivityData level encoding: none=0/count=0, partial=1/count=1, full=2/count=2"

patterns-established:
  - "HistorySheet pattern: load records in useEffect → derive activityData + streaks → compose StreakDisplay + HeatmapCalendar"
  - "CSS imports from npm packages require vitest css.postcss:{} override when postcss.config.mjs uses incompatible plugins"

requirements-completed: [HIST-01, HIST-02, HIST-03]

duration: 3min
completed: "2026-05-30"
---

# Phase 3 Plan 2: HistorySheet — Streak Display + Heatmap Calendar Summary

**HistorySheet bottom sheet loading DailyRecord[] from IndexedDB, displaying current/longest streaks and a 3-level react-activity-calendar heatmap (none/partial/full) with amber accent theme.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-30T16:00:22Z
- **Completed:** 2026-05-30T16:02:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `StreakDisplay`: pure display component rendering current and longest streak numbers in large monospace type
- `HeatmapCalendar`: wraps react-activity-calendar v3 with 3-level dark theme (transparent/muted-white/amber), click handler via renderBlock, empty state guard
- `recordsToActivityData`: exported helper mapping DailyRecord[] to Activity[], sorted ascending by date — turns HeatmapCalendar.test.ts scaffold GREEN (all 4 tests pass)
- `HistorySheet`: bottom sheet that loads IndexedDB on open, derives streaks + activity data, composes the two sub-components with a loading skeleton

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-activity-calendar + StreakDisplay + HeatmapCalendar** - `89ae74c` (feat)
2. **Task 2: Build HistorySheet composing streak + heatmap** - `84167db` (feat)

## Files Created/Modified

- `components/history/StreakDisplay.tsx` - Pure display of current/longest streak numbers
- `components/history/HeatmapCalendar.tsx` - ActivityCalendar wrapper + recordsToActivityData helper
- `components/history/HistorySheet.tsx` - Bottom sheet loading IndexedDB, composing streak + heatmap
- `package.json` / `package-lock.json` - Added react-activity-calendar v3.2.0
- `vitest.config.mts` - Added css.postcss:{} to fix library CSS PostCSS error in tests

## Decisions Made

- `react-activity-calendar` v3 has no default export — used `{ ActivityCalendar }` named import
- `eventHandlers` API was removed in v3; click handling done via `renderBlock` + `React.cloneElement`
- vitest config: `css.postcss: {}` overrides `postcss.config.mjs` so Vite doesn't try to process `tooltips.css` through the project's @tailwindcss/postcss plugin (incompatible in test env)
- Level encoding in Activity: `none=0,count=0` / `partial=1,count=1` / `full=2,count=2` — count mirrors level for simplicity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] react-activity-calendar v3 has no default export**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** Plan said `import ActivityCalendar from "react-activity-calendar"` but v3 only exports named `{ ActivityCalendar }`
- **Fix:** Changed to named import `{ ActivityCalendar }`
- **Files modified:** components/history/HeatmapCalendar.tsx
- **Verification:** `npx tsc --noEmit` — zero errors
- **Committed in:** `89ae74c` (Task 1 commit)

**2. [Rule 1 - Bug] eventHandlers API removed in react-activity-calendar v3**
- **Found during:** Task 1 — confirmed by reading library type definitions
- **Issue:** Plan suggested `eventHandlers={{ onClick: () => (activity) => onDayClick?.(activity.date) }}` which doesn't exist in v3 types
- **Fix:** Used `renderBlock={(block, activity) => React.cloneElement(block, { onClick: ... })}` — the v3 supported pattern
- **Files modified:** components/history/HeatmapCalendar.tsx
- **Verification:** `npx tsc --noEmit` — zero errors
- **Committed in:** `89ae74c` (Task 1 commit)

**3. [Rule 3 - Blocking] PostCSS error when importing tooltips.css in vitest**
- **Found during:** Task 1 (running HeatmapCalendar tests)
- **Issue:** `import "react-activity-calendar/tooltips.css"` in HeatmapCalendar.tsx caused Vite to try processing it through the project's `@tailwindcss/postcss` plugin, which is not compatible in the vitest jsdom environment
- **Fix:** Added `css: { postcss: {} }` to `vitest.config.mts` — overrides the project PostCSS config so Vite uses a no-op processor for CSS in tests
- **Files modified:** vitest.config.mts
- **Verification:** `npx vitest run components/history/HeatmapCalendar.test.ts` — 4/4 pass
- **Committed in:** `89ae74c` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 3 blocking)
**Impact on plan:** All fixes necessary for correctness and test execution. react-activity-calendar v3 API changes from the plan's research assumptions — fixed inline without scope creep.

## Issues Encountered

react-activity-calendar v3 changed the API surface from v2 (no default export, no eventHandlers prop). The plan noted `eventHandlers` was "LOW confidence from research" — confirmed at implementation time, resolved with documented v3 pattern.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three `components/history/` components ready for plan 03-03 (DayDetailSheet)
- `selectedDay` state already in HistorySheet — plan 03-03 mounts DayDetailSheet here
- `HeatmapCalendar.test.ts` fully GREEN (4/4 tests)
- Requirements HIST-01 (streak display), HIST-02 (current streak), HIST-03 (heatmap) all satisfied

---
*Phase: 03-history-streaks*
*Completed: 2026-05-30*
