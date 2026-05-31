---
phase: 01-core-counter
plan: 05
subsystem: ui
tags: [motion, animation, overlay, arabic, adhkar, completion]

# Dependency graph
requires:
  - phase: 01-core-counter-01
    provides: ADHKAR data array and getTarget() used for completion detection
  - phase: 01-core-counter-02
    provides: useSessionStore counts/mode state read in completion check
  - phase: 01-core-counter-03
    provides: DhikrDeck swipe UI that CompletionOverlay renders over
  - phase: 01-core-counter-04
    provides: app/page.tsx structure (ModeToggle, SettingsSheet) into which overlay was wired
provides:
  - CompletionOverlay component (full-screen motion fade-in overlay)
  - Completion detection logic in app/page.tsx (allComplete + overlayDismissed state)
  - User-confirmed Arabic wording for all 4 adhkar in lib/data/adhkar.ts
  - COMP-03 requirement fully satisfied — core counter experience loop closed
affects: [02-fajr-boundary, 03-streaks, 04-pwa]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CompletionOverlay uses motion.div with opacity 0→1 fade (400ms easeIn), no scale/bounce — calm dignified UX
    - Completion state derived from store (allComplete) + local dismissed flag — no store mutation needed
    - overlayDismissed resets automatically when allComplete becomes false after session reset

key-files:
  created:
    - components/counter/CompletionOverlay.tsx
  modified:
    - app/page.tsx
    - lib/data/adhkar.ts

key-decisions:
  - "CompletionOverlay uses bg-black/80 (80% opacity) — counter visible faintly through overlay, feels calm not abrupt"
  - "No auto-dismiss timer — moment of completion is for the user to sit with"
  - "overlayDismissed is local useState (not store) — ephemeral UI state, not worth persisting across sessions"
  - "User corrected adhkar.ts: Dhikr 0 to Hasbunallahu wa nimal-Wakeel, Dhikr 1 to Astaghfirullah al-Azeem (short form), Dhikr 2 to La ilaha illallahul-Malikul-Haqqul-Mubeen, Dhikr 3 Salawat with Sayyidina and full family/companions ending"

patterns-established:
  - "Completion overlay pattern: derive boolean from store state + local dismissed flag, render overlay with motion.div absolute inset-0 z-50 over the page"

requirements-completed: [COMP-03]

# Metrics
duration: 25min (execution) + human checkpoint review
completed: 2026-05-30
---

# Phase 01 Plan 05: Completion Overlay and Arabic Text Confirmation Summary

**Calm full-screen completion overlay (تَقَبَّلَ اللَّهُ) with motion fade-in, wired to allComplete detection, plus user-confirmed Arabic wording across all 4 adhkar — closing the Phase 1 core counter experience loop**

## Performance

- **Duration:** ~25 min execution + human checkpoint review
- **Started:** 2026-05-30
- **Completed:** 2026-05-30
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 3

## Accomplishments

- Built CompletionOverlay component with 400ms opacity fade-in via motion/react — no gamification, no confetti, purely dignified
- Wired completion detection into app/page.tsx: checks all 4 adhkar counts against getTarget() targets, shows overlay only when all complete and not yet dismissed
- User reviewed all 4 Arabic texts at checkpoint and approved with corrections; adhkar.ts updated and committed (254b1aa)
- All 18 tests pass, production build exits 0 — Phase 1 fully complete

## Task Commits

1. **Task 1: Build CompletionOverlay and wire completion detection into the page** - `d57ddc8` (feat)
2. **Checkpoint: Arabic text correction per user review** - `254b1aa` (fix)

**Plan metadata:** (this commit — docs)

## Files Created/Modified

- `components/counter/CompletionOverlay.tsx` - Full-screen motion overlay; bg-black/80, Arabic "تَقَبَّلَ اللَّهُ", English subtitle, tap to dismiss
- `app/page.tsx` - Added allComplete detection, overlayDismissed state, renders CompletionOverlay conditionally
- `lib/data/adhkar.ts` - Arabic text and transliterations corrected per user review at checkpoint

## Decisions Made

- `bg-black/80` (80% opacity black) chosen for overlay — counter shows faintly through, transition feels intentional not jarring
- No auto-dismiss timer — the completion moment is for the user to sit with; they tap when ready
- `overlayDismissed` held in local `useState` not in the Zustand store — it's ephemeral UI state, not worth persisting across reloads or sessions
- Arabic corrections applied per user: Dhikr 0 shortened to "Hasbunallahu wa ni'mal-Wakeel" form, Dhikr 1 to short "Astaghfirullah al-'Azeem", Dhikr 2 to "La ilaha illallahul-Malikul-Haqqul-Mubeen", Dhikr 3 Salawat expanded with Sayyidina and full "wa alihi wa sahbihi wa sallim" ending

## Deviations from Plan

### User-Requested Corrections at Checkpoint

**1. [Checkpoint - User Correction] Arabic wording in adhkar.ts corrected**
- **Found during:** Checkpoint: human-verify (Task 2)
- **Issue:** User reviewed the Arabic text during the checkpoint and requested 4 corrections to wording/transliteration
- **Fix:** Updated all 4 dhikr entries in lib/data/adhkar.ts with corrected Arabic text and transliterations
- **Files modified:** lib/data/adhkar.ts
- **Verification:** npm run test:run — 18 tests still passing after corrections
- **Committed in:** 254b1aa

---

**Total deviations:** 1 (user-requested correction at planned checkpoint — expected, not unplanned)
**Impact on plan:** The checkpoint was designed specifically to catch this. Arabic corrections applied cleanly, tests unaffected.

## Issues Encountered

None — plan executed cleanly. The checkpoint caught the Arabic text corrections as designed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 (Core Counter) is fully complete: COUNT-01 through COUNT-10, COMP-03, SET-01 all satisfied
- Counter page at root route with 4 adhkar, swipe navigation, SVG progress rings, tap-to-count, haptics, wake lock, mode toggle, settings sheet, completion overlay
- Phase 2 (Fajr Boundary) can begin: session store and schema are in place; adhan-js integration to calculate Fajr-based day boundary is the next milestone
- Blocker to verify before Phase 2 planning: adhan-js API shape

---
*Phase: 01-core-counter*
*Completed: 2026-05-30*
