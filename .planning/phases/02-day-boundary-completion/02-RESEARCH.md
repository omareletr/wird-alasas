# Phase 2: Day Boundary & Completion - Research

**Researched:** 2026-05-30
**Domain:** adhan-js Fajr scheduling, Geolocation API, localStorage/IndexedDB rollover, completion classification
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-02 | Day resets at Fajr time, calculated locally from device location using adhan-js (no network dependency) | adhan `PrayerTimes.fajr` already confirmed in codebase; `getDevotionalDay()` already exists and is tested; scheduling hook pattern documented |
| FOUND-03 | Manual location entry available as fallback when geolocation is denied or unavailable | Geolocation error codes confirmed (1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT); fallback to lat/lon form documented; SettingsSheet is the natural home for this UI |
| COMP-01 | When all 4 adhkar reach their target, wird is marked fully complete for the day | Completion classification logic: `counts[i] >= target(i)` for all 4 indices; `DailyRecord` schema already includes `counts` + `mode`; classification is a pure function derivable at read time |
| COMP-02 | When at least 1 dhikr is completed but not all 4, wird is marked partially complete for the day | Same classification function: `some(i => counts[i] >= target(i)) && !all(...)` |
| COMP-04 | Partial completion is visually distinct from full completion throughout the app (faded / different color) | Design system has `--accent` (amber) for full and `--muted-foreground` (white/55%) for partial; no new CSS tokens needed |
</phase_requirements>

---

## Summary

Phase 2 connects the already-tested `getDevotionalDay()` function to a live rollover mechanism: at Fajr the active session is archived to IndexedDB and the counts reset. This phase has three distinct workstreams:

**Workstream A — Fajr rollover engine.** A `useFajrRollover` hook calculates the next Fajr time via adhan, schedules a single `setTimeout`, and fires an `archiveAndReset` action. The hook also listens for `visibilitychange` so it re-checks the boundary when the user returns to a tab that was backgrounded over Fajr. The rollover action reads the session store, writes a `DailyRecord` to IndexedDB via the existing `addDailyRecord` helper, then calls `sessionStore.reset()`.

**Workstream B — Location acquisition.** `useGeolocation` wraps `navigator.geolocation.getCurrentPosition` (with error codes 1/2/3 meaning PERMISSION_DENIED/UNAVAILABLE/TIMEOUT). On error, or when geolocation is unavailable, it falls back to the persisted `settings.location`. The SettingsSheet gains a lat/lon manual entry form (two number inputs + save button). Location null = default fallback: Mecca (21.4225, 39.8262) — a safe default for a global Muslim audience.

**Workstream C — Completion classification and display.** A pure `classifyDay(record, adhkar)` function maps a `DailyRecord` to `"full" | "partial" | "none"`. This classification is derived at read time from the counts and mode stored in the record — never stored separately. Phase 2 renders the completion badge on the counter header or wherever the day state is surfaced.

**Primary recommendation:** Single `setTimeout` to next Fajr (not `setInterval`), re-armed on `visibilitychange`. Location defaults to Mecca when null. Classification is a pure function never persisted. No new npm packages needed.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `adhan` | 4.4.3 | Fajr prayer time calculation (already used in `devotionalDay.ts`) | Already in project, HIGH confidence API |
| `idb` | 8.0.3 | IndexedDB archive writes (already in `idb.ts`) | Already wired, `addDailyRecord` exists |
| `zustand` | 5.0.14 | Session/settings stores (already wired) | Existing pattern; `reset()` already implemented |

### Supporting (browser-native, no install needed)
| API | Purpose | Notes |
|-----|---------|-------|
| `navigator.geolocation.getCurrentPosition` | Acquire lat/lon | Wrapped in custom hook; no npm package needed |
| `document.visibilitychange` event | Re-check rollover on tab resume | Fire-and-forget event listener in `useFajrRollover` |
| `setTimeout` / `clearTimeout` | Schedule rollover at Fajr ms | Single timeout, not polling interval |

### No New Packages Required
All needed libraries are already installed. Phase 2 is pure logic + hooks + a small UI addition to SettingsSheet.

**Installation:**
```bash
# Nothing to install — all dependencies already present
```

---

## Architecture Patterns

