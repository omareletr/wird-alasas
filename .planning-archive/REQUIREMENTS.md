# Requirements: wird al-asas

**Defined:** 2026-05-29
**Core Value:** Completing the wird al-asas every day without losing count or losing your place.

---

## v1 Requirements

### Foundation

- [x] **FOUND-01**: App stores all data locally on device (localStorage + IndexedDB) — no account or login required
- [x] **FOUND-02**: Day resets at Fajr time, calculated locally from device location using adhan-js (no network dependency)
- [x] **FOUND-03**: Manual location entry available as fallback when geolocation is denied or unavailable

### Counter

- [x] **COUNT-01**: One dhikr shown at a time, displaying Arabic text, transliteration, and English translation
- [x] **COUNT-02**: User can swipe between the 4 adhkar in any order
- [x] **COUNT-03**: Full-screen tap increments count for the current dhikr
- [x] **COUNT-04**: Circular progress ring fills toward target as count increases
- [x] **COUNT-05**: Tapping past the target is allowed; completion mark appears at target but counting continues
- [x] **COUNT-06**: Each dhikr tracked independently (any order, any time)
- [x] **COUNT-07**: User can choose Full mode (200/200/100/100) or Shortened mode (20/20/10/10) per session
- [x] **COUNT-08**: Count progress for all 4 adhkar persists if app is closed; resumes from saved count on reopen
- [x] **COUNT-09**: Screen stays awake while the counter screen is active (Wake Lock API)
- [x] **COUNT-10**: Haptic feedback on each tap; visual pulse fallback for iOS (Vibration API unsupported on iOS Safari)

### Completion

- [x] **COMP-01**: When all 4 adhkar reach their target, wird is marked fully complete for the day
- [x] **COMP-02**: When at least 1 dhikr is completed but not all 4, wird is marked partially complete for the day
- [x] **COMP-03**: Full wird completion triggers a calm, dignified celebration moment (no confetti or gamification)
- [x] **COMP-04**: Partial completion is visually distinct from full completion throughout the app (faded / different color)

### History

- [x] **HIST-01**: User can view current streak (consecutive days with at least 1 dhikr completed)
- [x] **HIST-02**: User can view longest streak ever achieved
- [x] **HIST-03**: Calendar heatmap shows full / partial / none completion level per day
- [x] **HIST-04**: User can see per-dhikr completion breakdown for each day in history

### Settings

- [x] **SET-01**: User can set a default mode (Full or Shortened) that persists across sessions

### PWA & Install

- [ ] **PWA-01**: App works fully offline after initial load (service worker + precaching)
- [ ] **PWA-02**: App shows an "Add to Home Screen" install prompt to protect local data on iOS (iOS evicts data after 7 days for browser-tab PWAs)

---

## v2 Requirements

### Notifications

- **NOTF-01**: User receives a Fajr push notification as a daily wird reminder (requires push backend — deferred)

### Data portability

- **DATA-01**: User can export streak history as JSON
- **DATA-02**: User can import a JSON backup to restore history

### Polish

- **POL-01**: Transliteration toggle (show/hide per dhikr)
- **POL-02**: Translation toggle (show/hide per dhikr)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / cloud sync | Local-first; no auth friction |
| Custom adhkar / multiple wirds | Scope creep; one focused product |
| Undo last tap | Adds clutter; accepted design tradeoff |
| Social features / sharing | Private worship; riya' concern |
| Audio recitation playback | Asset weight, licensing, out of scope |
| In-app Quran / qibla / full prayer times | Do one thing well |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 0 | Complete |
| COUNT-01 | Phase 1 | Complete |
| COUNT-02 | Phase 1 | Complete |
| COUNT-03 | Phase 1 | Complete |
| COUNT-04 | Phase 1 | Complete |
| COUNT-05 | Phase 1 | Complete |
| COUNT-06 | Phase 1 | Complete |
| COUNT-07 | Phase 1 | Complete |
| COUNT-08 | Phase 1 | Complete |
| COUNT-09 | Phase 1 | Complete |
| COUNT-10 | Phase 1 | Complete |
| COMP-03 | Phase 1 | Complete |
| SET-01 | Phase 1 | Complete |
| FOUND-02 | Phase 2 | Complete |
| FOUND-03 | Phase 2 | Complete |
| COMP-01 | Phase 2 | Complete |
| COMP-02 | Phase 2 | Complete |
| COMP-04 | Phase 2 | Complete |
| HIST-01 | Phase 3 | Complete |
| HIST-02 | Phase 3 | Complete |
| HIST-03 | Phase 3 | Complete |
| HIST-04 | Phase 3 | Complete |
| PWA-01 | Phase 4 | Pending |
| PWA-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-29 · Traceability updated: 2026-05-30 after roadmap creation*
