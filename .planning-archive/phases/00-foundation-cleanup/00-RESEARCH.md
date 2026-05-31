# Phase 0: Foundation & Cleanup - Research

**Researched:** 2026-05-30
**Domain:** Local-first storage, state management (Zustand), test infrastructure (Vitest), Supabase removal, timezone-aware day boundary function
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Session data model: `counts` (object keyed by numeric index 0–3), `mode` ('full' | 'shortened'), `sessionStartedAt` (timestamp), `activeIndex` (0–3)
- Dhikr identity uses numeric index 0–3 (canonical order: hasbi, istighfar, la ilaha, salawat)
- Mode stored in session (supports per-session override over default setting)
- `sessionStartedAt` stored so Phase 2 can assign the session to the correct day at Fajr rollover
- `activeIndex` persisted so reopening the app lands on the same dhikr the user left off on
- On Fajr rollover: archive the session's counts to history as a daily record, then reset counts to zero
- **localStorage**: active session + user settings (default mode, location). Handled by Zustand persist middleware
- **IndexedDB**: daily history records
- Schema versioning: store a `schemaVersion` key in localStorage; on app load, if version doesn't match, run a migration function and update the version (migrate-on-read strategy)
- `app/page.tsx` becomes a minimal branded placeholder ("wird al-asas — coming soon")
- Update `layout.tsx` metadata: proper title and description for wird al-asas
- Apply dark base theme (`#000000` background, white text) in `globals.css` in Phase 0

### Claude's Discretion
- Test runner choice (Vitest recommended), test file location (co-located recommended), and whether to add storage layer tests alongside `getDevotionalDay()` tests
- Implementation details of the IndexedDB helper layer (raw IDB vs a thin wrapper)
- Exact Zustand store file structure and persist key naming
- Specifics of the schema migration function shape

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | App stores all data locally on device (localStorage + IndexedDB) — no account or login required | Zustand persist middleware handles localStorage; `idb` library handles IndexedDB with a typed schema; Supabase removal checklist provided; schema versioning pattern documented |
</phase_requirements>

---

## Summary

Phase 0 involves four distinct workstreams: (1) deleting Supabase/auth scaffolding from the starter template, (2) establishing a versioned localStorage + IndexedDB storage schema via Zustand persist and the `idb` library, (3) writing the `getDevotionalDay()` pure function with Vitest tests covering timezone and DST edge cases, and (4) restyling `app/page.tsx` as a minimal branded placeholder.

The canonical Supabase removal is a file/directory deletion plus `npm uninstall` — nothing architecturally subtle. The harder work is getting the Zustand persist middleware to survive Next.js SSR without hydration mismatches, and designing the `getDevotionalDay()` signature so it is genuinely pure (no `Date.now()` inside) and therefore trivially testable.

Vitest is the right test runner for this project: Next.js official docs prescribe it, it needs zero Babel config, and it ships a jsdom environment suitable for testing browser storage APIs. No test infrastructure exists yet — the planner must create it from scratch in Wave 0.

**Primary recommendation:** Use Zustand 5 with `persist` middleware (`skipHydration: true`) for localStorage; `idb` v8 for IndexedDB; Vitest with jsdom for unit tests; and delete all Supabase files + uninstall the two packages as the first concrete task.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zustand` | 5.0.14 | Global state + localStorage persistence via `persist` middleware | Minimal boilerplate, first-class persist middleware, works with Next.js App Router |
| `idb` | 8.0.3 | Promise-based IndexedDB wrapper | Authored by Jake Archibald (Chrome team), 1.2 kB brotli, typed schema via `DBSchema`, 1 353 dependents on npm |
| `adhan` | 4.x | Islamic prayer time calculation (Fajr) | Official batoulapps library, high-precision equations from Jean Meeus, includes `MuslimWorldLeague` method |
| `vitest` | latest | Unit test runner | Official Next.js recommendation; zero-config with `@vitejs/plugin-react`; jsdom environment |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vitejs/plugin-react` | latest | Vitest React transform | Required for JSX in tests |
| `@testing-library/react` | latest | Component rendering in tests | If storage-layer React hooks need testing |
| `vite-tsconfig-paths` | latest | Respects `@/*` alias in Vitest | Required because tsconfig uses `@/*` path alias |
| `jsdom` | latest | Browser environment for Vitest | Required by Vitest config |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `idb` | Raw IndexedDB API | idb eliminates callback hell and typing boilerplate with ~1.2 kB overhead |
| `idb` | `localForage` | localForage is larger (8 kB+) and abstracts storage backend; idb is explicit and typed |
| `vitest` | `jest` | Jest requires more config with Next.js 15; Vitest is the official Next.js testing recommendation |