### Recommended Project Structure
```
lib/
  hooks/
    useFajrRollover.ts        # NEW: schedule archiveAndReset at next Fajr
    useGeolocation.ts         # NEW: acquire coords, expose error + status
  store/
    sessionStore.ts           # EXTEND: add archiveAndReset action (or co-locate)
  utils/
    completionClassifier.ts   # NEW: classifyDay() pure function
    completionClassifier.test.ts  # NEW: unit tests
  storage/
    schema.ts                 # UNCHANGED: DailyRecord already has counts+mode
    idb.ts                    # UNCHANGED: addDailyRecord already exists
components/
  settings/
    SettingsSheet.tsx         # EXTEND: add location section (manual lat/lon entry)
  counter/
    DayCompletionBadge.tsx    # NEW: shows full/partial/none for current day
```

### Pattern 1: useFajrRollover — Single setTimeout to next Fajr

**What:** Calculate the next Fajr time using adhan. Set a single `setTimeout` for `(fajr.getTime() - Date.now())` ms. When it fires, call `archiveAndReset`. On `visibilitychange` (tab comes back from background), run an eagerness check: if `getDevotionalDay(now, location)` has changed from the stored `sessionStartedAt` day key, fire `archiveAndReset` immediately without waiting for the timer.

**Why setTimeout not setInterval:** The rollover is a once-per-day event at a specific wall-clock time, not a periodic interval. A single timeout is exact; setInterval at 1-minute polling accumulates drift and wastes CPU. After firing, the hook re-arms for the next day's Fajr.

**Edge case — tab backgrounded over Fajr:** `setTimeout` does NOT fire reliably in background tabs on mobile browsers (throttled, suspended). The `visibilitychange` listener is the recovery path: when the user foregrounds the app, compare current `getDevotionalDay` with the day key stored in `sessionStartedAt`. If different, rollover immediately.

**When to use:** Mount once in `app/page.tsx` (counter page) or in `StoreHydration` so it runs for the app's lifetime.

**Example:**
```typescript
// lib/hooks/useFajrRollover.ts
"use client";
import { useEffect, useRef } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { getDevotionalDay } from "@/lib/utils/devotionalDay";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";
import { addDailyRecord } from "@/lib/storage/idb";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

const MECCA_FALLBACK = { latitude: 21.4225, longitude: 39.8262 };

function getNextFajr(location: { latitude: number; longitude: number }): Date {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  const now = new Date();
  const todayDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const todayTimes = new PrayerTimes(coords, todayDate, params);

  if (now < todayTimes.fajr) return todayTimes.fajr;

  // After today's Fajr — next Fajr is tomorrow's
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  return new PrayerTimes(coords, tomorrowDate, params).fajr;
}

export function useFajrRollover() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function archiveAndReset() {
      const { counts, mode, sessionStartedAt } = useSessionStore.getState();
      if (sessionStartedAt !== null) {
        await addDailyRecord({
          dayKey: getDevotionalDay(
            new Date(sessionStartedAt),
            useSettingsStore.getState().location ?? MECCA_FALLBACK
          ),
          counts,
          mode,
          completedAt: Date.now(),
        });
      }
      useSessionStore.getState().reset();
      scheduleNext();
    }

    function scheduleNext() {
      if (timerRef.current) clearTimeout(timerRef.current);
      const location = useSettingsStore.getState().location ?? MECCA_FALLBACK;
      const nextFajr = getNextFajr(location);
      const delay = nextFajr.getTime() - Date.now();
      timerRef.current = setTimeout(archiveAndReset, Math.max(delay, 0));
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      // Re-check: if day boundary crossed while backgrounded, roll over now
      const { sessionStartedAt } = useSessionStore.getState();
      if (sessionStartedAt === null) return;
      const location = useSettingsStore.getState().location ?? MECCA_FALLBACK;
      const storedDay = getDevotionalDay(new Date(sessionStartedAt), location);
      const currentDay = getDevotionalDay(new Date(), location);
      if (storedDay !== currentDay) {
        archiveAndReset();
      }
    }

    scheduleNext();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
```

### Pattern 2: useGeolocation — Acquire coords with graceful fallback

**What:** Call `navigator.geolocation.getCurrentPosition` once, expose `{ coords, status, error }`. On any error (codes 1/2/3), set status to `"denied" | "unavailable" | "timeout"` and fall through to persisted settings location.

