# Phase 3: History & Streaks — Research

**Researched:** 2026-05-30
**Domain:** Local-first streak computation + calendar heatmap UI + per-day history detail
**Confidence:** HIGH

---

## Summary

Phase 3 reads `DailyRecord[]` from IndexedDB and derives streak numbers plus calendar completion data from those raw records. The storage layer, archival hook, and `classifyDay()` classifier are already complete — this phase is purely a read + display phase with no new writes.

The two novel technical concerns are: (1) the streak algorithm, which must handle the project's partial-day rule and the Fajr-based day boundary (not calendar midnight), and (2) the calendar heatmap component. Both concerns resolve cleanly: streak logic is straightforward pure-function math over sorted day keys; the heatmap is best served by `react-activity-calendar` v3 (React 19 support confirmed, SSR-safe, actively maintained).

The day detail view (HIST-04) reuses the existing `Sheet` primitive already in the project — no new component installation needed.

**Primary recommendation:** Implement streak logic as a pure utility function `computeStreaks(records)` tested in isolation; wire heatmap via `react-activity-calendar` v3; surface day detail in a bottom `Sheet`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HIST-01 | User can view current streak (consecutive days with at least 1 dhikr completed) | `computeStreaks()` pure function over sorted `DailyRecord[]` using `classifyDay()` |
| HIST-02 | User can view longest streak ever achieved | Same `computeStreaks()` function returns both `current` and `longest` in one pass |
| HIST-03 | Calendar heatmap shows full / partial / none per day | `react-activity-calendar` v3 with `level` 0/1/2 mapped from `CompletionLevel` |
| HIST-04 | User can see per-dhikr completion breakdown for each day in history | Day-tap handler reads `getDailyRecord(dayKey)` from idb, renders counts in bottom `Sheet` |
</phase_requirements>

---

## Streak Policy Decision (REQUIRED before planning)

STATE.md flags: "Decide partial-day streak policy before building streak logic."

**Recommended policy (matches REQUIREMENTS.md HIST-01 wording):**

> A streak = consecutive days where `classifyDay` returns `"full"` OR `"partial"` (i.e., at least 1 dhikr completed). A day with `"none"` breaks the streak.

This means:
- `"partial"` days sustain the streak.
- HIST-01 wording ("at least 1 dhikr completed") confirms this interpretation.
- The `classifyDay()` function already returns `"none"` only when zero dhikr are completed, so `level !== "none"` is the streak-continue condition.

**Current streak definition:** The number of consecutive days, counting back from today (or yesterday if today has no record yet), where each day has a non-"none" classification.

**Handling today:** If no record exists for today's devotional day key, today is treated as a gap for the purpose of current streak calculation (the user hasn't completed anything yet). The current streak is whatever unbroken run ends on the most recent day that HAS a record.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-activity-calendar` | 3.2.0 | Calendar heatmap SVG component | React 19 + SSR supported; actively maintained (v3 April 2026); `date-fns` v4 dep already consistent with ecosystem |
| `idb` | 8.0.3 (already installed) | Read `DailyRecord[]` from IndexedDB | Already in project — `getAllDailyRecords()` and `getDailyRecord()` exist |
| `classifyDay()` | local (already exists) | Derives `CompletionLevel` from counts | Already implemented, tested |
| `Sheet` (shadcn/ui) | already installed | Bottom sheet for day detail (HIST-04) | Already in project via `components/ui/sheet.tsx` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand (already installed) | 5.x | Optional: cache loaded records | Use only if re-fetching IndexedDB on every heatmap render is slow (unlikely for <365 records) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-activity-calendar` | `@uiw/react-heat-map` | uiw uses a workspace monorepo; React 19 peer dep not confirmed in research; react-activity-calendar is clearly confirmed |
| `react-activity-calendar` | Hand-rolled SVG grid | Hand-rolling is ~200 lines of layout math to handle year-start day-of-week offsets, month labels, etc. — not worth it |
| Bottom `Sheet` for day detail | `Dialog` component | Sheet slides from bottom (mobile-native feel); Dialog requires installing a new component. Sheet already exists. |