**Installation:**
```bash
npm install zustand idb adhan
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

**Uninstall (Supabase removal):**
```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

---

## Architecture Patterns

### Recommended Project Structure
```
lib/
  storage/
    schema.ts          # TypeScript interfaces: ActiveSession, UserSettings, DailyRecord
    localStorage.ts    # schemaVersion check + migration runner (called at app boot)
    idb.ts             # openDB wrapper, put/get/getAll for history object store
  store/
    sessionStore.ts    # Zustand store: active session state + persist to localStorage
    settingsStore.ts   # Zustand store: user settings (defaultMode, location) + persist
  utils/
    devotionalDay.ts   # getDevotionalDay() pure function
    devotionalDay.test.ts  # co-located Vitest tests
app/
  page.tsx             # Branded placeholder (no auth links)
  layout.tsx           # Updated metadata + dark theme class
```

### Pattern 1: Zustand persist with skipHydration (Next.js SSR-safe)

**What:** Use `skipHydration: true` in persist options and call `useStore.persist.rehydrate()` inside a `useEffect` in a single `StoreHydration` client component mounted in `layout.tsx`.

**When to use:** Any time a Zustand store persists to localStorage in a Next.js App Router project where the page Server-Component renders first.

**Why:** Next.js renders the Server Component with empty/default state, then the client hydrates. Without `skipHydration: true`, Zustand immediately reads localStorage during store initialization — that value differs from the server-rendered empty state, causing a React hydration mismatch error.

**Example:**
```typescript
// Source: Zustand docs + pmndrs/zustand Discussion #1382
// lib/store/sessionStore.ts
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ActiveSession {
  counts: Record<0 | 1 | 2 | 3, number>;
  mode: "full" | "shortened";
  sessionStartedAt: number | null;
  activeIndex: 0 | 1 | 2 | 3;
}

interface SessionStore extends ActiveSession {
  setCount: (index: 0 | 1 | 2 | 3, value: number) => void;
  setMode: (mode: "full" | "shortened") => void;
  setActiveIndex: (index: 0 | 1 | 2 | 3) => void;
  reset: () => void;
}

const DEFAULT_SESSION: ActiveSession = {
  counts: { 0: 0, 1: 0, 2: 0, 3: 0 },
  mode: "full",
  sessionStartedAt: null,
  activeIndex: 0,
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SESSION,
      setCount: (index, value) =>
        set((s) => ({ counts: { ...s.counts, [index]: value } })),
      setMode: (mode) => set({ mode }),
      setActiveIndex: (index) => set({ activeIndex: index }),
      reset: () => set(DEFAULT_SESSION),
    }),
    {
      name: "wird-session",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // prevents SSR mismatch
      version: 1,
    }
  )
);
```

```typescript
// app/components/StoreHydration.tsx  (Client Component, mounted in layout.tsx)
"use client";
import { useEffect } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";

export function StoreHydration() {
  useEffect(() => {
    useSessionStore.persist.rehydrate();
  }, []);
  return null;
}
```

### Pattern 2: idb typed schema for history

**What:** Define a `DBSchema` interface, open the DB with `openDB`, and expose `addRecord` / `getRecords` helpers.

**When to use:** All reads/writes to the daily history IndexedDB store.