**Key rules:**
- Check `"geolocation" in navigator` first (SSR guard + old browser)
- Call with `{ timeout: 8000, maximumAge: 60000 }` — accept a 1-minute cached position for battery
- On success, call `settingsStore.setLocation({ latitude, longitude })` to persist for offline use
- On error, the hook returns the already-persisted location from settingsStore as the fallback

**Example:**
```typescript
// lib/hooks/useGeolocation.ts
"use client";
import { useState, useEffect } from "react";
import { useSettingsStore } from "@/lib/store/settingsStore";

type GeoStatus = "idle" | "loading" | "success" | "denied" | "unavailable" | "timeout" | "unsupported";

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const setLocation = useSettingsStore((s) => s.setLocation);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus("success");
      },
      (err) => {
        // err.code: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
        const map: Record<number, GeoStatus> = { 1: "denied", 2: "unavailable", 3: "timeout" };
        setStatus(map[err.code] ?? "unavailable");
      },
      { timeout: 8000, maximumAge: 60 * 1000, enableHighAccuracy: false }
    );
  }, [setLocation]);

  return { status };
}
```

### Pattern 3: classifyDay — Pure completion classification

**What:** Given a `DailyRecord` (or `ActiveSession` counts + mode) and the ADHKAR array, return `"full" | "partial" | "none"`.

**Key rules:**
- Classification is derived at read time — never stored in the record
- "full" = all 4 dhikr counts >= their targets for the stored mode
- "partial" = at least 1 dhikr count >= target, but not all 4
- "none" = 0 dhikr completed

**Example:**
```typescript
// lib/utils/completionClassifier.ts
import { ADHKAR, getTarget } from "@/lib/data/adhkar";
import type { DhikrIndex } from "@/lib/storage/schema";

export type CompletionLevel = "full" | "partial" | "none";

export function classifyDay(
  counts: Record<DhikrIndex, number>,
  mode: "full" | "shortened"
): CompletionLevel {
  const completedCount = ADHKAR.filter(
    (entry) => counts[entry.index] >= getTarget(entry, mode)
  ).length;

  if (completedCount === ADHKAR.length) return "full";
  if (completedCount > 0) return "partial";
  return "none";
}
```

### Pattern 4: Manual location entry in SettingsSheet

**What:** Add a collapsible "Location" section to the existing `SettingsSheet`. Show current status (auto-detected / manual / using default). Two number inputs for latitude and longitude. Save button calls `settingsStore.setLocation()`. "Use my location" button re-triggers geolocation.

**Key rules:**
- Latitude: -90 to 90; longitude: -180 to 180. Validate on save.
- Show geolocation status (loading, denied, unavailable) with brief explanation
- When status is "denied", show message: "Location access was denied. Enter coordinates manually."
- Input type `number` with `step="0.0001"` and appropriate min/max

### Anti-Patterns to Avoid

- **setInterval for rollover polling:** 1-minute interval wastes battery and requires a "did day change?" comparison on every tick. Use single `setTimeout` to exact Fajr ms, re-arm after firing.
- **Storing `completionLevel` in IndexedDB:** Classification is derivable from `counts` + `mode`. Storing it adds a sync risk (stored level differs from computed level after a bug fix).
- **Calling `navigator.geolocation` in SSR context:** `navigator` is undefined in Node. Always guard with `typeof window !== "undefined"` or `"geolocation" in navigator`.
- **Blocking the counter UI on geolocation:** Call geolocation in a hook that runs in the background. Never await geolocation in the critical render path. Fall through to Mecca default immediately if no persisted location.
- **Computing Fajr inside the rollover timer callback:** The closure captures the location at hook-mount time. Read fresh location from the store inside `archiveAndReset` and `scheduleNext` to pick up any location change the user made in settings.
- **Using `sessionStartedAt` day key for rollover boundary:** `sessionStartedAt` is the start of the session, not the current wall-clock day. The correct comparison is `getDevotionalDay(new Date(), location)` vs `getDevotionalDay(new Date(sessionStartedAt), location)`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fajr time calculation | Custom sun-angle math | `adhan` `PrayerTimes.fajr` | Already in project; handles high-latitude, DST, polar edge cases |
| IndexedDB record write | New IDB transaction | Existing `addDailyRecord()` in `lib/storage/idb.ts` | Already implemented and SSR-guarded |
| Location persistence | Custom localStorage key | `settingsStore.setLocation()` | Already in schema under `wird-settings` |
| Completion classification | Ad-hoc inline comparisons spread across components | `classifyDay()` pure function | Single source of truth; pure = trivially testable |
| Geolocation promise wrapper | Custom Promise-based wrapper | Thin hook with callbacks | The API is already callback-based; a hook with `useState` + `useEffect` is lighter than an extra abstraction layer |

