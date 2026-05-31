---
phase: 01-core-counter
plan: 02
subsystem: ui
tags: [next.js, react, motion, svg, tailwind, arabic, framer-motion, zustand]

# Dependency graph
requires:
  - phase: 01-core-counter-01
    provides: "lib/data/adhkar.ts (DhikrEntry, ADHKAR, getTarget), lib/store/sessionStore.ts, lib/store/settingsStore.ts"
provides:
  - "app/page.tsx: counter root route using sessionStore + DhikrCard"
  - "components/counter/DhikrCard.tsx: full dhikr display (Arabic RTL, transliteration, translation, count, ring)"
  - "components/counter/ProgressRing.tsx: SVG animated ring via motion.circle + pathLength"
  - "Noto Naskh Arabic font loaded as --font-arabic CSS variable on <html>"
affects: [01-core-counter-03, 01-core-counter-04]

# Tech tracking
tech-stack:
  added: ["Noto_Naskh_Arabic (next/font/google)", "motion/react (motion.circle, pathLength animation)"]
  patterns:
    - "SVG pathLength normalization for progress ring (no stroke-dashoffset math)"
    - "motion.circle with style={{ rotate: -90 }} for 12-o'clock ring start"
    - "Arabic rendering: dir=rtl + lang=ar + style={{ fontFamily: var(--font-arabic), lineHeight: 2 }}"
    - "h-dvh (not h-screen) for mobile browser chrome resilience"
    - "DhikrCard is pure presentational — page passes props down, no direct store reads in card"

key-files:
  created:
    - "components/counter/ProgressRing.tsx"
    - "components/counter/DhikrCard.tsx"
    - "lib/data/adhkar.ts (Rule 3 fix: was missing from Plan 01)"
  modified:
    - "app/layout.tsx (added Noto Naskh Arabic font + --font-arabic variable)"
    - "app/page.tsx (replaced placeholder with counter shell)"

key-decisions:
  - "Use style={{ rotate: -90 }} on motion.circle for 12-o'clock start — Tailwind -rotate-90 conflicts with Motion inline transforms"
  - "DhikrCard receives entry+count+mode as props, not reading store directly — keeps card reusable for Plan 03 swipe deck"
  - "h-dvh on root <main> prevents mobile viewport height jump when browser chrome shows/hides"
  - "Session initialization checks sessionStartedAt === null with eslint-disable react-hooks/exhaustive-deps — intentional one-time mount effect"

patterns-established:
  - "Pattern: Arabic text always pairs dir=rtl + lang=ar + --font-arabic + lineHeight:2 together"
  - "Pattern: Transliteration and translation always use dir=ltr explicitly"
  - "Pattern: ProgressRing clamps at 1 via Math.min(count/target, 1) — never visually overshoots"

requirements-completed: [COUNT-01, COUNT-04, COUNT-05, COUNT-06]

# Metrics
duration: 5min
completed: 2026-05-30
---

# Phase 01 Plan 02: Counter Display Summary

**Noto Naskh Arabic font + SVG progress ring (motion.circle + pathLength) + DhikrCard (RTL Arabic, transliteration, translation) wired to counter root route**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-30T17:54:12Z
- **Completed:** 2026-05-30T17:59:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Noto Naskh Arabic font loaded from Google Fonts via next/font, exposed as `--font-arabic` CSS variable on `<html>`
- ProgressRing SVG component using `motion.circle` with `pathLength` normalization — starts at 12 o'clock via `style={{ rotate: -90 }}`, turns green when complete
- DhikrCard renders Arabic text (RTL, harakat font, lineHeight 2), transliteration, translation, count number, and progress ring — pure presentational, props-driven
- Counter page at `app/page.tsx` (root route `/`) — auto-initializes session from `defaultMode` on first mount, uses `h-dvh` for mobile viewport stability
- All 4 test files, 18 tests passing; production build exits 0

## Task Commits

1. **Task 1: Noto Naskh Arabic font + ProgressRing component** - `031fc03` (feat)
2. **Task 2: DhikrCard component + counter root page** - `1a219ec` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/layout.tsx` - Added Noto_Naskh_Arabic font import, `--font-arabic` CSS variable on `<html>`
- `components/counter/ProgressRing.tsx` - SVG ring with motion.circle, pathLength, 12-o'clock start
- `components/counter/DhikrCard.tsx` - Full dhikr display: Arabic RTL, transliteration, translation, count, ring
- `app/page.tsx` - Counter shell: root route, session init, passes active entry + count to DhikrCard
- `lib/data/adhkar.ts` - Rule 3 auto-fix: missing dependency created (4 dhikr entries, targets, getTarget)

## Decisions Made
- `style={{ rotate: -90 }}` on `motion.circle` instead of Tailwind `-rotate-90` (Tailwind conflicts with Motion inline transforms)
- DhikrCard is purely presentational (props-driven) so Plan 03 can wrap it in a swipe deck without refactoring
- `h-dvh` on root `<main>` prevents iOS Safari height jump when address bar appears/disappears

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created missing lib/data/adhkar.ts**
- **Found during:** Pre-execution check (Plan 01 dependency)
- **Issue:** `lib/data/adhkar.ts` referenced in Plan 02 context was not present on disk — Plan 01 test files existed but the data file was never created
- **Fix:** Created `lib/data/adhkar.ts` with full `DhikrEntry` interface, `ADHKAR` array (4 entries with Arabic, transliteration, translation, targets), and `getTarget` helper
- **Files modified:** `lib/data/adhkar.ts` (created)
- **Verification:** `npm run test:run` — all 4 test files (including adhkar.test.ts) pass
- **Committed in:** `031fc03` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking missing dependency)
**Impact on plan:** Auto-fix was required to unblock Plan 02 execution. The adhkar data matches exactly what Plan 01 specified. No scope creep.

## Issues Encountered
None beyond the Plan 01 missing file (handled as Rule 3 above).

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Counter display layer complete: font, ring, card, and root page all in place
- Plan 03 (tap-to-increment + swipe navigation) can wrap `<DhikrCard>` in a `<DhikrDeck>` — DhikrCard is already props-driven
- No blockers for Plan 03

---
*Phase: 01-core-counter*
*Completed: 2026-05-30*