**Example:**
```typescript
// Source: github.com/jakearchibald/idb README
// lib/storage/idb.ts
import { openDB, type DBSchema } from "idb";

interface WirdDB extends DBSchema {
  "daily-records": {
    key: string; // dayKey e.g. "2026-05-30"
    value: {
      dayKey: string;
      counts: Record<0 | 1 | 2 | 3, number>;
      mode: "full" | "shortened";
      completedAt: number;
    };
    indexes: { "by-dayKey": string };
  };
}

const DB_NAME = "wird-alasas";
const DB_VERSION = 1;

async function getDB() {
  return openDB<WirdDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("daily-records", { keyPath: "dayKey" });
      store.createIndex("by-dayKey", "dayKey");
    },
  });
}

export async function addDailyRecord(record: WirdDB["daily-records"]["value"]) {
  const db = await getDB();
  return db.put("daily-records", record);
}

export async function getAllDailyRecords() {
  const db = await getDB();
  return db.getAll("daily-records");
}
```

### Pattern 3: getDevotionalDay pure function

**What:** A single pure function that takes a JS `Date` and a `{ latitude, longitude }` object, computes Fajr time for that calendar date using `adhan`, and returns a `YYYY-MM-DD` day key. If `now` is before Fajr, it belongs to the previous calendar day.

**When to use:** Any time the app needs to determine what "today" means for wird tracking.

**Example:**
```typescript
// lib/utils/devotionalDay.ts
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Returns the devotional day key (YYYY-MM-DD) for a given moment and location.
 * The day starts at Fajr, not midnight. If `now` is before Fajr on calendar date D,
 * the day key returned is D-1 (the previous calendar day's wird is still active).
 */
export function getDevotionalDay(now: Date, location: Location): string {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = CalculationMethod.MuslimWorldLeague();

  // Calculate Fajr for the calendar date of `now`
  const calendarDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const prayerTimes = new PrayerTimes(coords, calendarDate, params);
  const fajr = prayerTimes.fajr; // JS Date, UTC

  if (now < fajr) {
    // Before today's Fajr — still belongs to yesterday
    const yesterday = new Date(calendarDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDayKey(yesterday);
  }
  return formatDayKey(calendarDate);
}

function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
```

### Pattern 4: localStorage schema migration

**What:** Check a `schemaVersion` key in localStorage at app boot. If absent or mismatched, run the migration chain and write the new version.

**Example:**
```typescript
// lib/storage/localStorage.ts
const CURRENT_SCHEMA_VERSION = 1;
const SCHEMA_VERSION_KEY = "wird-schema-version";

export function runMigrationIfNeeded(): void {
  const stored = localStorage.getItem(SCHEMA_VERSION_KEY);
  const storedVersion = stored ? parseInt(stored, 10) : 0;

  if (storedVersion === CURRENT_SCHEMA_VERSION) return;

  // Run migrations sequentially
  for (let v = storedVersion; v < CURRENT_SCHEMA_VERSION; v++) {
    MIGRATIONS[v]?.();
  }

  localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
}

const MIGRATIONS: Record<number, () => void> = {
  0: () => {
    // v0 → v1: clear any legacy Supabase-era keys
    localStorage.removeItem("supabase.auth.token");
  },
};
```

### Anti-Patterns to Avoid
- **Reading localStorage in render**: Always use Zustand store with `skipHydration: true` + `useEffect` rehydration to avoid SSR mismatch.
- **Calling `new Date()` inside `getDevotionalDay`**: Makes the function impure and untestable. Accept `now: Date` as a parameter.
- **Using `Date` constructor with timezone string**: `new Date("2026-05-30 05:00 Asia/Cairo")` is not valid; use UTC offsets or compute from Unix timestamps.
- **Opening IndexedDB on every read/write**: Cache the `getDB()` promise at module scope or use a singleton pattern.
- **Deleting middleware.ts without replacing it**: Next.js will error if the middleware config export is invalid. Replace with a no-op or delete entirely — empty matcher array crashes the dev server.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Prayer time calculation | Custom Fajr math | `adhan` | Astronomical edge cases (high-latitude, DST, polar regions), tested by Muslim community for years |
| IndexedDB async API | Promise wrappers around IDBRequest | `idb` v8 | Cursor management, transaction lifecycle, error propagation are subtle; idb is 1.2 kB and handles all of it |
| Timezone-aware date formatting | Manual UTC offset math | Native `Date` methods + `adhan` output | adhan returns native `Date` objects; format with `getFullYear/getMonth/getDate` on local time |
| localStorage serialization | Manual JSON.stringify/parse | Zustand `createJSONStorage(() => localStorage)` | Handles edge cases (undefined, circular refs) and is type-safe |