**Key insight:** Phase 2 has almost no new dependencies. The entire rollover + classification system is pure logic on top of already-existing infrastructure (`getDevotionalDay`, `addDailyRecord`, `sessionStore.reset`, `settingsStore.location`).

---

## Common Pitfalls

### Pitfall 1: setTimeout fires late or not at all in background tabs
**What goes wrong:** User leaves the app open, Fajr passes while the phone is in standby. `setTimeout` is throttled or killed by the browser. The counts never roll over.
**Why it happens:** Mobile browsers aggressively throttle background timers (Chrome: min 1-second interval for hidden pages; iOS Safari: may kill timers entirely after a few minutes).
**How to avoid:** The `visibilitychange` listener is the recovery path. When `document.visibilityState === "visible"`, re-run the day-key comparison. If the stored day ≠ current day, call `archiveAndReset` immediately. This covers: overnight background, switching apps, locking screen.
**Warning signs:** Manual test: open app before Fajr, lock phone for 30 min past Fajr, unlock → app should show reset counts.

### Pitfall 2: Geolocation not re-requested after settings change
**What goes wrong:** User grants location permission mid-session after initially denying. The `useGeolocation` hook ran once (on mount) and got "denied" — it never tries again.
**How to avoid:** Expose a `retry()` function from `useGeolocation`. The "Use my location" button in SettingsSheet calls `retry()`. Alternatively, re-run the effect when a user-visible action explicitly triggers it (not on every render).

### Pitfall 3: Rollover fires when sessionStartedAt is null (no session in progress)
**What goes wrong:** `archiveAndReset` writes a `DailyRecord` with all zeros if called when the session hasn't started (user hasn't opened the app since install).
**How to avoid:** Guard: `if (sessionStartedAt === null) { reset(); scheduleNext(); return; }` — skip the archive write but still reset and reschedule.
**Warning signs:** IndexedDB contains records with all-zero counts and `completedAt` timestamps far from any real session.

### Pitfall 4: Mecca fallback gives wrong day key for distant timezones
**What goes wrong:** User is in New York (UTC-5). Mecca Fajr is around 04:30 Mecca time (01:30 UTC). New York Fajr is around 05:30 local (10:30 UTC). Using the Mecca coordinates causes rollover 9 hours early for New York users who haven't yet set their location.
**Why it happens:** Fajr time is location-dependent. Mecca default is geographically wrong for users who deny location.
**How to avoid:** Surface the location prompt early and clearly. When location is null and geolocation is denied, show the manual entry UI in SettingsSheet with a brief explanation: "Set your city's coordinates for accurate Fajr timing." Accept that Mecca fallback is imperfect but predictable. Document this as a known limitation.
**Warning signs:** Users in western timezones see rollover mid-day.

### Pitfall 5: DailyRecord written twice for the same dayKey
**What goes wrong:** `archiveAndReset` fires twice (visibilitychange race: tab shown, event fires twice quickly). Two records for the same day.
**Why it happens:** `visibilitychange` can fire multiple times in quick succession; the `setTimeout` may also be queued simultaneously.
**How to avoid:** `idb.ts` uses `db.put()` which is an upsert by `keyPath: "dayKey"` — the second write replaces the first. This is the correct behavior since the second write has the same counts. However: clear the timer ref after the rollover fires to prevent double-scheduling.

### Pitfall 6: classifyDay using wrong targets after mode changes
**What goes wrong:** User completed 20 dhikr in "shortened" mode (full target). If `classifyDay` is called with mode "full" and the same counts, 20/200 = incomplete.
**Why it happens:** The DailyRecord stores `mode`. If `classifyDay` ignores the stored mode and uses the current settings mode, it classifies incorrectly.
**How to avoid:** Always pass the `mode` from the `DailyRecord` (historical mode) not the current settings mode.

---

## Code Examples

Verified patterns from this project's existing code and adhan v4.4.3 type definitions:

