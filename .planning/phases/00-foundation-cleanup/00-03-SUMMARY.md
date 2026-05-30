---
phase: 00-foundation-cleanup
plan: "03"
subsystem: storage
tags: [zustand, idb, indexeddb, localstorage, persist, schema, hydration]

# Dependency graph
requires:
  - phase: 00-01
    provides: cleaned project without Supabase, dark-themed placeholder page
  - phase: 00-02
    provides: Vitest infrastructure and getDevotionalDay for day boundary logic
provides:
  - Typed schema interfaces: ActiveSession, UserSettings, DailyRecord, DhikrIndex, DHIKR_COUNT
  - IndexedDB helpers: addDailyRecord, getAllDailyRecords, getDailyRecord
  - localStorage schema migration runner (v0->v1 strips legacy Supabase key)
  - Zustand sessionStore with skipHydration persist (key "wird-session")
  - Zustand settingsStore with skipHydration persist (key "wird-settings")
  - StoreHydration client component mounted in layout for SSR-safe rehydration
affects: [phase-01-dhikr-counter, phase-02-history, phase-03-streaks]

# Tech tracking
tech-stack:
  added: [zustand@5, idb@8]
  patterns:
    - Zustand persist with skipHydration:true prevents SSR/client mismatch
    - StoreHydration component calls persist.rehydrate() inside useEffect (client-only)
    - runMigrationIfNeeded() runs before rehydration to ensure schema is current
    - SSR guard pattern: typeof window !== "undefined" before localStorage/IndexedDB access
    - Sequential migration loop keyed on schemaVersion integer

key-files:
  created:
    - lib/storage/schema.ts
    - lib/storage/idb.ts
    - lib/storage/localStorage.ts
    - lib/store/sessionStore.ts
    - lib/store/settingsStore.ts
    - components/StoreHydration.tsx
  modified:
    - app/layout.tsx
    - package.json

key-decisions:
  - "skipHydration: true on both Zustand stores prevents React hydration mismatch on SSR"
  - "StoreHydration runs migration before rehydrate() so stale data is cleaned before stores read it"
  - "idb singleton (cached openDB promise) avoids re-opening database on every read/write"
  - "persist key names 'wird-session' and 'wird-settings' locked — changing them clears all user data"

patterns-established:
  - "Storage pattern: all app data in localStorage (session/settings) and IndexedDB (history), no network required"
  - "Hydration pattern: skipHydration on store + explicit rehydrate() in useEffect = SSR-safe"
  - "Migration pattern: sequential integer version check in runMigrationIfNeeded() before stores load"

requirements-completed: [FOUND-01]

# Metrics
duration: ~5min
completed: 2026-05-30
---

# Phase 00 Plan 03: Local-First Storage Layer Summary

**Zustand session+settings stores with skipHydration persist, idb-backed daily-record helper, and SSR-safe StoreHydration component — complete local-first data layer with no auth required**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-30T17:08:28Z
- **Completed:** 2026-05-30T17:15:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 9

## Accomplishments

- Typed schema interfaces locked (ActiveSession, UserSettings, DailyRecord) — canonical field names for all of Phase 1+
- Two persisted Zustand stores wired into layout with SSR-safe hydration (no console hydration errors)
- IndexedDB helper for daily history with upsert, getAll, getByKey — ready for Phase 2 history feature
- Schema migration runner strips legacy Supabase auth key on first boot
- Human verified: dark app loads cleanly at http://localhost:3000 with no hydration errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Zustand + idb, define schema types, build storage helpers** - `9597121` (feat)
2. **Task 2: Zustand stores + StoreHydration component wired into layout** - `d740f28` (feat)
3. **Task 3: Human verify** - human-approved (no commit — verification only)

## Files Created/Modified

- `lib/storage/schema.ts` - Canonical TypeScript interfaces: ActiveSession, UserSettings, DailyRecord, DhikrIndex, DHIKR_COUNT
- `lib/storage/idb.ts` - Typed IndexedDB helpers using idb v8 (singleton DB, addDailyRecord / getAllDailyRecords / getDailyRecord)
- `lib/storage/localStorage.ts` - Schema migration runner (v0->v1 removes legacy supabase.auth.token key)
- `lib/store/sessionStore.ts` - Zustand session store with skipHydration, persist key "wird-session", 6 actions
- `lib/store/settingsStore.ts` - Zustand settings store with skipHydration, persist key "wird-settings", 2 actions
- `components/StoreHydration.tsx` - Client component that runs migration + rehydrates both stores in useEffect
- `app/layout.tsx` - Added StoreHydration as first child of body
- `package.json` - Added zustand and idb dependencies

## Decisions Made

- `skipHydration: true` on both stores — server renders with default values, client rehydrates in useEffect; prevents React hydration mismatch
- `runMigrationIfNeeded()` runs before `persist.rehydrate()` in StoreHydration so schema cleanup happens before stores read potentially stale data
- idb singleton pattern (cached `openDB()` promise) to avoid re-opening the database on every call
- Persist key names "wird-session" and "wird-settings" are locked constants — renaming them would clear all user localStorage data

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Session store (counts, mode, activeIndex, sessionStartedAt) is ready for Phase 1 dhikr counter — tap to increment calls `useSessionStore.getState().incrementCount(index)`
- Settings store (defaultMode, location) is ready for Phase 1 mode selection
- IndexedDB daily-record helper is ready for Phase 2 history archival
- All stores hydrate from localStorage on page load — counts survive browser refresh

---
*Phase: 00-foundation-cleanup*
*Completed: 2026-05-30*