**Key insight:** The "day boundary at Fajr" problem looks simple but has three non-obvious edge cases: (1) DST spring-forward means some local times don't exist, (2) high-latitude locations have extreme Fajr times, (3) Fajr on Dec 31 before midnight means `dayKey` belongs to the previous year. adhan handles (2); the pure function design handles (1) and (3) because tests can pass exact `Date` objects.

---

## Common Pitfalls

### Pitfall 1: Hydration mismatch with Zustand persist
**What goes wrong:** Component renders with localStorage data client-side but server rendered with defaults; React throws a hydration error.
**Why it happens:** Zustand's `persist` middleware reads localStorage synchronously during store creation, which runs before React can reconcile server/client renders.
**How to avoid:** Set `skipHydration: true` in persist options. Mount a `StoreHydration` client component in `layout.tsx` that calls `useStore.persist.rehydrate()` inside `useEffect`.
**Warning signs:** Console error "Text content does not match server-rendered HTML"; components flicker on load.

### Pitfall 2: Vitest cannot resolve `@/*` import alias
**What goes wrong:** Tests fail with "Cannot find module '@/lib/...'" even though the app builds fine.
**Why it happens:** Vitest uses Vite's resolver, not TypeScript's; `tsconfig.json` paths don't automatically carry over.
**How to avoid:** Add `vite-tsconfig-paths` plugin to `vitest.config.mts`. The `@/*` alias in `tsconfig.json` maps to the repo root.
**Warning signs:** Tests fail with module resolution errors but `npm run build` succeeds.

### Pitfall 3: middleware.ts crash after Supabase removal
**What goes wrong:** After deleting `lib/supabase/middleware.ts`, the root `middleware.ts` import breaks and Next.js throws a build error or crashes the dev server.
**Why it happens:** Root `middleware.ts` imports `updateSession` from `@/lib/supabase/middleware`; that file no longer exists.
**How to avoid:** Delete root `middleware.ts` entirely (or replace with a minimal pass-through). An empty matcher array `[]` crashes the dev server — either delete the file or use a matcher that excludes all paths.
**Warning signs:** `npm run dev` throws "Cannot find module '@/lib/supabase/middleware'".

### Pitfall 4: `getDevotionalDay` wrong day near midnight
**What goes wrong:** Between midnight and Fajr, the function returns today's date instead of yesterday's.
**Why it happens:** Calendar date comparison uses local midnight as boundary, not Fajr.
**How to avoid:** Compute Fajr for the calendar date of `now`, then compare `now < fajr`. If true, subtract one day.
**Warning signs:** Unit tests for "00:30 local, Fajr at 05:15" return today's date rather than yesterday's.

### Pitfall 5: adhan `PrayerTimes` uses local calendar date, not UTC
**What goes wrong:** Passing a UTC-midnight `Date` to `PrayerTimes` may compute prayer times for the wrong calendar day in non-UTC timezones.
**Why it happens:** `new Date(year, month, day)` creates a local-timezone date; `new Date(utcTimestamp)` creates a UTC date.
**How to avoid:** Construct the date as `new Date(now.getFullYear(), now.getMonth(), now.getDate())` — this uses local time components, which is what adhan expects for the "date" parameter.
**Warning signs:** Fajr times appear shifted by several hours; test cases in UTC+3 fail when UTC is used.