### adhan — get next Fajr time
```typescript
// Source: adhan v4.4.3 node_modules/adhan/lib/types/PrayerTimes.d.ts
// Confirmed: PrayerTimes.fajr is a JS Date (UTC value)
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

const coords = new Coordinates(21.4225, 39.8262); // Mecca
const params = CalculationMethod.MuslimWorldLeague();
const todayDate = new Date(2026, 0, 16); // local-time date for adhan
const times = new PrayerTimes(coords, todayDate, params);
console.log(times.fajr); // JS Date with correct UTC value
```

### Geolocation API — callback with error codes
```typescript
// Source: MDN Web Docs — confirmed error.code values 1/2/3
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;
    // use coordinates
  },
  (err) => {
    // err.code === 1: PERMISSION_DENIED
    // err.code === 2: POSITION_UNAVAILABLE
    // err.code === 3: TIMEOUT
  },
  { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
);
```

### Zustand store read outside React (in async rollover callback)
```typescript
// Source: Zustand docs — getState() is safe outside components
// Confirmed in existing sessionStore.test.ts — already used in tests
const { counts, mode, sessionStartedAt } = useSessionStore.getState();
const location = useSettingsStore.getState().location;
```

### visibilitychange listener pattern
```typescript
// Source: MDN Page Visibility API
function handleVisibility() {
  if (document.visibilityState === "visible") {
    // user returned to app — check if day boundary crossed
  }
}
document.addEventListener("visibilitychange", handleVisibility);
// cleanup:
document.removeEventListener("visibilitychange", handleVisibility);
```

### idb upsert (existing helper)
```typescript
// Source: lib/storage/idb.ts — already implemented, uses db.put() = upsert
import { addDailyRecord } from "@/lib/storage/idb";

await addDailyRecord({
  dayKey: "2026-05-30",
  counts: { 0: 200, 1: 200, 2: 100, 3: 100 },
  mode: "full",
  completedAt: Date.now(),
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Poll setInterval every 60s to check day change | Single setTimeout to exact Fajr ms + visibilitychange recovery | Browser timer best practices | No wasted CPU; exact trigger |
| Store computed `completionLevel` field | Derive classification from counts at read time | Functional/pure-data design | No sync bugs; schema stays stable |
| Always block on geolocation before rendering | Non-blocking hook; Mecca fallback while waiting | React hooks patterns | Counter page loads immediately |

**No deprecated APIs in use.** adhan 4.x is the current release. All browser APIs (Geolocation, visibilitychange, setTimeout) are stable.

---

## Open Questions

1. **Where to mount `useFajrRollover`**
   - What we know: It can go in `app/page.tsx` (counter page), `StoreHydration`, or a new `RolloverProvider` wrapper.
   - What's unclear: Whether it should be in `StoreHydration` (global, always active) or `app/page.tsx` (only when counter is open).
   - Recommendation: Mount in `app/page.tsx` for now. Phase 3 (history) may need rollover active even when the history view is open, at which point it moves to a layout-level component. Keep it simple for Phase 2.

2. **Geolocation prompt timing**
   - What we know: MDN best practice is to request geolocation on user gesture, not on page load.
   - What's unclear: Whether "open SettingsSheet and tap location permission" counts as a sufficient gesture, or whether geolocation should silently attempt on first app load.
   - Recommendation: Attempt geolocation silently on `app/page.tsx` mount (with `useGeolocation` hook). The browser will show its native permission prompt. If denied, the SettingsSheet location section shows the manual entry form. This is the pattern used by most mobile web apps.

3. **What to show in UI for current day completion state during Phase 2**
   - What we know: COMP-01, COMP-02, COMP-04 require full/partial to be visually distinct. Phase 3 will add the history calendar.
   - What's unclear: Where exactly in the Phase 2 UI the completion state for "today" is rendered.
   - Recommendation: Add a minimal `DayCompletionBadge` to the counter header (near ModeToggle/SettingsSheet). Full = amber `--accent` dot or label; partial = `--muted-foreground` faded equivalent; none = nothing. Keep it subtle — the counter itself is the primary UI.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (already configured) |
| Config file | `vitest.config.mts` — exists and working |
| Quick run command | `npm run test:run -- lib/utils/completionClassifier.test.ts` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | `classifyDay` returns "full" when all 4 counts >= targets | unit | `npm run test:run -- lib/utils/completionClassifier.test.ts` | Wave 0 |
| COMP-02 | `classifyDay` returns "partial" when 1-3 counts >= targets | unit | `npm run test:run -- lib/utils/completionClassifier.test.ts` | Wave 0 |
| COMP-02 | `classifyDay` returns "none" when 0 counts >= targets | unit | `npm run test:run -- lib/utils/completionClassifier.test.ts` | Wave 0 |
| COMP-01 | `classifyDay` uses record's `mode` not current settings mode | unit | `npm run test:run -- lib/utils/completionClassifier.test.ts` | Wave 0 |
| COMP-04 | Full completion renders amber accent; partial renders muted | manual smoke | Open app, complete all 4, verify amber badge; complete 2/4, verify muted badge | N/A |
| FOUND-02 | `archiveAndReset` writes DailyRecord to IndexedDB then resets session | unit (jsdom) | `npm run test:run -- lib/hooks/useFajrRollover.test.ts` | Wave 0 |
| FOUND-02 | Rollover fires correctly when visibilitychange reveals a new day | unit (fake timers) | `npm run test:run -- lib/hooks/useFajrRollover.test.ts` | Wave 0 |
| FOUND-03 | Geolocation PERMISSION_DENIED (code=1) triggers manual entry UI | manual smoke | Deny location in browser → SettingsSheet shows manual entry | N/A |
| FOUND-03 | Manual lat/lon saved via SettingsSheet persists across reload | manual smoke | Enter coords, reload, verify settingsStore.location is set | N/A |

### Sampling Rate
- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green + `npm run build` passes before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/utils/completionClassifier.ts` — the pure function
- [ ] `lib/utils/completionClassifier.test.ts` — covers COMP-01, COMP-02 with all edge cases (full/partial/none, both modes)
- [ ] `lib/hooks/useFajrRollover.test.ts` — covers FOUND-02; use `vi.useFakeTimers()` to fast-forward to Fajr ms; mock `addDailyRecord` and `sessionStore`

