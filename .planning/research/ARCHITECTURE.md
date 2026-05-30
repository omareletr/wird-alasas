# Architecture Patterns

**Domain:** Local-first mobile PWA (daily dhikr tracker)
**Researched:** 2026-05-29

> **Research-tool note:** External research tools (WebSearch, WebFetch, Context7, Brave)
> were unavailable in this session (permission denied). This document is built from
> training knowledge (cutoff Jan 2026) plus the validated PROJECT.md and package.json.
> Claims about specific library versions/APIs are marked MEDIUM/LOW confidence and
> should be verified against current docs during the relevant build phase. The overall
> architecture (component boundaries, data flow, schema, build order) is HIGH confidence
> because it relies on stable web-platform primitives, not fast-moving libraries.

## Recommended Architecture

This is a **local-first, offline-first single-page PWA**. There is **no application
backend** — the only network dependency is an occasional prayer-time fetch (which can
also be done fully client-side). All state lives on the device.

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER / PWA SHELL                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    UI LAYER (React 19)                    │    │
│  │                                                           │    │
│  │  CounterScreen   HistoryScreen   SettingsScreen           │    │
│  │  (swipe deck,    (streaks +      (mode default,           │    │
│  │   tap area,       heatmap)        location, notif)        │    │
│  │   progress ring)                                          │    │
│  └───────────────┬───────────────────────────────────────┬──┘    │
│                  │ read/dispatch                          │       │
│  ┌───────────────▼───────────────────────────────────┐   │       │
│  │              STATE LAYER (Zustand store)            │   │       │
│  │                                                     │   │       │
│  │  - activeSession (per-dhikr counts, mode)           │   │       │
│  │  - dayContext (current wird-day, Fajr boundary)     │   │       │
│  │  - settings (default mode, location, notif opt-in)  │   │       │
│  │  - derived: streaks, completion status              │   │       │
│  └───────┬─────────────────────────────┬───────────────┘   │       │
│          │ persist (debounced)         │ query             │       │
│  ┌───────▼─────────────────────────────▼───────────┐       │       │
│  │           PERSISTENCE LAYER (repository)          │       │       │
│  │   localStorage  ──── settings + active session    │       │       │
│  │   IndexedDB     ──── daily history records        │       │       │
│  └───────────────────────────────────────────────────┘       │       │
│                                                               │       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────▼──┐    │
│  │  DAY-BOUNDARY   │  │  PRAYER-TIME      │  │  WAKE-LOCK      │    │
│  │  SERVICE        │◄─┤  SERVICE          │  │  HOOK           │    │
│  │  (Fajr reset    │  │  (adhan-js calc + │  │  (keep screen   │    │
│  │   state machine)│  │   cache)          │  │   awake)        │    │
│  └─────────────────┘  └────────┬─────────┘  └─────────────────┘    │
└─────────────────────────────────┼─────────────────────────────────┘
                                  │ Geolocation API (one-time)
                                  ▼
                         (optional Aladhan API fallback)

┌─────────────────────────────────────────────────────────────────┐
│              SERVICE WORKER (Serwist) — separate thread           │
│  - Precache app shell + Arabic font (offline support)             │
│  - Runtime cache strategy for prayer-time API (if used)           │
│  - 'push' + 'notificationclick' handlers (Fajr reminder)          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **CounterScreen** | Render one dhikr at a time, full-screen tap target, circular progress ring, swipe nav, completion mark | State store (read counts, dispatch increment) |
| **HistoryScreen** | Render current/longest streak + calendar heatmap | State store (derived streaks), Persistence (read history) |
| **SettingsScreen** | Default mode, location permission, notification opt-in | State store (settings), Prayer-time service, Notification service |
| **State store (Zustand)** | Single source of truth for active session, day context, settings; derives streaks/completion | UI layer, Persistence layer |
| **Persistence repository** | Read/write abstraction over localStorage + IndexedDB; the *only* code touching storage APIs | State store, Day-boundary service |
| **Day-boundary service** | Decide "what wird-day is it now?" relative to Fajr; trigger reset/archival of active session | Prayer-time service, Persistence, State store |
| **Prayer-time service** | Compute today's Fajr from lat/lng (client-side); cache results; optional API fallback | Geolocation, IndexedDB cache, Day-boundary service |
| **Wake-lock hook** | Acquire/release Screen Wake Lock while CounterScreen mounted | CounterScreen |
| **Service worker (Serwist)** | Offline app-shell caching; push notification receive + click handling | Browser push, app shell assets |

