# Roadmap: wird al-asas

## Overview

wird al-asas is a mobile-first PWA dhikr counter for one fixed Islamic litany of four adhkar recited daily. The journey starts by stripping the unused Supabase/auth scaffolding and standing up the local-first storage schema plus the single keystone function the whole app pivots on — `getDevotionalDay()`. From that foundation we build the core counter experience (the MVP validation slice): a full-screen, swipeable, ring-fed tap counter with correct Arabic rendering and a wake lock. Next we wire the real Fajr-based day boundary with offline prayer-time calculation, which turns raw counts into dated full/partial completion records. History then surfaces those records as streaks and a calendar heatmap. Finally, PWA installability and offline precaching make the app survive on the home screen and work without a network — closing the don't-lose-your-practice loop. Push notifications are explicitly v2 and out of scope here.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 0: Foundation & Cleanup** - Strip Supabase, establish local storage schema and the `getDevotionalDay()` keystone
- [ ] **Phase 1: Core Counter** - Full-screen tap counter with ring, modes, swipe deck, Arabic rendering, wake lock
- [ ] **Phase 2: Day Boundary & Completion** - Offline Fajr calculation, daily rollover, full/partial completion records
- [ ] **Phase 3: History & Streaks** - Streaks, calendar heatmap, per-day breakdown
- [ ] **Phase 4: PWA & Offline** - Installable, offline-capable, data persistence safeguards

## Phase Details

### Phase 0: Foundation & Cleanup
**Goal**: A clean local-first codebase with a tested storage layer and the canonical day-boundary function, ready for feature work.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01
**Success Criteria** (what must be TRUE):
  1. The app builds and runs with no Supabase dependencies, auth routes, or SSR middleware remaining
  2. App data (settings, active session, history) reads and writes to localStorage + IndexedDB with a versioned schema
  3. `getDevotionalDay(now, location) → dayKey` exists as a single pure function with passing unit tests across timezone/DST edge cases
  4. State management (Zustand store) is wired and persists/rehydrates the active session across a page reload
**Plans**: 3 plans

Plans:
- [ ] 00-01-PLAN.md — Supabase removal, dark theme, branded placeholder page
- [ ] 00-02-PLAN.md — Vitest setup + getDevotionalDay TDD
- [ ] 00-03-PLAN.md — Storage schema, IndexedDB helper, Zustand stores, StoreHydration

### Phase 1: Core Counter
**Goal**: A focused, distraction-free counting experience for all 4 adhkar that never loses count — the MVP validation slice.
**Depends on**: Phase 0
**Requirements**: COUNT-01, COUNT-02, COUNT-03, COUNT-04, COUNT-05, COUNT-06, COUNT-07, COUNT-08, COUNT-09, COUNT-10, COMP-03, SET-01
**Success Criteria** (what must be TRUE):
  1. User sees one dhikr at a time (Arabic, transliteration, translation) and can swipe between all 4 in any order
  2. Tapping anywhere on the full screen increments the count and fills the circular progress ring toward the target; tapping past target keeps counting and shows a completion mark
  3. User can switch between Full (200/200/100/100) and Shortened (20/20/10/10) modes for the session, and a chosen default persists across sessions
  4. Each tap gives feedback (haptic where supported, visual pulse on iOS) and the screen stays awake while counting
  5. Closing and reopening the app resumes every dhikr from its saved count; reaching a dhikr's target shows a calm, non-gamified completion moment
**Plans**: 5 plans

Plans:
- [ ] 01-01-PLAN.md — Test scaffold: adhkar data file + store unit tests (Wave 0)
- [ ] 01-02-PLAN.md — Counter page, DhikrCard, ProgressRing (Arabic font, SVG ring)
- [ ] 01-03-PLAN.md — TapSurface + DhikrDeck swipe navigation (tap/swipe discrimination)
- [ ] 01-04-PLAN.md — useWakeLock, useHaptic, ModeToggle, SettingsSheet (parallel with 03)
- [ ] 01-05-PLAN.md — CompletionOverlay + Arabic text confirmation checkpoint

### Phase 2: Day Boundary & Completion
**Goal**: Counts become dated devotional records that roll over at the correct Fajr boundary and classify each day as full or partial completion.
**Depends on**: Phase 1
**Requirements**: FOUND-02, FOUND-03, COMP-01, COMP-02, COMP-04
**Success Criteria** (what must be TRUE):
  1. The day resets at the locally-calculated Fajr time (adhan-js, no network); manual location entry works when geolocation is denied or unavailable
  2. At Fajr rollover the prior day's counts are archived to history and the active session resets to zero
  3. A day where all 4 adhkar reach target is recorded as fully complete; a day with at least 1 (but not all 4) complete is recorded as partially complete
  4. Partial completion is rendered visually distinct from full completion (faded / different color) wherever completion state is shown
**Plans**: TBD

### Phase 3: History & Streaks
**Goal**: The user can see their devotional consistency over time and review what they completed each day.
**Depends on**: Phase 2
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. User can view their current streak (consecutive days with at least 1 dhikr completed) and their longest streak ever
  2. A calendar heatmap shows full / partial / none completion level for each day
  3. User can open any day in history and see the per-dhikr completion breakdown
  4. Streak counts follow the defined partial-day rule consistently and are computed purely from history records
**Plans**: TBD

### Phase 4: PWA & Offline
**Goal**: The app installs to the home screen, works fully offline, and protects the user's local devotional data.
**Depends on**: Phase 3
**Requirements**: PWA-01, PWA-02
**Success Criteria** (what must be TRUE):
  1. After first load the app works fully offline (app shell, fonts, and assets precached via service worker)
  2. The app can be installed to the home screen and presents an install prompt explaining why (iOS data-eviction protection)
  3. Persistent storage is requested early so local history survives iOS browser data eviction
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 0 → 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Foundation & Cleanup | 3/3 | Complete | 2026-05-30 |
| 1. Core Counter | 3/5 | In Progress|  |
| 2. Day Boundary & Completion | 0/TBD | Not started | - |
| 3. History & Streaks | 0/TBD | Not started | - |
| 4. PWA & Offline | 0/TBD | Not started | - |

## Research Flags

- **Phase 2 (Prayer time)**: Verify current adhan-js API shape before planning. Confirm hardcoded Muslim World League method (per PROJECT.md decision).
- **Phase 3 (Streaks)**: Confirm partial-day streak policy — recommended: a partial day records but does NOT sustain the streak. Decide before building streak logic.
- **Phase 4 (PWA)**: Verify Serwist + Next.js 15 App Router compatibility before starting.
- **Phases 0, 1**: Standard well-understood patterns — no flags.

## Out of Scope (deferred to v2)

- Fajr push notifications (NOTF-01) — requires a push backend; design the day-boundary so a backend can be added without UI rework
- JSON export/import (DATA-01, DATA-02)
- Transliteration / translation toggles (POL-01, POL-02)