**Installation:**
```bash
npm install react-activity-calendar
```

---

## Architecture Patterns

### Recommended Project Structure
```
lib/
  utils/
    streaks.ts           # Pure function: computeStreaks(records) → { current, longest }
    streaks.test.ts      # Vitest unit tests
components/
  history/
    HistorySheet.tsx     # Bottom Sheet, contains StreakDisplay + HeatmapCalendar
    StreakDisplay.tsx    # Renders current + longest streak numbers
    HeatmapCalendar.tsx  # Wraps react-activity-calendar, maps records → ActivityCalendarData
    DayDetailSheet.tsx   # Nested bottom Sheet for per-dhikr breakdown (HIST-04)
```

### Pattern 1: Pure Streak Computation
**What:** A single pure function that takes `DailyRecord[]` and returns `{ current: number, longest: number }`.
**When to use:** Called at render time inside `HistorySheet`. No caching needed for typical history sizes.

```typescript
// lib/utils/streaks.ts
import { classifyDay } from "@/lib/utils/completionClassifier";
import type { DailyRecord } from "@/lib/storage/schema";

export interface StreakResult {
  current: number;
  longest: number;
}

export function computeStreaks(records: DailyRecord[]): StreakResult {
  if (records.length === 0) return { current: 0, longest: 0 };

  // Build a Set of active day keys (non-"none" days)
  const activeDays = new Set(
    records
      .filter((r) => classifyDay(r.counts, r.mode) !== "none")
      .map((r) => r.dayKey)
  );

  // Sort unique day keys ascending
  const sorted = Array.from(activeDays).sort();

  // Compute longest streak by iterating sorted keys
  let longest = 0;
  let run = 0;
  let prev: string | null = null;

  for (const key of sorted) {
    if (prev !== null && isConsecutive(prev, key)) {
      run++;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = key;
  }

  // Compute current streak: walk backwards from the most recent active day
  // A gap of more than 1 calendar day breaks the current streak
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (i === sorted.length - 1) {
      current = 1;
    } else if (isConsecutive(sorted[i], sorted[i + 1])) {
      current++;
    } else {
      break;
    }
  }

  return { current, longest };
}

/** Returns true if dayKeyB is exactly 1 calendar day after dayKeyA. */
function isConsecutive(dayKeyA: string, dayKeyB: string): boolean {
  const a = new Date(dayKeyA + "T00:00:00Z");
  const b = new Date(dayKeyB + "T00:00:00Z");
  return b.getTime() - a.getTime() === 86_400_000;
}
```

**Important note on `isConsecutive`:** Day keys are `YYYY-MM-DD` UTC calendar dates (set by `getDevotionalDay` using UTC components). Appending `T00:00:00Z` parses them as UTC midnight, making the 86400000ms diff check unambiguous across DST.

### Pattern 2: Mapping Records to Heatmap Data
**What:** Transform `DailyRecord[]` into the `Activity[]` format expected by `react-activity-calendar`.
**Level mapping:** `none → 0`, `partial → 1`, `full → 2`.

```typescript
// Inside HeatmapCalendar.tsx
import ActivityCalendar from "react-activity-calendar";
import type { Activity } from "react-activity-calendar";
import { classifyDay } from "@/lib/utils/completionClassifier";
import type { DailyRecord } from "@/lib/storage/schema";

function recordsToActivityData(records: DailyRecord[]): Activity[] {
  return records.map((r) => {
    const level = classifyDay(r.counts, r.mode);
    return {
      date: r.dayKey,           // "YYYY-MM-DD" — matches library's expected format
      count: level === "none" ? 0 : level === "partial" ? 1 : 2,
      level: level === "none" ? 0 : level === "partial" ? 1 : 2,
    };
  });
}

// react-activity-calendar requires data sorted ascending by date
// and requires at least the first and last day of the range to be present
// Use the `blockSize` and `blockMargin` props to tune cell density
```