**Key boundary rule:** Only the **persistence repository** touches `localStorage` /
`IndexedDB` directly. Only the **prayer-time service** touches Geolocation/Aladhan. This
keeps the UI and store testable and swappable.

### Data Flow

**Counting flow (hot path, must be offline + instant):**
```
tap → CounterScreen onClick → store.increment(dhikrId)
    → store updates activeSession in memory (UI re-renders ring instantly)
    → debounced persist → repository.saveActiveSession() → localStorage
```
The increment must update the in-memory store synchronously; persistence is debounced
(e.g. 300–500ms or on visibilitychange/pagehide) so rapid tapping never blocks on I/O.

**Day-rollover flow:**
```
app open / visibilitychange / interval tick
    → DayBoundaryService.getCurrentWirdDay(now, todaysFajr)
    → if current wird-day != activeSession.wirdDay:
         → archive previous activeSession into IndexedDB history (full or partial)
         → recompute streaks
         → reset activeSession to fresh counts for the new wird-day
```

**Prayer-time flow:**
```
SettingsScreen / first launch → request Geolocation (one-time)
    → PrayerTimeService.computeFajr(lat, lng, date) via adhan-js (client-side, no network)
    → cache {date, fajrISO, lat, lng} in IndexedDB
    → DayBoundaryService reads cached Fajr for boundary math
```

**Notification flow (see Push section for the hard constraint):**
```
opt-in → register push subscription (or fallback local scheduling)
    → at/near Fajr → SW 'push' event → showNotification()
    → tap → 'notificationclick' → focus/open app on CounterScreen
```

## Local Storage Schema

Split by access pattern: **hot, small, frequently-written** state → `localStorage`;
**append-only history that grows over time** → `IndexedDB`.

### localStorage (synchronous, simple key/value)

```typescript
// key: "wird.settings"
interface Settings {
  schemaVersion: 1;
  defaultMode: "full" | "shortened";
  location: { lat: number; lng: number; method: string } | null; // adhan calc method
  notificationsEnabled: boolean;
  pushSubscription?: PushSubscriptionJSON | null;
}

// key: "wird.activeSession" — the in-progress wird for the current wird-day
interface ActiveSession {
  schemaVersion: 1;
  wirdDay: string;          // canonical wird-day id, e.g. "2026-05-29" (Fajr-anchored)
  mode: "full" | "shortened"; // per-session override of default
  counts: {                  // keyed by dhikr id 1..4
    1: number; 2: number; 3: number; 4: number;
  };
  startedAt: string;         // ISO timestamp
  lastUpdatedAt: string;     // ISO timestamp
}
```

### IndexedDB (async, grows unbounded over years)

Use a thin wrapper (recommend **`idb`** by Jake Archibald, or Dexie if richer queries
are wanted). One object store for history, one for the prayer-time cache.

```typescript
// store: "dailyHistory", keyPath: "wirdDay"
interface DailyRecord {
  wirdDay: string;           // "2026-05-29" — primary key
  mode: "full" | "shortened";
  counts: { 1: number; 2: number; 3: number; 4: number };
  targets: { 1: number; 2: number; 3: number; 4: number }; // snapshot of mode targets
  status: "complete" | "partial"; // complete = all 4 >= target
  completedDhikrCount: number; // 0..4, drives "faded/distinct" heatmap rendering
  archivedAt: string;        // ISO
}

// store: "fajrCache", keyPath: "dateKey"
interface FajrCacheEntry {
  dateKey: string;           // gregorian calendar date "2026-05-29"
  fajrISO: string;           // computed Fajr instant
  lat: number; lng: number;  // location it was computed for (invalidate if moved)
  method: string;            // calculation method used
}
```

**Why split:** the active counter writes constantly during a session — `localStorage`
is synchronous and trivially fast for a tiny object. History is read rarely (only on
HistoryScreen) but accumulates indefinitely — IndexedDB handles large, indexed,
async-queried data far better. Keep a `schemaVersion` field everywhere for migrations.

**Streaks are derived, not stored** (or stored as a denormalized cache only). Compute
current/longest streak by scanning `dailyHistory` keys; for performance after years of
use, optionally cache `{currentStreak, longestStreak, lastComputedWirdDay}` and
incrementally update on rollover.

## Patterns to Follow

### Pattern 1: Wird-day as a canonical string anchored to Fajr
**What:** Define the "day" not as midnight but as the window `[today's Fajr, tomorrow's
Fajr)`. Map any instant to a `wirdDay` id via the day-boundary service.
**When:** Every read/write keyed by day.
**Why:** All completion, history, and reset logic then depends on one pure function,
`getWirdDay(now, fajrSchedule)`, which is easy to test and reason about.