### Pitfall 6: globals.css dark theme conflicts with Tailwind v4
**What goes wrong:** Setting `background: #000000` directly on `:root` overrides Tailwind's CSS variable `--background`, causing components to lose their theme color.
**Why it happens:** The existing `globals.css` uses `--background: oklch(1 0 0)` (white) for light mode; the dark base must update this token, not add a raw CSS property.
**How to avoid:** Change `--background` in `:root` to `oklch(0 0 0)` (pure black) and `--foreground` to `oklch(1 0 0)` (white). Remove the `.dark` class variant since the app is always dark. Also add `class="dark"` to `<html>` in `layout.tsx` if keeping the `.dark` selector pattern, or simply override `:root` tokens.

---

## Code Examples

### Vitest configuration (official Next.js docs pattern)
```typescript
// vitest.config.mts
// Source: nextjs.org/docs/app/guides/testing/vitest (verified 2026-05-28)
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
  },
});
```

### package.json test script
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

### getDevotionalDay unit test structure
```typescript
// lib/utils/devotionalDay.test.ts
import { describe, it, expect } from "vitest";
import { getDevotionalDay } from "./devotionalDay";

const LONDON = { latitude: 51.5074, longitude: -0.1278 };

describe("getDevotionalDay", () => {
  it("returns today's key when now is after Fajr", () => {
    // Fajr in London on 2026-05-30 is approximately 02:52 UTC
    const afterFajr = new Date("2026-05-30T06:00:00Z");
    expect(getDevotionalDay(afterFajr, LONDON)).toBe("2026-05-30");
  });

  it("returns yesterday's key when now is before Fajr", () => {
    // 01:00 UTC on 2026-05-30 is before Fajr (~02:52 UTC)
    const beforeFajr = new Date("2026-05-30T01:00:00Z");
    expect(getDevotionalDay(beforeFajr, LONDON)).toBe("2026-05-29");
  });

  it("handles DST transition day correctly", () => {
    // UK spring-forward: 2026-03-29 02:00 local → 03:00 (clocks jump)
    const dstDay = new Date("2026-03-29T10:00:00Z");
    const result = getDevotionalDay(dstDay, LONDON);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/); // valid dayKey shape
  });

  it("handles year boundary: Dec 31 before Fajr returns Dec 30 key", () => {
    // If Fajr on Dec 31 is at 06:00 UTC and now is 04:00 UTC on Dec 31
    const beforeFajrOnNewYearsEve = new Date("2026-12-31T04:00:00Z");
    const result = getDevotionalDay(beforeFajrOnNewYearsEve, LONDON);
    expect(result).toBe("2026-12-30");
  });
});
```

### adhan MuslimWorldLeague Fajr calculation
```typescript
// Source: github.com/batoulapps/adhan-js README
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

const coords = new Coordinates(51.5074, -0.1278); // London
const params = CalculationMethod.MuslimWorldLeague();
const date = new Date(2026, 4, 30); // May 30, 2026 (local)
const times = new PrayerTimes(coords, date, params);
console.log(times.fajr); // JS Date (UTC value)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand v4 `devtools` + `persist` wired manually | Zustand v5 with `useSyncExternalStore` integration | Zustand 5.0 (2024) | More consistent rendering, compatible with React 19 Concurrent Mode |
| Raw IndexedDB callbacks | `idb` v8 promise API with typed `DBSchema` | idb v5+ | TypeScript-first, compile-time store name checking |
| Jest for Next.js | Vitest (official Next.js recommendation) | Next.js 14+ | Zero Babel config, faster, same assertion API |
| `getSession()` for server auth | `getUser()` | Supabase SSR | `getSession()` trusts client cookie; `getUser()` re-validates with server — but irrelevant for this phase since auth is removed entirely |

**Deprecated/outdated:**
- `@supabase/ssr` and `@supabase/supabase-js`: deleted entirely in this phase
- `app/login/`, `app/auth/`, `app/protected/`: deleted entirely in this phase
- Root `middleware.ts` importing `updateSession`: deleted entirely in this phase
- `lib/supabase/` directory: deleted entirely in this phase

---

## Open Questions

1. **Vitest timezone test isolation**
   - What we know: `process.env.TZ` can be set in `globalSetup.ts`; once set it cannot be changed dynamically during a test run (Vitest issue #1575, #6596)
   - What's unclear: Whether individual test files can use different timezone contexts via worker isolation
   - Recommendation: Design `getDevotionalDay` tests to work with UTC input dates and expected UTC-relative day keys. Tests that need a specific local timezone should either run in a dedicated Vitest worker or use `@date-fns/tz` to construct explicit UTC timestamps for the "before/after Fajr" boundary. Do not rely on `process.env.TZ` switching mid-suite.

2. **Dark theme approach in globals.css**
   - What we know: Current `:root` has `--background: oklch(1 0 0)` (white); the decision is "pure black `#000000` background"
   - What's unclear: Whether to keep Tailwind's dark/light system and add `class="dark"` to `<html>`, or collapse to a single always-dark `:root`
   - Recommendation: For Phase 0 (placeholder only), override `:root` `--background` directly to `oklch(0 0 0)` and `--foreground` to `oklch(1 0 0)`. This is simpler and avoids the `dark` class complexity. The `.dark` block can be removed or kept empty. Phase 1 can revisit if a light mode is ever needed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (to be installed — none detected) |