**react-activity-calendar data contract (HIGH confidence):**
- `data` prop: `Activity[]` sorted ascending by `date`
- Each `Activity`: `{ date: string, count: number, level: number }`
- `level` range: controlled by `minLevel` (default 0) and `maxLevel` (default 4) — we use 0–2 and pass `maxLevel={2}`
- `theme` prop accepts `{ light: string[], dark: string[] }` color arrays per level
- CSS import needed for tooltips: `import "react-activity-calendar/dist/index.css"`
- SSR: component is SSR-safe
- Must be used in a Client Component (`"use client"`)

### Pattern 3: History Entry Point
**What:** Add a History button to the counter header (alongside the existing Settings gear). Tapping opens the `HistorySheet` bottom sheet.
**When to use:** Single entry point from the main counter screen.

```tsx
// In app/page.tsx header row — add between DayCompletionBadge and SettingsSheet
<HistoryButton />   // opens HistorySheet
```

The `HistorySheet` fetches `getAllDailyRecords()` in a `useEffect` on open.

### Pattern 4: Day Detail
**What:** Tapping a day cell in the heatmap opens a nested `Sheet` (or replaces current sheet content) showing per-dhikr counts vs targets.
**When to use:** HIST-04 requirement.

```tsx
// DayDetailSheet.tsx receives dayKey: string | null
// If dayKey is not null, calls getDailyRecord(dayKey) and renders:
// - Day key formatted as human date
// - 4 rows: dhikr name + count/target + completion mark
```

Use the existing `Sheet` component from `@/components/ui/sheet`. A nested sheet (Sheet inside Sheet) works with Radix — just control `open` state separately.

### Anti-Patterns to Avoid
- **Storing `CompletionLevel` in IndexedDB:** `classifyDay` is always derived at read time. Never store it.
- **Using wall-clock date for streak calculation:** Day keys are devotional days (Fajr boundary), not midnight. The keys are already YYYY-MM-DD strings — comparing them directly is correct since `getDevotionalDay` produces them.
- **Fetching all records on every render:** Fetch once when the sheet opens, store in local component state.
- **Rendering `react-activity-calendar` outside a Client Component:** It uses browser APIs. Wrap in `"use client"`.
- **Omitting the CSS import for tooltips:** `import "react-activity-calendar/dist/index.css"` must be in the Client Component that uses it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar grid (year heatmap) | Custom SVG/CSS grid | `react-activity-calendar` | Year-start day-of-week offset, month labels, week layout, responsive sizing — ~200 lines of layout math |
| Tooltip on day hover | Custom tooltip | Built-in via `react-activity-calendar` (floating-ui) | Floating UI handles positioning edge cases at grid boundaries |

**Key insight:** The streak algorithm is genuinely simple (sort, walk) and must be custom because it knows about the Fajr day boundary. The visual calendar grid has no project-specific logic and should not be custom.

---

## Common Pitfalls

### Pitfall 1: Off-by-one in "current streak" when today has no record
**What goes wrong:** If the user hasn't completed anything today yet, there's no `DailyRecord` for today's `dayKey`. A naive "count from today backwards" approach produces 0 even though the user has an unbroken run through yesterday.
**How to avoid:** The current streak walks backwards from the most recent day key that EXISTS in the active set — not from today's date. The run is unbroken as long as each consecutive step back is exactly 1 day.
**Warning signs:** Streak shows 0 after a valid yesterday completion.

### Pitfall 2: `react-activity-calendar` requires data sorted ascending
**What goes wrong:** Passing unsorted records produces rendering artifacts or incorrect layout.
**How to avoid:** `Array.sort()` on `dayKey` strings sorts ISO dates correctly (lexicographic = chronological). Always sort before passing to the component.

### Pitfall 3: `react-activity-calendar` shows blank if date range has no entries
**What goes wrong:** The component by default shows the last full year. If the user has 0 records, passing an empty array may cause errors or blank rendering.
**How to avoid:** Guard with `if (records.length === 0)` and show a "No history yet" message instead of rendering `ActivityCalendar`.