```typescript
// Pure, testable core of the day-boundary state machine
function getWirdDay(now: Date, fajrFor: (d: Date) => Date): string {
  const todaysFajr = fajrFor(now);
  // Before today's Fajr → still "yesterday's" wird-day
  const anchor = now < todaysFajr ? addDays(now, -1) : now;
  return toDateKey(fajrFor(anchor) <= now ? anchor : addDays(anchor, -1));
}
```

### Pattern 2: Day-boundary as an explicit state machine
**What:** Three states for the active session relative to the clock.
```
        app foreground / tick
ACTIVE ──────────────────────► (wirdDay unchanged) stay ACTIVE
   │
   │ now crosses next Fajr (wirdDay changes)
   ▼
ROLLOVER ──► archive prev session (complete|partial) ──► reset ──► ACTIVE(new day)
```
**When:** Evaluated on `app load`, `visibilitychange→visible`, `pagehide`, and a low-
frequency interval (e.g. every 60s) so a phone left open overnight rolls over correctly.
**Instead of:** Resetting on a naive midnight timer or only at app launch.

### Pattern 3: Repository abstraction over storage
**What:** A `historyRepo` / `settingsRepo` module exposing typed async methods; UI/store
never call `localStorage`/`indexededDB` directly.
**Why:** Enables schema migration, testing with in-memory fakes, and future swap to
sync without touching UI.

### Pattern 4: Client-side prayer-time computation, cache-first
**What:** Use **`adhan-js`** (`adhan` on npm) to compute Fajr from lat/lng entirely
offline; cache per calendar date. Only fall back to Aladhan API if you deliberately want
server-authoritative times. (MEDIUM confidence on exact package API — verify in phase.)
**Why:** Satisfies the "works offline" constraint; no recurring network dependency for
the core reset feature. Geolocation is requested once and stored.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Persisting on every tap synchronously
**What:** Calling `localStorage.setItem` inside the tap handler.
**Why bad:** Synchronous I/O on a hot path; rapid tapping (200×) can jank the ring
animation. **Instead:** Update in-memory store immediately, debounce persistence, and
force-flush on `pagehide`/`visibilitychange`.

### Anti-Pattern 2: Storing growing history in localStorage
**Why bad:** ~5MB quota, synchronous, no indexing — years of daily records will be slow
and may hit quota. **Instead:** IndexedDB for history.

### Anti-Pattern 3: Relying on a network prayer-time API for the reset boundary
**Why bad:** Breaks the offline requirement; reset would fail with no signal. **Instead:**
compute client-side with adhan-js, treat API as optional enhancement only.

### Anti-Pattern 4: Expecting reliable scheduled push in a PWA without a server
**What:** Assuming the browser will fire a notification at a precise local time while the
app is closed. **Why bad:** Web Push requires a push *server* sending to the browser's
push service (FCM/APNs/Mozilla); there is **no reliable cross-platform pure-client API to
schedule a future local notification while the app is fully closed**. The
Notification Triggers API (`showTrigger`) was experimental/Chromium-only and is not
dependable. iOS additionally only supports Web Push for **installed (Add-to-Home-Screen)
PWAs**, iOS 16.4+. **Instead:** pick one of the strategies below and document the
limitation. (HIGH confidence on the constraint; MEDIUM on current iOS version specifics —
verify.)

## Push Notification Strategy (decision needed)

This is the architecturally riskiest requirement. Options, in increasing reliability:

| Option | How | Reliability | Backend needed? |
|--------|-----|-------------|-----------------|
| A. In-app reschedule via `setTimeout`/SW alarm | Schedule next Fajr notif only while app/SW alive | Low (only fires if app open near Fajr) | No |
| B. Notification Triggers API | `showTrigger: new TimestampTrigger(fajr)` | Low (Chromium-only, experimental, may be removed) | No |
| C. Web Push + tiny scheduler backend | Store subscription; a minimal cron/edge function sends push at user's Fajr | High | Yes (small) |

**Recommendation:** Ship **A** as a best-effort local reminder for v1 (zero backend,
honest about limits), and design the persistence/subscription layer so **C** can be added
later without UI rework. Note that the PROJECT.md says "no backend account system" — a
*stateless push relay* (storing only an anonymous subscription + lat/lng) does not violate
the "no auth" constraint and is the only path to reliable Fajr notifications when the app
is closed. Flag this as a decision for the roadmap. (HIGH confidence.)

