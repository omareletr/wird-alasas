---
phase: 01-core-counter
plan: "04"
subsystem: ui
tags: [wake-lock, haptic, motion, framer-motion, shadcn, zustand, react-hooks]

# Dependency graph
requires:
  - phase: 01-core-counter-01
    provides: sessionStore with mode/setMode, settingsStore with defaultMode/setDefaultMode
  - phase: 01-core-counter-02
    provides: DhikrCard component, ProgressRing, DhikrEntry/getTarget from adhkar data
provides:
  - useWakeLock hook: acquires screen wake lock on mount, re-acquires on tab switch, releases on unmount
  - useHaptic hook: vibrate(ms) function with silent fallback on iOS
  - DhikrCard count pulse animation via motion.span key={count}
  - ModeToggle: inline session mode toggle (Full/Short) in counter header
  - SettingsSheet: persistent default mode radio group via shadcn Sheet
affects:
  - 01-core-counter-03
  - 01-core-counter-05

# Tech tracking
tech-stack:
  added: [shadcn/ui sheet, shadcn/ui radio-group, motion/react animation]
  patterns: [custom hooks in lib/hooks/, feature-detection no-op pattern, count-as-source-of-truth for haptic]

key-files:
  created:
    - lib/hooks/useWakeLock.ts
    - lib/hooks/useHaptic.ts
    - components/counter/ModeToggle.tsx
    - components/settings/SettingsSheet.tsx
    - components/ui/sheet.tsx
    - components/ui/radio-group.tsx
  modified:
    - components/counter/DhikrCard.tsx
    - app/page.tsx

key-decisions:
  - "useHaptic fires on count change (useEffect) rather than on tap event — count is the single source of truth for 'a tap happened'"
  - "useWakeLock is a silent no-op on unsupported browsers — wake lock is an enhancement, not a requirement"
  - "Safe area inset applied via inline style (env(safe-area-inset-top, 16px)) not Tailwind — Tailwind v4 pt-safe-top not available"
  - "shadcn Sheet and RadioGroup installed via CLI rather than hand-written"

patterns-established:
  - "Custom hooks in lib/hooks/ — platform API hooks use feature detection and silent fallback pattern"
  - "motion.span with key={count} for count pulse — re-animates every increment without extra state"

requirements-completed: [COUNT-07, COUNT-09, COUNT-10, SET-01]

# Metrics
duration: 7min
completed: 2026-05-30
---

# Phase 01 Plan 04: Platform APIs and Mode Switching UI Summary

**Wake lock, haptic feedback, and mode-switching UI (ModeToggle + SettingsSheet) wired via custom hooks and shadcn Sheet/RadioGroup**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-30T18:03:00Z
- **Completed:** 2026-05-30T18:05:12Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Created `useWakeLock` hook that acquires screen wake lock on mount, re-acquires after tab switch, and releases on unmount — silent no-op on unsupported browsers
- Created `useHaptic` hook returning `vibrate(ms)` with `navigator.vibrate` feature detection; iOS gets silent no-op, no console errors
- Updated DhikrCard with `motion.span key={count}` pulse animation (scale 1.06 → 1, 150ms) as visual tap feedback on all platforms; haptic fires on count change via `useEffect`
- Built ModeToggle component for in-session Full/Short switching writing to sessionStore
- Built SettingsSheet (shadcn Sheet + RadioGroup) for persistent defaultMode preference via settingsStore
- Wired `useWakeLock()` call and header row (ModeToggle + SettingsSheet) into counter page

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useWakeLock and useHaptic hooks; add pulse animation to DhikrCard** - `52bc09f` (feat)
2. **Task 2: Build ModeToggle and SettingsSheet; wire into counter page** - `7f997bb` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `lib/hooks/useWakeLock.ts` - Screen wake lock hook with visibilitychange re-acquire
- `lib/hooks/useHaptic.ts` - Haptic vibration hook with silent iOS fallback
- `components/counter/DhikrCard.tsx` - Added motion.span pulse animation and haptic-on-count-change
- `components/counter/ModeToggle.tsx` - In-session Full/Short mode toggle button
- `components/settings/SettingsSheet.tsx` - shadcn Sheet with RadioGroup for defaultMode setting
- `components/ui/sheet.tsx` - Installed via shadcn CLI
- `components/ui/radio-group.tsx` - Installed via shadcn CLI
- `app/page.tsx` - Added useWakeLock(), header row with ModeToggle + SettingsSheet, wrapped DhikrDeck in flex-1

## Decisions Made

- `useHaptic` fires on count change via `useEffect` (not on tap event) — count is the single source of truth for "a tap happened"; keeps TapSurface interface clean
- `useWakeLock` is a silent no-op on browsers without Wake Lock API — enhancement, not a requirement
- Safe area inset applied via `style={{ paddingTop: "env(safe-area-inset-top, 16px)" }}` inline — Tailwind v4's `pt-safe-top` class not available in this setup
- shadcn Sheet and RadioGroup installed via CLI per project convention

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused eslint-disable-line comment in useWakeLock.ts**
- **Found during:** Task 1 verification (build lint warning)
- **Issue:** The `// eslint-disable-line react-hooks/exhaustive-deps` comment on the empty deps array `[]` triggered an "unused directive" warning — the rule doesn't fire on empty arrays
- **Fix:** Removed the comment; the empty `[]` is correct as-is (acquire() uses only refs and navigator which don't need to be deps)
- **Files modified:** lib/hooks/useWakeLock.ts
- **Verification:** Build passed with no warnings
- **Committed in:** `52bc09f` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — unnecessary lint directive)
**Impact on plan:** Minor cleanup. No scope creep.

## Issues Encountered

- `app/page.tsx` was updated by Plan 03 execution to use `DhikrDeck` (replacing direct `DhikrCard` + store reading). Adapted Task 2 to preserve the DhikrDeck integration while adding the header row and useWakeLock.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All platform APIs (wake lock, haptic) are hooked in and ready for Plan 05 to complete the tap surface wiring
- ModeToggle and SettingsSheet are live in the counter page header
- Wave 2 (Plans 03 and 04) is now complete; Plan 05 (swipe deck assembly) can proceed

---
*Phase: 01-core-counter*
*Completed: 2026-05-30*