### Pitfall 4: SSR hydration mismatch on history data
**What goes wrong:** `getAllDailyRecords()` is browser-only (IndexedDB). Fetching it during SSR or before hydration causes mismatch.
**How to avoid:** Fetch inside `useEffect` after mount, initialise state as `null` (loading) and render a skeleton until data arrives. The `HistorySheet` is a Client Component so this is natural.

### Pitfall 5: Nested Sheet z-index / focus trap
**What goes wrong:** Opening a `DayDetailSheet` inside `HistorySheet` can cause focus trap conflicts with Radix.
**How to avoid:** Use a single `Sheet` component for `HistorySheet` and control the day detail as a conditional sub-view within the same sheet (replace content), rather than truly nesting two `Sheet` components. Alternatively, manage the day detail as a `div` overlay within the sheet.

---

## Code Examples

### computeStreaks — full implementation
```typescript
// Source: designed from project schema + streak policy decision
// lib/utils/streaks.ts

import { classifyDay } from "@/lib/utils/completionClassifier";
import type { DailyRecord } from "@/lib/storage/schema";

export interface StreakResult {
  current: number;
  longest: number;
}

export function computeStreaks(records: DailyRecord[]): StreakResult {
  if (records.length === 0) return { current: 0, longest: 0 };

  const activeDays = new Set(
    records
      .filter((r) => classifyDay(r.counts, r.mode) !== "none")
      .map((r) => r.dayKey)
  );

  const sorted = Array.from(activeDays).sort();
  if (sorted.length === 0) return { current: 0, longest: 0 };

  // Compute longest
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (isConsecutive(sorted[i - 1], sorted[i])) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Compute current (walk backward from last active day)
  let current = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    if (isConsecutive(sorted[i - 1], sorted[i])) {
      current++;
    } else {
      break;
    }
  }

  return { current, longest };
}

function isConsecutive(a: string, b: string): boolean {
  // ISO date strings parse correctly with T00:00:00Z for UTC comparison
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return db - da === 86_400_000;
}
```

### react-activity-calendar basic wiring
```tsx
// Source: react-activity-calendar v3 README + research
// components/history/HeatmapCalendar.tsx
"use client";

import ActivityCalendar from "react-activity-calendar";
import type { Activity } from "react-activity-calendar";
// Required for tooltip styles
import "react-activity-calendar/dist/index.css";

interface Props {
  data: Activity[];
  onDayClick?: (date: string) => void;
}

export function HeatmapCalendar({ data, onDayClick }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-[10px] font-mono tracking-widest uppercase text-white/30">
        No history yet
      </p>
    );
  }

  return (
    <ActivityCalendar
      data={data}
      maxLevel={2}
      theme={{
        dark: [
          "oklch(0.15 0 0)",    // level 0: near-invisible
          "oklch(0.55 0 0)",    // level 1: partial (muted white)
          "oklch(0.72 0.10 70)", // level 2: full (amber accent)
        ],
      }}
      colorScheme="dark"
      eventHandlers={{
        onClick: () => (activity) => onDayClick?.(activity.date),
      }}
      blockSize={12}
      blockMargin={3}
      fontSize={10}
      hideMonthLabels={false}
      showWeekdayLabels={false}
    />
  );
}
```

### Loading history in HistorySheet
```tsx
// components/history/HistorySheet.tsx (skeleton)
"use client";

import { useState, useEffect } from "react";
import { getAllDailyRecords } from "@/lib/storage/idb";
import type { DailyRecord } from "@/lib/storage/schema";

export function HistorySheet() {
  const [records, setRecords] = useState<DailyRecord[] | null>(null);

  // Fetch on mount (this is a client component — no SSR concern)
  useEffect(() => {
    getAllDailyRecords().then(setRecords);
  }, []);

  // ... render StreakDisplay + HeatmapCalendar when records !== null
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-calendar-heatmap` (kevinsqi) | `react-activity-calendar` (grubersjoe) | 2022+ | Old lib unmaintained; new lib has React 18/19 support, floating-ui tooltips, TS-first |
| Manual SVG heatmap | `react-activity-calendar` v3 | April 2026 (v3) | v3 adds negative levels, improved theming |

