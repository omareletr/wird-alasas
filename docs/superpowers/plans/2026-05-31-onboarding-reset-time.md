# Onboarding + User-Controlled Daily Reset Time — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace location-based Fajr timing with a user-chosen reset hour (default 5am), introduced via a friendly full-screen onboarding screen on first launch.

**Architecture:** The `adhan` library and geolocation hook are removed entirely. A new `useResetTimer` hook schedules the daily archive+reset at `resetHour:00` local time. `getDevotionalDay` is rewritten to use `resetHour` instead of computed Fajr. An `OnboardingScreen` component gates `app/page.tsx` until `hasOnboarded` is true in the settings store.

**Tech Stack:** React 19, Zustand 5 (persist middleware), Tailwind CSS v4, vitest 4

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `lib/storage/schema.ts` | Replace `location` with `resetHour` + `hasOnboarded` in `UserSettings` |
| Modify | `lib/store/settingsStore.ts` | New fields, new actions, migration to v3 |
| Modify | `lib/utils/devotionalDay.ts` | Replace Fajr logic with `resetHour` local-time logic |
| Modify | `lib/utils/devotionalDay.test.ts` | Updated tests for new signature |
| Modify | `package.json` | Add `TZ=UTC` to test scripts for determinism |
| Create | `lib/hooks/useResetTimer.ts` | Daily archive+reset at user-chosen hour (replaces `useFajrRollover`) |
| Create | `components/onboarding/OnboardingScreen.tsx` | First-launch welcome + 24-hour picker |
| Modify | `app/page.tsx` | Onboarding gate, swap `useFajrRollover`→`useResetTimer`, drop `useGeolocation` |
| Modify | `components/settings/SettingsSheet.tsx` | Remove location section, add reset hour picker |
| Delete | `lib/hooks/useFajrRollover.ts` | Replaced by `useResetTimer` |
| Delete | `lib/hooks/useGeolocation.ts` | No longer needed |
| Package | `adhan` | `npm uninstall adhan` |

---

## Task 1: Update schema and settings store

**Files:**
- Modify: `lib/storage/schema.ts`
- Modify: `lib/store/settingsStore.ts`

- [ ] **Step 1: Update `UserSettings` in schema.ts**

Replace the `location` field with `resetHour` and `hasOnboarded`:

```ts
/** User preferences persisted to localStorage under "wird-settings". */
export interface UserSettings {
  /** Hour (0–23, local time) at which the daily wird resets. Default 5 (5am). */
  resetHour: number;
  /** True after the user has completed the first-launch onboarding screen. */
  hasOnboarded: boolean;
}
```

Keep `DhikrIndex`, `DHIKR_COUNT`, `ActiveSession`, and `DailyRecord` unchanged.

- [ ] **Step 2: Rewrite `settingsStore.ts`**

Replace the entire file content:

```ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserSettings } from "@/lib/storage/schema";

interface SettingsActions {
  setResetHour(hour: number): void;
  setHasOnboarded(value: boolean): void;
}

type SettingsStore = UserSettings & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      resetHour: 5,
      hasOnboarded: false,

      setResetHour(hour) {
        set({ resetHour: hour });
      },
      setHasOnboarded(value) {
        set({ hasOnboarded: value });
      },
    }),
    {
      name: "wird-settings",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 3,
      migrate: () => ({
        // All users (including existing) get hasOnboarded: false so they see
        // the new onboarding screen and consciously choose their reset hour.
        resetHour: 5,
        hasOnboarded: false,
      }),
    }
  )
);
```

- [ ] **Step 3: Commit**

```bash
git add lib/storage/schema.ts lib/store/settingsStore.ts
git commit -m "feat(settings): replace location with resetHour + hasOnboarded, bump store to v3"
```

---

## Task 2: Rewrite devotionalDay.ts (TDD)

**Files:**
- Modify: `lib/utils/devotionalDay.ts`
- Modify: `lib/utils/devotionalDay.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add `TZ=UTC` to test scripts in package.json**

The new `getDevotionalDay` uses local time (`Date.getHours()` etc.). Tests must run in a known timezone. Find the `"scripts"` block and update:

```json
"test": "TZ=UTC vitest",
"test:run": "TZ=UTC vitest run",
```

- [ ] **Step 2: Write the failing tests**

Replace the entire content of `lib/utils/devotionalDay.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getDevotionalDay } from "./devotionalDay";

// Tests run with TZ=UTC so local time === UTC time.
// new Date(year, month, day, hour) creates a local-time Date.

