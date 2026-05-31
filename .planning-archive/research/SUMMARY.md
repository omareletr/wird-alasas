# Research Summary: wird al-asas

**Domain:** Mobile-first PWA daily dhikr tracker
**Research date:** 2026-05-29

---

## Executive Summary

Wird al-asas is a focused devotional counter app for one specific Islamic litany — four fixed adhkar recited daily. The app is buildable as a pure client-side PWA on top of the existing Next.js 15 starter, but research surfaced two corrections to PROJECT.md assumptions:

1. **Prayer time must be calculated locally** via `adhan-js`, not a network API — the Fajr-based day reset cannot depend on network availability.
2. **Reliable Fajr push notifications on iOS require a minimal push backend** — the web has no reliable client-side scheduled notification API, and iOS push requires both a server and an installed PWA.

The recommended build sequence: establish local-first persistence + state foundation → core counter experience → prayer-time/day-boundary logic → history/streaks → PWA install → push notifications (riskiest, last).

The existing starter ships Supabase auth, SSR middleware, and backend-oriented structure that are entirely unused — stripping that dead code is a prerequisite to avoid confusion throughout development.

---

## Key Findings

### Stack

| Concern | Recommended | Notes |
|---------|------------|-------|
| State management | Zustand | Cross-component derived state; needed for day-boundary + counter |
| Local persistence | `idb` (IndexedDB) | History and Fajr cache; localStorage for hot settings only |
| Prayer time | `adhan-js` (local) | **Not Aladhan API** — must work offline; Fajr drives daily reset |
| Service worker | Serwist / `@serwist/next` | Maintained successor to abandoned `next-pwa` |
| Animation / swipe | `motion` (already installed) | SVG ring + swipe navigation — no new dep needed |
| History heatmap | `react-activity-calendar` | GitHub-style; supports multi-level completion |
| Arabic font | Amiri or Noto Naskh Arabic via `next/font` | Must support full tashkeel/diacritics |

**First action:** Remove `@supabase/ssr`, `@supabase/supabase-js`, all auth routes, and `middleware.ts`. Add Zustand, `idb`, `adhan`, Serwist.

> ⚠️ All version numbers are LOW confidence — research tools were blocked. Re-verify with `npm view <pkg> version` before pinning.

### Features

**Table stakes (must-have):**
- Full-screen tap target, large count number, circular progress ring
- Haptic feedback (iOS fallback: visual pulse — Vibration API unsupported on iOS Safari)
- Screen wake lock (re-acquire on `visibilitychange`)
- Progress persists across app close/reopen (debounced IndexedDB write)
- Correct Arabic RTL rendering with tashkeel-capable font
- Fajr-based daily reset; don't-lose-count guarantee

**Core differentiators:**
- Fixed, curated wird — removes all setup friction (this is the product's core insight)
- Fajr-aligned day boundary (theologically correct)
- Full vs. Shortened mode (200/200/100/100 · 20/20/10/10) with per-session override
- Streak + longest streak + calendar heatmap with full/partial/none distinction
- Partial completion tracked separately (faded color) — reduces abandonment guilt
- Gentle, non-gamified completion celebration

**Open product decision:** Streak-break policy on partial days — does a partial day continue the streak? Recommended: partial records but does NOT sustain streak. Must decide before building streak logic.

### Architecture

**Five-layer structure:**

```
UI Layer          CounterScreen, HistoryScreen, SettingsScreen
State Layer       Zustand store (session, day context, settings; derived: streaks)
Persistence       Repository over localStorage (settings + active) + IndexedDB (history + Fajr cache)
Services          Day-boundary state machine, Prayer-time service (adhan-js), Wake lock hook
Service Worker    Serwist — precaches app shell + font; handles push
```

**Storage schema:**
- `localStorage`: `wird.settings`, `wird.activeSession` (small, hot, sync)
- `IndexedDB`: `dailyHistory` (keyPath: `wirdDay`), `fajrCache` (per-day prayer times)
- Always include `schemaVersion`; wrap reads in try/catch

**Day-boundary keystone:** Everything — persistence, streaks, history, notifications — depends on one pure function: `getDevotionalDay(now, location) → dayKey`. Build and test this first.

**Push notification decision:**
- v1 best-effort: SW setTimeout (only fires if app/SW alive — unreliable)
- Reliable: anonymous VAPID subscription + minimal serverless cron (doesn't require auth)
- Design the subscription layer in v1 so a backend can be added without UI rework

### Top Pitfalls

| # | Pitfall | Severity | Prevention |
|---|---------|----------|-----------|
| 1 | **iOS deletes local data after ~7 days** for non-installed PWAs | CRITICAL | Home Screen install onboarding is load-bearing; `navigator.storage.persist()` early; JSON export |
| 2 | **Fajr boundary timezone/DST bugs** destroy streak history | CRITICAL | Single canonical `getDevotionalDay()` pure function; use Luxon/Temporal; exhaustive unit tests |
| 3 | **Streak logic on partial/missed days** produces wrong counts | HIGH | Streaks as pure function over history records; define and test rules before building |
| 4 | **iOS push requires installed PWA + cannot be client-scheduled** | HIGH | Gate behind standalone detection; ship v1 as best-effort; flag backend as roadmap decision |
| 5 | **Tap/swipe conflicts + double-counts at high tap rate** | HIGH | Use `pointerup` only; sync in-memory update, debounced persistence; `touch-action: manipulation` |
| 6 | **Arabic RTL rendering failures** with tashkeel | MEDIUM | `lang="ar"` + `dir="rtl"` per element; quality font with full diacritics; test on real device |
| 7 | **Wake lock doesn't re-acquire** after tab hide/show | MEDIUM | Re-acquire on `visibilitychange`; accept graceful degradation |

---

## Suggested Phase Structure

| Phase | Name | Goal | Depends on |
|-------|------|------|-----------|
| 0 | Starter cleanup + foundation | Strip Supabase; schema + `getDevotionalDay()` keystone | — |
| 1 | Core counter | Full-screen tap, ring, modes, swipe deck, Arabic, wake lock | Phase 0 |
| 2 | Prayer-time + day-boundary | adhan-js local calc, Fajr cache, rollover archival | Phase 1 |
| 3 | History view | Streaks + calendar heatmap | Phase 2 |
| 4 | PWA installability + offline | Serwist, manifest, install prompt, data export | Phase 3 |
| 5 | Push notifications | Fajr reminder — requires explicit backend decision | Phase 4 |

### Research Flags

- **Phase 5 (Push)**: Needs dedicated spike — "no backend" assumption conflicts with reliable Fajr notifications. Product decision required before planning.
- **Phase 4 (PWA)**: Verify Serwist + Next.js 15.5 App Router compatibility before starting.
- **Phase 2 (Prayer time)**: Verify current adhan-js API shape.
- **Phases 0, 1, 3**: Standard well-understood patterns — no flags.

---

## Open Decisions Before Roadmap

1. **Push notifications**: best-effort local (v1, no backend) vs. anonymous push backend — must decide before Phase 5 spec
2. **Streak partial-day policy**: does partial count as streak-continuing? (Recommended: no)
3. **Prayer calculation method**: which madhab/method to default; expose user picker or hardcode?

---
*Research synthesized: 2026-05-29*