**Deprecated/outdated:**
- `react-calendar-heatmap`: Last meaningful update ~2021; no React 18/19 peer dep; avoid.
- `@uiw/react-heat-map`: Active but monorepo structure; React 19 peer dep unconfirmed in research.

---

## Open Questions

1. **History screen navigation entry point**
   - What we know: The counter page header has Settings (right) and ModeToggle (left) with DayCompletionBadge center.
   - What's unclear: Should History live in Settings sheet (as a section) or as a separate top-level icon in the header?
   - Recommendation: Add a small History icon button to the header (left of DayCompletionBadge) for direct access — keeps it one tap away and consistent with the Settings gear pattern.

2. **react-activity-calendar `eventHandlers` API shape**
   - What we know: v3 API uses `eventHandlers` prop; the onClick handler shape appears to be `{ onClick: () => (activity) => void }` (curried).
   - What's unclear: Exact TypeScript signature — verify against library types at implementation time.
   - Recommendation: Check `import type { EventHandlerMap } from "react-activity-calendar"` at plan time; treat as LOW confidence until verified at implementation.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.mts` (project root) |
| Quick run command | `npx vitest run lib/utils/streaks.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIST-01 | `computeStreaks` returns correct `current` streak | unit | `npx vitest run lib/utils/streaks.test.ts` | ❌ Wave 0 |
| HIST-02 | `computeStreaks` returns correct `longest` streak | unit | `npx vitest run lib/utils/streaks.test.ts` | ❌ Wave 0 |
| HIST-03 | `recordsToActivityData` maps levels correctly | unit | `npx vitest run components/history/HeatmapCalendar.test.ts` | ❌ Wave 0 |
| HIST-04 | Day detail renders correct dhikr counts from record | manual-only | N/A — sheet interaction is visual | ❌ N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/utils/streaks.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/utils/streaks.test.ts` — covers HIST-01, HIST-02
- [ ] `lib/utils/streaks.ts` — the implementation under test
- [ ] (Optional) `components/history/HeatmapCalendar.test.ts` — covers HIST-03 mapping logic if extracted as a pure function

---

## Sources

### Primary (HIGH confidence)
- `lib/storage/schema.ts` (project file) — `DailyRecord` shape, field names, IDB key
- `lib/storage/idb.ts` (project file) — `getAllDailyRecords()`, `getDailyRecord()` API
- `lib/utils/completionClassifier.ts` (project file) — `classifyDay()` signature and `CompletionLevel` type
- `lib/utils/devotionalDay.ts` (project file) — UTC day key format and Fajr boundary semantics
- `github.com/grubersjoe/react-activity-calendar/blob/main/package.json` — v3.2.0, peerDeps `react: ^18.0.0 || ^19.0.0`, `date-fns: ^4.2.1`

### Secondary (MEDIUM confidence)
- `github.com/grubersjoe/react-activity-calendar` README — data format `{ date, count, level }`, `theme`, `maxLevel`, SSR support, Next.js example
- WebSearch: `react-activity-calendar` described as React 19 supported, actively maintained April 2026

### Tertiary (LOW confidence)
- `eventHandlers.onClick` curried signature — from WebFetch of library README; exact TS type should be re-verified at implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `react-activity-calendar` peer deps verified via package.json; idb/classifyDay/Sheet are already in project
- Architecture: HIGH — streak algorithm is elementary sorted-array logic; heatmap mapping is straightforward
- Streak policy: HIGH — HIST-01 wording ("at least 1 dhikr") is unambiguous
- Pitfalls: HIGH — SSR/hydration and off-by-one patterns are verified from project conventions in STATE.md
- `eventHandlers` TS shape: LOW — needs verification at implementation

**Research date:** 2026-05-30
**Valid until:** 2026-07-01 (react-activity-calendar is stable; core project files don't change)