## PWA Service Worker Strategy

**Recommendation: Serwist** (`@serwist/next`), the actively-maintained successor to the
now-unmaintained `next-pwa`. It is built for the Next.js App Router and React 19 era and
wraps Workbox strategies. (MEDIUM confidence — `next-pwa` being effectively abandoned and
Serwist being the community-recommended replacement is consistent with knowledge up to
early 2026, but confirm the current Serwist + Next 15.5 setup in-phase.)

- **Precache:** app shell, JS/CSS, and the Arabic font (critical — RTL rendering must work
  offline).
- **Runtime caching:** if Aladhan API is used at all, `StaleWhileRevalidate`; otherwise no
  runtime network caching is needed since prayer times are computed locally.
- **Push handlers:** `push` and `notificationclick` live in the Serwist SW source.
- **Manifest:** required for installability and (on iOS) for Web Push eligibility — include
  name, icons, `display: standalone`, theme color, RTL-aware where relevant.

Avoid `next-pwa` (maintenance stalled) and avoid hand-rolling the SW unless a dependency
becomes a blocker.

## State Management

**Recommendation: Zustand.** (HIGH confidence on suitability.)

- The counter is high-frequency, shared across CounterScreen + HistoryScreen (derived
  completion) + day-boundary service. Plain `useState`/Context would cause prop-drilling
  and re-render churn across the swipe deck.
- Zustand gives a single store, selector-based subscriptions (only the active dhikr ring
  re-renders on tap), trivial access from non-React services (day-boundary, persistence
  middleware), and a built-in `persist` middleware — though here a custom debounced
  persistence to the repository is cleaner given the localStorage+IndexedDB split.
- Jotai is a fine alternative (atomic) but Zustand's store-with-services model fits the
  service-oriented boundaries here better. React-only state is *not* sufficient given the
  cross-component derived state and out-of-React triggers.

## Scalability Considerations

This is a single-user local app, so "scale" = longevity of one device's data, not users.

| Concern | At 1 month | At 1 year | At 5 years |
|---------|-----------|-----------|-----------|
| History size | ~30 records | ~365 records | ~1,800 records — trivial for IndexedDB |
| Streak computation | Full scan fine | Full scan fine (<1ms) | Cache derived streaks, update incrementally on rollover |
| Heatmap render | Trivial | Render visible window only | Virtualize/year-paginate the calendar |
| localStorage quota | Fine (tiny) | Fine | Fine (only active session + settings live here) |

## Build Order Implications

Dependencies dictate this sequence (each phase usable/testable before the next):

1. **App shell + storage repository + Zustand store.** Schema, repository, store wiring.
   No features yet — but everything below depends on it.
2. **Counter feature (core value).** Swipe deck, full-screen tap, progress ring,
   completion mark, two modes, resume-from-saved. Depends on (1). Add wake-lock here.
   *This is the validateable MVP slice — ships before day-boundary/notifications.*
3. **Prayer-time service.** Geolocation + adhan-js + Fajr cache. Standalone; depends on (1)
   for caching. Needed before day-boundary.
4. **Day-boundary state machine + history archival.** Depends on (2) active session shape
   and (3) Fajr times. Wires rollover → archive → reset.
5. **History view (streaks + heatmap).** Depends on (4) producing history records.
6. **PWA / offline (Serwist) + manifest.** Can begin in parallel after (1); finalize once
   feature surface is stable so precache lists are correct.
7. **Push notifications (Fajr reminder).** Last — highest platform risk; depends on (3) for
   Fajr time and (6) for the SW. Start with best-effort local strategy; flag backend-relay
   as a follow-up decision.

**Critical-path note for the roadmap:** Phases 2 (counter) and 4 (day-boundary state
machine) are the highest-logic-risk areas and deserve the most testing. Phase 7 (push) is
the highest *platform*-risk area and should be flagged for deeper research before
committing to a notification UX promise.

## Sources

- PROJECT.md (validated requirements, this repo) — HIGH
- package.json (confirmed stack: Next 15.5, React 19, Tailwind v4, radix/shadcn, motion) — HIGH
- Web platform primitives (IndexedDB, localStorage, Web Push, Screen Wake Lock,
  Notification Triggers limitations) — training knowledge, HIGH on behavior/constraints
- Serwist as `next-pwa` successor; `adhan-js` for client-side prayer times — training
  knowledge, MEDIUM (verify exact current APIs/versions in the relevant build phase, since
  external research tools were unavailable this session)