describe("getDevotionalDay", () => {
  it("returns today's key when now is after reset hour", () => {
    // 8am local, resetHour=5 → 8 >= 5 → today
    const now = new Date(2026, 0, 16, 8, 0, 0); // 2026-01-16 08:00 local
    expect(getDevotionalDay(now, 5)).toBe("2026-01-16");
  });

  it("returns yesterday's key when now is before reset hour", () => {
    // 3am local, resetHour=5 → 3 < 5 → yesterday
    const now = new Date(2026, 0, 16, 3, 0, 0); // 2026-01-16 03:00 local
    expect(getDevotionalDay(now, 5)).toBe("2026-01-15");
  });

  it("returns today's key when now equals reset hour exactly", () => {
    // 5am exactly, resetHour=5 → 5 >= 5 → today
    const now = new Date(2026, 0, 16, 5, 0, 0);
    expect(getDevotionalDay(now, 5)).toBe("2026-01-16");
  });

  it("returns yesterday's key at one minute before reset hour", () => {
    // 4:59am, resetHour=5 → still yesterday
    const now = new Date(2026, 0, 16, 4, 59, 0);
    expect(getDevotionalDay(now, 5)).toBe("2026-01-15");
  });

  it("handles reset hour of 0 (midnight): always returns today", () => {
    // With resetHour=0, any hour >= 0 → today
    const now = new Date(2026, 0, 16, 0, 1, 0);
    expect(getDevotionalDay(now, 0)).toBe("2026-01-16");
  });

  it("handles late reset hour (e.g. 23)", () => {
    // 22:00 local, resetHour=23 → 22 < 23 → yesterday
    const now = new Date(2026, 0, 16, 22, 0, 0);
    expect(getDevotionalDay(now, 23)).toBe("2026-01-15");
  });

  it("handles year boundary: Dec 31 before reset → Dec 30 key", () => {
    const now = new Date(2026, 11, 31, 3, 0, 0); // 2026-12-31 03:00
    expect(getDevotionalDay(now, 5)).toBe("2026-12-30");
  });

  it("handles month boundary: Feb 1 before reset → Jan 31 key", () => {
    const now = new Date(2026, 1, 1, 3, 0, 0); // 2026-02-01 03:00
    expect(getDevotionalDay(now, 5)).toBe("2026-01-31");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test:run -- devotionalDay
```

Expected: all tests FAIL because `getDevotionalDay` still uses the old `adhan`-based signature.

- [ ] **Step 4: Rewrite `devotionalDay.ts`**

Replace the entire file:

```ts
/**
 * Returns the devotional day key (YYYY-MM-DD) for a given moment.
 * The day starts at resetHour (local time), not midnight.
 * If `now` is before resetHour on calendar day D, the key is D-1.
 *
 * Pure — never calls Date.now() or new Date() without arguments.
 */
export function getDevotionalDay(now: Date, resetHour: number): string {
  const localHour = now.getHours();
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (localHour < resetHour) {
    const yesterday = new Date(localDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDayKey(yesterday);
  }
  return formatDayKey(localDate);
}

function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
```

Note: the `Location` interface and `adhan` import are removed entirely. Any file that imported `Location` from `devotionalDay.ts` (only `useFajrRollover.ts`) will be deleted in Task 7.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- devotionalDay
```

Expected: all 8 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/utils/devotionalDay.ts lib/utils/devotionalDay.test.ts package.json
git commit -m "refactor(devotionalDay): replace Fajr/adhan logic with resetHour local-time boundary"
```

---

## Task 3: Create `useResetTimer`

**Files:**
- Create: `lib/hooks/useResetTimer.ts`

- [ ] **Step 1: Create the file**

```ts
"use client";

import { useEffect, useRef } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { addDailyRecord } from "@/lib/storage/idb";
import { getDevotionalDay } from "@/lib/utils/devotionalDay";

/** Returns the next Date at which the local clock will show resetHour:00:00. */
function getNextReset(resetHour: number): Date {
  const now = new Date();
  const todayReset = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    resetHour,
    0,
    0,
    0
  );
  if (now < todayReset) return todayReset;
  const tomorrowReset = new Date(todayReset);
  tomorrowReset.setDate(tomorrowReset.getDate() + 1);
  return tomorrowReset;
}

function currentDevotionalDay(): string {
  const resetHour = useSettingsStore.getState().resetHour;
  return getDevotionalDay(new Date(), resetHour);
}

export async function archiveAndReset(
  scheduleNext: () => void
): Promise<void> {
  const { counts, mode, sessionStartedAt } = useSessionStore.getState();
  if (sessionStartedAt !== null) {
    const dayKey = currentDevotionalDay();
    await addDailyRecord({ dayKey, counts, mode, completedAt: Date.now() });
  }
  useSessionStore.getState().reset();
  scheduleNext();
}

/**
 * useResetTimer — schedules a daily archive+reset at the user's chosen hour.
 *
 * - Sets a setTimeout to fire at the next resetHour:00 local time.
 * - Listens for visibilitychange to handle tab sleep/wake boundary crossing.
 * - Cleans up on unmount.
 */
export function useResetTimer(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storedDayRef = useRef<string>(currentDevotionalDay());

  useEffect(() => {
    function scheduleNext(): void {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const resetHour = useSettingsStore.getState().resetHour;
      const nextReset = getNextReset(resetHour);
      const delay = Math.max(nextReset.getTime() - Date.now(), 0);

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        storedDayRef.current = currentDevotionalDay();
        archiveAndReset(scheduleNext);
      }, delay);
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState !== "visible") return;
      const currentDay = currentDevotionalDay();
      if (currentDay !== storedDayRef.current) {
        storedDayRef.current = currentDay;
        archiveAndReset(scheduleNext);
      }
    }

    storedDayRef.current = currentDevotionalDay();
    scheduleNext();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/hooks/useResetTimer.ts
git commit -m "feat(hooks): add useResetTimer — daily reset at user-chosen local hour"
```

---

## Task 4: Create `OnboardingScreen`

**Files:**
- Create: `components/onboarding/OnboardingScreen.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { useSettingsStore } from "@/lib/store/settingsStore";

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function OnboardingScreen() {
  const [selectedHour, setSelectedHour] = useState(5);
  const setResetHour = useSettingsStore((s) => s.setResetHour);
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);

  function handleBegin() {
    setResetHour(selectedHour);
    setHasOnboarded(true);
  }

  return (
    <main
      className="flex flex-col h-dvh w-full bg-background overflow-hidden"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      {/* Welcome */}
      <div className="flex flex-col items-center justify-center flex-1 px-8 gap-5">
        <h1 className="font-heading text-2xl tracking-tight text-foreground">
          wird الأساس
        </h1>
        <p className="text-[11px] font-sans tracking-[0.25em] uppercase text-muted-foreground text-center">
          Your daily wird, beautifully simple
        </p>
        <p className="text-sm font-sans text-muted-foreground text-center leading-relaxed max-w-[260px]">
          A quiet space to count your dhikr and keep your daily wird alive.
        </p>
      </div>

      {/* Reset time picker */}
      <div className="flex flex-col px-6 gap-4">
        <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/70 text-center">
          When should your wird reset each day?
        </p>

        {/* 4 rows × 6 cols: 12am–11pm */}
        <div className="grid grid-cols-6 gap-2">
          {HOURS.map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHour(h)}
              className={[
                "text-[10px] font-sans tracking-wide rounded-md py-2 transition-colors",
                selectedHour === h
                  ? "bg-accent text-accent-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              ].join(" ")}
            >
              {formatHour(h)}
            </button>
          ))}
        </div>

        <button
          onClick={handleBegin}
          className="w-full py-3 rounded-lg bg-foreground text-background text-sm font-sans tracking-[0.15em] uppercase transition-opacity hover:opacity-80 active:opacity-70"
        >
          Begin
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/OnboardingScreen.tsx
git commit -m "feat(onboarding): add first-launch welcome screen with 24-hour reset picker"
```

---

## Task 5: Update `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { DhikrDeck } from "@/components/counter/DhikrDeck";
import { ThemeToggle } from "@/components/counter/ThemeToggle";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { CompletionOverlay } from "@/components/counter/CompletionOverlay";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { useResetTimer } from "@/lib/hooks/useResetTimer";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { DayCompletionBadge } from "@/components/counter/DayCompletionBadge";
import { HistorySheet } from "@/components/history/HistorySheet";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { ADHKAR, getTarget } from "@/lib/data/adhkar";

function wasSessionAlreadyComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = JSON.parse(localStorage.getItem("wird-session") || "{}");
    const { counts = {}, mode = "full" } = stored?.state ?? {};
    return ADHKAR.every((e) => (counts[e.index] ?? 0) >= getTarget(e, mode));
  } catch {
    return false;
  }
}

// Read localStorage synchronously to avoid a flash of the onboarding screen
// for returning users while the Zustand store hydrates.
function wasAlreadyOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = JSON.parse(localStorage.getItem("wird-settings") || "{}");
    return stored?.state?.hasOnboarded === true;
  } catch {
    return false;
  }
}

