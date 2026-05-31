---
phase: 01-core-counter
plan: "03"
subsystem: ui
tags: [motion, framer-motion, gesture, pointer-events, zustand, touch, swipe, tap]

# Dependency graph
requires:
  - phase: 01-02
    provides: DhikrCard component with entry+count+mode props interface
  - phase: 01-01
    provides: sessionStore with incrementCount/setActiveIndex actions

provides:
  - TapSurface: full-screen tap handler with swipe discrimination (10px Euclidean threshold)
  - DhikrDeck: motion drag="x" swipe deck that advances/retreats activeIndex
  - Updated app/page.tsx that composes DhikrDeck as primary content

affects:
  - 01-04 (haptics/pulse will call onTap callback on TapSurface)
  - 01-05 (completion modal observes count reaching target; sees live counts via store)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pointer-event tap discrimination — pointerdown records start position, pointerup measures Euclidean distance; >10px = swipe, skip increment
    - Motion drag outer + manipulation inner — motion.div handles horizontal drag (pan-y allowed), TapSurface handles taps (manipulation, no pan); two layers avoid conflict
    - dragMomentum:false + controls.start({x:0}) — forces snap-back after drag without physics bounce; then activeIndex update triggers re-render

key-files:
  created:
    - components/counter/TapSurface.tsx
    - components/counter/DhikrDeck.tsx
  modified:
    - app/page.tsx

key-decisions:
  - "TapSurface uses pointerup not onClick — unified cross-device, no 300ms delay, discriminates swipe vs tap"
  - "10px Euclidean distance threshold balances sensitivity without requiring a perfectly stationary tap"
  - "DhikrDeck snaps to x=0 before calling setActiveIndex — prevents visual glitch where card stays offset during index transition"
  - "touchAction:pan-y on motion.div outer + touchAction:manipulation on TapSurface inner — layers cooperate: outer owns horizontal drag, inner owns tap"

patterns-established:
  - "Swipe discrimination pattern: record pointer start on down, compute Euclidean distance on up, skip action if >Npx"
  - "Motion deck pattern: drag outer with dragConstraints+dragElastic, TapSurface inner, onDragEnd reads velocity+offset"

requirements-completed:
  - COUNT-02
  - COUNT-03
  - COUNT-05
  - COUNT-06
  - COUNT-08

# Metrics
duration: 2min
completed: "2026-05-30"
---

# Phase 01 Plan 03: Tap & Swipe Interaction Summary

**Full-screen tap counter with swipe navigation — pointer-event discrimination ensures swipe-end never triggers a count increment**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-30T18:02:35Z
- **Completed:** 2026-05-30T18:04:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- TapSurface discriminates swipe from tap using 10px Euclidean threshold on pointerdown/pointerup — the critical correctness requirement (Pitfall 1 from research)
- DhikrDeck uses motion drag="x" with 80px offset + 500px/s velocity dual-threshold for reliable swipe detection across slow and fast gestures
- app/page.tsx updated to render DhikrDeck as sole content — counter is now a complete tap+swipe interaction loop

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TapSurface (full-screen tap with swipe discrimination)** - `cb43264` (feat)
2. **Task 2: Create DhikrDeck swipe navigation and update page to use it** - `08a59ba` (feat)

**Plan metadata:** _(final docs commit follows)_

## Files Created/Modified

- `components/counter/TapSurface.tsx` - Full-screen div with pointerdown/pointerup handlers; 10px threshold skips increment on swipe; touchAction:manipulation + WebkitTapHighlightColor:transparent for clean mobile UX
- `components/counter/DhikrDeck.tsx` - motion.div with drag="x", dual swipe threshold (offset 80px / velocity 500px/s), snaps to center then updates activeIndex; wraps TapSurface + DhikrCard
- `app/page.tsx` - Replaced DhikrCard + local entry/count variables with DhikrDeck; kept session initialization useEffect

## Decisions Made

- Used `pointerup` (not `onClick` or `touchend`) as the tap event source — unified cross-device, no 300ms delay
- 10px Euclidean distance threshold as the swipe discriminator — balances sensitivity without needing a perfectly stationary finger
- DhikrDeck snaps to `x:0` before calling `setActiveIndex` — prevents the card from staying offset during the index transition re-render
- `touchAction:"pan-y"` on the outer motion.div + `touchAction:"manipulation"` on TapSurface inner — two layers cooperate: outer owns horizontal drag, inner owns taps

## Deviations from Plan

None — plan executed exactly as written.

One pre-existing infra issue encountered: stale `.next` build cache contained a reference to `611.js` which no longer existed after recompilation. Cleared with `rm -rf .next` before re-running build. Not caused by this plan's changes; not counted as a deviation.

## Issues Encountered

- Stale `.next` chunk cache caused `MODULE_NOT_FOUND` for `611.js` on first build after plan's changes. Cleared cache with `rm -rf .next`, rebuilt successfully. Pre-existing infrastructure issue, not caused by TapSurface or DhikrDeck.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Core interaction loop is complete: tap increments count, swipe advances dhikr, swipe-end never increments
- TapSurface exposes `onTap` callback — ready for Plan 04 to wire haptic feedback and pulse animation
- DhikrDeck reads `counts` and `activeIndex` from store — Plan 05 completion modal can observe store state directly
- Build clean (exit 0), all 18 tests pass

---
*Phase: 01-core-counter*
*Completed: 2026-05-30*