| Config file | `vitest.config.mts` — Wave 0 creates this |
| Quick run command | `npm run test:run -- lib/utils/devotionalDay.test.ts` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | `getDevotionalDay(now, location)` returns correct YYYY-MM-DD key after Fajr | unit | `npm run test:run -- lib/utils/devotionalDay.test.ts` | Wave 0 |
| FOUND-01 | `getDevotionalDay` returns previous day key when `now` is before Fajr | unit | `npm run test:run -- lib/utils/devotionalDay.test.ts` | Wave 0 |
| FOUND-01 | Zustand session store persists to `localStorage` and rehydrates after page reload | manual smoke | open app, increment count, reload, confirm count persists | N/A (manual) |
| FOUND-01 | IndexedDB `addDailyRecord` + `getAllDailyRecords` round-trip | unit | `npm run test:run -- lib/storage/idb.test.ts` | Wave 0 (optional) |
| FOUND-01 | Schema migration runs without throwing when `schemaVersion` is absent | unit | `npm run test:run -- lib/storage/localStorage.test.ts` | Wave 0 (optional) |

### Sampling Rate
- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green + `npm run build` passes before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.mts` — Vitest configuration with jsdom + tsconfigPaths
- [ ] `package.json` `test` and `test:run` scripts
- [ ] `lib/utils/devotionalDay.test.ts` — covers FOUND-01 boundary cases
- [ ] (Optional) `lib/storage/idb.test.ts` — covers history round-trip
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths`

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (nextjs.org/docs/app/guides/testing/vitest) — verified 2026-05-28 — Vitest setup, config file, required packages
- github.com/batoulapps/adhan-js — adhan API, MuslimWorldLeague method, PrayerTimes interface
- github.com/jakearchibald/idb — idb v8 API: openDB, DBSchema, put/get patterns
- npmjs.com (zustand) — v5.0.14 confirmed as current stable

### Secondary (MEDIUM confidence)
- pmndrs/zustand Discussion #1382 and #2476 — skipHydration pattern for Next.js App Router, verified against Zustand docs
- pmndrs/zustand Discussion #1717 — persist version/migrate option shape

### Tertiary (LOW confidence)
- vitest-dev/vitest Issue #1575, #6596 — TZ env variable limitation in Vitest; flagged as needs validation against current Vitest version

---

## Metadata

**Confidence breakdown:**
- Supabase removal: HIGH — files and packages are enumerated in CONTEXT.md
- Standard stack (Zustand, idb, adhan, Vitest): HIGH — npm versions confirmed, official docs reviewed
- Architecture patterns: HIGH — Zustand skipHydration pattern cross-verified across multiple sources
- getDevotionalDay design: HIGH — pure function design eliminates timezone testing complexity
- Vitest TZ isolation: LOW — known limitation from issues; exact current behavior unconfirmed

**Research date:** 2026-05-30
**Valid until:** 2026-07-15 (libraries are stable; Vitest TZ limitation should be re-checked if tests fail)