*(Existing test infrastructure `vitest.config.mts`, `lib/store/sessionStore.test.ts`, `lib/utils/devotionalDay.test.ts` covers all prior requirements and requires no changes)*

---

## Sources

### Primary (HIGH confidence)
- `node_modules/adhan/lib/types/PrayerTimes.d.ts` — confirmed `fajr: Date` property and constructor signature
- `node_modules/adhan/lib/types/CalculationMethod.d.ts` — confirmed `MuslimWorldLeague()` factory method
- `node_modules/adhan/README.md` — confirmed `nextPrayer()` + `timeForPrayer()` convenience utilities
- `lib/utils/devotionalDay.ts` — existing implementation, confirmed API shape for `getDevotionalDay(now, location)`
- `lib/storage/idb.ts` — confirmed `addDailyRecord(record)` exists with upsert semantics
- `lib/store/sessionStore.ts` — confirmed `reset()` action exists, `getState()` is callable outside React
- `lib/storage/schema.ts` — confirmed `DailyRecord` shape: `dayKey, counts, mode, completedAt`
- MDN `GeolocationPositionError/code` — confirmed error codes 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT

### Secondary (MEDIUM confidence)
- MDN `Geolocation/getCurrentPosition` — options object: `timeout`, `maximumAge`, `enableHighAccuracy`
- MDN `Page Visibility API` — `visibilitychange` event and `document.visibilityState === "visible"` recovery pattern
- MDN `setInterval` limitations note — 1-second throttle for background tabs; confirmed setTimeout-based approach is superior

### Tertiary (LOW confidence)
- Mobile browser timer throttling specifics (iOS Safari kill threshold, Chrome hidden-tab policy) — behavior is documented but exact thresholds vary by browser version; the `visibilitychange` recovery pattern handles all cases regardless of exact threshold

---

## Metadata

**Confidence breakdown:**
- adhan API (Fajr calculation): HIGH — confirmed in installed node_modules type definitions and existing codebase usage
- Rollover scheduling strategy (setTimeout + visibilitychange): HIGH — well-established browser pattern; confirmed from MDN
- Geolocation API error codes: HIGH — confirmed from MDN
- Completion classification logic: HIGH — pure function, trivially verifiable from ADHKAR array and DailyRecord schema
- Mobile timer throttling behavior: MEDIUM — behavioral pattern confirmed but exact browser thresholds are LOW confidence; recovery path via visibilitychange mitigates this

**Research date:** 2026-05-30
**Valid until:** 2026-08-30 (all APIs are stable; adhan 4.x is current release)