export default function CounterPage() {
  const { sessionStartedAt, setSessionStartedAt, counts, mode } =
    useSessionStore();

  const [overlayDismissed, setOverlayDismissed] = useState(wasSessionAlreadyComplete);

  // showOnboarding starts from localStorage so returning users see no flash.
  // The useEffect syncs it once the store hydrates (catches the OnboardingScreen
  // setting hasOnboarded → true).
  const [showOnboarding, setShowOnboarding] = useState(() => !wasAlreadyOnboarded());
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);
  useEffect(() => {
    if (hasOnboarded) setShowOnboarding(false);
  }, [hasOnboarded]);

  useWakeLock();
  useResetTimer();

  useEffect(() => {
    if (sessionStartedAt === null) {
      setSessionStartedAt(Date.now());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (showOnboarding) return <OnboardingScreen />;

  const allComplete = ADHKAR.every(
    (entry) => counts[entry.index] >= getTarget(entry, mode)
  );
  const showOverlay = allComplete && !overlayDismissed;

  return (
    <main className="relative flex flex-col h-dvh w-full bg-background overflow-hidden">
      <div
        className="grid grid-cols-3 items-center px-5 pb-3 shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
      >
        <div className="flex items-center gap-0">
          <HistorySheet />
        </div>
        <div className="flex items-center justify-center">
          <DayCompletionBadge />
        </div>
        <div className="flex items-center gap-0 justify-end">
          <ThemeToggle />
          <SettingsSheet />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <DhikrDeck />
      </div>
      <AnimatePresence>
        {showOverlay && (
          <CompletionOverlay onDismiss={() => setOverlayDismissed(true)} />
        )}
      </AnimatePresence>
      <InstallPrompt />
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat(page): gate main counter behind onboarding, swap useFajrRollover for useResetTimer"
```

---

## Task 6: Update `SettingsSheet`

**Files:**
- Modify: `components/settings/SettingsSheet.tsx`

- [ ] **Step 1: Replace the file content**

Remove the location section and all geolocation logic. Add a "Daily reset time" section with the 24-hour chip picker.

```tsx
"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useSessionStore } from "@/lib/store/sessionStore";

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function SettingsSheet() {
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);
  const resetHour = useSettingsStore((s) => s.resetHour);
  const setResetHour = useSettingsStore((s) => s.setResetHour);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center justify-center h-10 w-10 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="bg-card border-t border-border max-h-[85vh]"
      >
        <SheetHeader>
          <SheetTitle className="text-[11px] font-sans tracking-[0.2em] uppercase text-muted-foreground text-left">
            Settings
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-4">
          {/* Mode section */}
          <div>
            <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/70 mb-4">
              Mode
            </p>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "full" | "shortened")}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="full" id="mode-full" />
                <Label
                  htmlFor="mode-full"
                  className="text-sm font-sans text-foreground cursor-pointer"
                >
                  Full (200 · 200 · 100 · 100)
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="shortened" id="mode-shortened" />
                <Label
                  htmlFor="mode-shortened"
                  className="text-sm font-sans text-foreground cursor-pointer"
                >
                  Short (20 · 20 · 10 · 10)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <hr className="border-border" />

          {/* Reset time section */}
          <div>
            <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/70 mb-4">
              Daily reset time
            </p>
            <div className="grid grid-cols-6 gap-2">
              {HOURS.map((h) => (
                <button
                  key={h}
                  onClick={() => setResetHour(h)}
                  className={[
                    "text-[10px] font-sans tracking-wide rounded-md py-2 transition-colors",
                    resetHour === h
                      ? "bg-accent text-accent-foreground font-medium"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  ].join(" ")}
                >
                  {formatHour(h)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

The selected chip is driven directly by `resetHour` from the store — no local state — so it stays correct after store hydration (no stale-initial-value bug).

- [ ] **Step 2: Commit**

```bash
git add components/settings/SettingsSheet.tsx
git commit -m "feat(settings): replace location section with daily reset time picker"
```

---

## Task 7: Remove dead files and `adhan` package

**Files:**
- Delete: `lib/hooks/useFajrRollover.ts`
- Delete: `lib/hooks/useGeolocation.ts`

- [ ] **Step 1: Delete the old hooks**

```bash
rm lib/hooks/useFajrRollover.ts lib/hooks/useGeolocation.ts
```

- [ ] **Step 2: Uninstall `adhan`**

```bash
npm uninstall adhan
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove useFajrRollover, useGeolocation, and adhan package"
```

---

## Task 8: Verify

- [ ] **Step 1: Run the full test suite**

```bash
npm run test:run
```

Expected: all tests pass (devotionalDay suite + completionClassifier + streaks).

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors. Fix any remaining references to `location`, `useGeolocation`, or `adhan` if lint surfaces them.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Manual smoke test**

Start the dev server:
```bash
npm run dev
```

Then verify:
1. Clear `wird-settings` from localStorage (DevTools → Application → Local Storage → delete key) and reload → onboarding screen appears
2. Select a non-default hour (e.g. 7am), tap **Begin** → main counter loads, onboarding does not reappear on reload
3. Open Settings sheet → "Daily reset time" section shows the chip picker with 7am selected
4. Change to a different hour in Settings → chip updates immediately
5. Confirm `adhan` is absent: `grep -r "adhan" lib/ components/ app/` → no results

- [ ] **Step 5: Commit (if any lint/build fixes were needed)**

```bash
git add -A
git commit -m "fix: address lint/build issues after adhan removal"
```
