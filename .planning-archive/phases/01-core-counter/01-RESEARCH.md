# Phase 1: Core Counter - Research

**Researched:** 2026-05-30
**Domain:** Full-screen tap counter UI, SVG progress ring, swipe deck navigation, Arabic font rendering, Wake Lock API, Vibration API, Zustand session integration
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COUNT-01 | One dhikr shown at a time (Arabic, transliteration, translation) | Arabic font via `next/font/google` (Noto Naskh Arabic); `dir="rtl" lang="ar"` on Arabic container; transliteration/translation as separate elements with explicit LTR |
| COUNT-02 | User can swipe between the 4 adhkar in any order | `motion` drag ("x" axis) with `onDragEnd` velocity + offset threshold; page index state drives which dhikr is visible |
| COUNT-03 | Full-screen tap increments count for the current dhikr | `useSessionStore.incrementCount(activeIndex)` on `pointerup` over a full-screen `div`; `touch-action: manipulation` prevents double-tap zoom |
| COUNT-04 | Circular progress ring fills toward target as count increases | `<motion.circle>` with `pathLength` (0–1 normalized from count/target); live re-animation on every increment |
| COUNT-05 | Tapping past target is allowed; completion mark appears at target but counting continues | `pathLength` clamps at 1; a separate boolean `completed` (count >= target) drives a checkmark or glow overlay |
| COUNT-06 | Each dhikr tracked independently (any order, any time) | All 4 counts live in `useSessionStore.counts` (Record<DhikrIndex, number>); activeIndex controls which is displayed |
| COUNT-07 | User can choose Full (200/200/100/100) or Shortened (20/20/10/10) mode per session | Mode from `useSessionStore.mode`; targets derived from a static map; mode toggle on the counter screen updates store |
| COUNT-08 | Count progress for all 4 adhkar persists if app closed; resumes on reopen | Already implemented: `useSessionStore` persists to `"wird-session"` with `skipHydration: true` |
| COUNT-09 | Screen stays awake while counter screen is active | `navigator.wakeLock.request("screen")` on counter mount; re-acquire on `visibilitychange`; release on unmount |
| COUNT-10 | Haptic feedback on each tap; visual pulse fallback for iOS | `navigator.vibrate(10)` feature-detected; CSS `@keyframes` pulse scale fallback always rendered |
| COMP-03 | Full wird completion triggers a calm, dignified completion moment | A simple overlay or ring glow shown when all 4 dhikr counts >= target; no confetti; dismiss on tap |
| SET-01 | User can set a default mode (Full/Shortened) that persists across sessions | `useSettingsStore.setDefaultMode(mode)` + `useSettingsStore.defaultMode`; session mode initialized from `defaultMode` on new session |
</phase_requirements>

---

## Summary

Phase 1 builds the core counting experience on top of the Phase 0 storage foundation. The work splits into four areas: (1) a dhikr data file defining the 4 adhkar with Arabic, transliteration, and translation; (2) a swipe deck using `motion` drag for navigation between the 4 dhikr screens; (3) a full-screen tap surface with an SVG circular progress ring animated via `motion`'s `pathLength`; (4) platform API integration for screen wake lock, haptic feedback, and the Mode/Settings sheet.

Phase 0 delivered `useSessionStore` and `useSettingsStore` already persisting and rehydrating correctly. Phase 1 is entirely UI work — no new state schema changes are needed, only reading existing store state and dispatching existing actions. The `incrementCount(index)`, `setMode`, `setActiveIndex`, `setDefaultMode` actions are all already implemented.

The most technically subtle problems in this phase are: (a) preventing swipe gestures from registering as taps (and vice versa) on the full-screen surface, (b) correct Arabic text rendering with harakat preserved using a proper typeface, and (c) Wake Lock re-acquisition after the browser releases it on tab switch. All three have known, well-tested solutions on this stack.

**Primary recommendation:** Use `motion` (already installed) for both the swipe deck (`drag="x"` with velocity-gated `onDragEnd`) and the progress ring (`motion.circle` + `pathLength`). Load Noto Naskh Arabic via `next/font/google` for harakat-correct rendering. Implement wake lock with a custom React hook that handles `visibilitychange` re-acquisition.

---

## Standard Stack

### Core (already installed — no new installs needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `motion` | 12.40.0 | Swipe deck drag + progress ring pathLength animation | Already installed; `drag="x"` + `pathLength` cover both needs cleanly |
| `zustand` | 5.0.14 | Read/write session counts, mode, activeIndex | Already installed + stores implemented in Phase 0 |
| `next/font/google` | built-in | Self-hosted Arabic webfont (Noto Naskh Arabic) | No extra install; avoids layout shift; correct harakat rendering |
| Web Wake Lock API | platform | `navigator.wakeLock.request("screen")` | Baseline 2025 (newly available across all modern browsers as of March 2025); no library needed |
| Web Vibration API | platform | `navigator.vibrate(10)` on each tap | Available on Android/Chrome; feature-detected and silently skipped on iOS |

### No new runtime dependencies required
All functionality is achievable with already-installed packages (`motion`, `zustand`, `idb`, shadcn/ui) plus platform APIs. The only "addition" is the Arabic font loaded via `next/font/google` (zero bundle size — self-hosted as a CSS variable).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `motion.circle` + `pathLength` | `react-circular-progressbar` | Adds a dep; `motion` is already installed and its `pathLength` handles the math with cleaner animation control |
| `motion` drag for swipe | `embla-carousel-react` | embla is excellent but adds a dep; `motion` drag covers this use-case with threshold + velocity gating |
| Custom wake lock hook | `react-screen-wake-lock` | Small library but adds a dep; the hook pattern is 20 lines and more transparent |
| Noto Naskh Arabic | Amiri | Both support harakat; Noto Naskh is the Google Fonts "Naskh UI" face — slightly better screen hinting at small sizes; Amiri is preferable for long classical/Quranic text |

**No new `npm install` required for this phase.**

---

## Architecture Patterns

### Recommended File Structure

```
app/
  counter/
    page.tsx              # Counter route (Client Component — uses stores + motion)
components/
  counter/
    DhikrDeck.tsx         # Swipe deck: wraps 4 DhikrCard panels, handles drag nav
    DhikrCard.tsx         # Single dhikr display: Arabic text, transliteration, translation
    ProgressRing.tsx      # SVG circular ring + motion.circle pathLength animation
    TapSurface.tsx        # Full-screen invisible tap target with haptic + pulse
    ModeToggle.tsx        # Full / Shortened mode switcher
    CompletionOverlay.tsx # Calm completion moment when all 4 counts hit target
  settings/
    SettingsSheet.tsx     # shadcn Sheet with default mode setting
lib/
  data/
    adhkar.ts             # Static data: 4 dhikr objects with Arabic, transliteration, translation, targets
  hooks/
    useWakeLock.ts        # Custom hook: acquire/release/re-acquire wake lock
    useHaptic.ts          # Custom hook: navigator.vibrate with feature detection
```

### Pattern 1: Dhikr Static Data File

**What:** A single TypeScript file defining the 4 adhkar with typed entries. Targets are derived at runtime from the mode.

**When to use:** Any component that needs dhikr text or base targets reads from this file.

```typescript
// lib/data/adhkar.ts
export interface DhikrEntry {
  index: 0 | 1 | 2 | 3;
  arabic: string;
  transliteration: string;
  translation: string;
  /** Base targets for [full, shortened] modes */
  targets: { full: number; shortened: number };
}

export const ADHKAR: DhikrEntry[] = [
  {
    index: 0,
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Hasbiyallahu la ilaha illa huwa, 'alayhi tawakkaltu wa huwa rabbul 'arshil 'azim",
    translation: "Allah is sufficient for me; there is no deity except Him. On Him I have relied, and He is the Lord of the Great Throne.",
    targets: { full: 200, shortened: 20 },
  },
  {
    index: 1,
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullaahal-'Azeema alladhee laa ilaaha illaa Huwal-Hayyul-Qayyoomu wa atoobu ilayh",
    translation: "I seek forgiveness from Allah the Magnificent, other than Whom there is no deity, the Ever-Living, the Sustainer of existence, and I repent to Him.",
    targets: { full: 200, shortened: 20 },
  },
  {
    index: 2,
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "La ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    translation: "There is no deity except Allah alone, with no partner or associate; His is the dominion, His is all praise, and He has power over all things.",
    targets: { full: 100, shortened: 10 },
  },
  {
    index: 3,
    arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ",
    transliteration: "Allahumma salli wa sallim 'ala nabiyyina Muhammad",
    translation: "O Allah, send prayers and peace upon our Prophet Muhammad.",
    targets: { full: 100, shortened: 10 },
  },
];

export function getTarget(entry: DhikrEntry, mode: "full" | "shortened"): number {
  return entry.targets[mode];
}
```

### Pattern 2: Motion Swipe Deck

**What:** A horizontally draggable container showing one dhikr at a time. `onDragEnd` checks offset and velocity to decide whether to advance or retreat the active index.

**When to use:** The main counter page; the deck is the top-level interactive shell.

**Key insight:** Setting `dragConstraints={{ left: 0, right: 0 }}` combined with `dragElastic={0.2}` gives the pull-back-and-snap feel. The `onDragEnd` check uses BOTH offset threshold (e.g., 80px) OR velocity threshold (e.g., 500 px/s) — whichever triggers first — to feel responsive without requiring a full drag.

```typescript
// Source: motion.dev/docs/react-drag (verified 2026-05-30)
"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { DhikrIndex } from "@/lib/storage/schema";

const SWIPE_OFFSET_THRESHOLD = 80;  // px
const SWIPE_VELOCITY_THRESHOLD = 500; // px/s

export function DhikrDeck() {
  const activeIndex = useSessionStore((s) => s.activeIndex);
  const setActiveIndex = useSessionStore((s) => s.setActiveIndex);
  const count = ADHKAR.length; // 4

  function handleDragEnd(_event: PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) {
    const { offset, velocity } = info;
    const swipedLeft = offset.x < -SWIPE_OFFSET_THRESHOLD || velocity.x < -SWIPE_VELOCITY_THRESHOLD;
    const swipedRight = offset.x > SWIPE_OFFSET_THRESHOLD || velocity.x > SWIPE_VELOCITY_THRESHOLD;

    if (swipedLeft && activeIndex < count - 1) {
      setActiveIndex((activeIndex + 1) as DhikrIndex);
    } else if (swipedRight && activeIndex > 0) {
      setActiveIndex((activeIndex - 1) as DhikrIndex);
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      className="w-full h-full"
    >
      {/* DhikrCard for the active index */}
    </motion.div>
  );
}
```

**Important:** `dragMomentum={false}` is recommended for a pager (you want snap behavior, not free-scroll). Combine with an `animate={{ x: 0 }}` reset after each page change so the element springs back to center.

### Pattern 3: Motion SVG Progress Ring

**What:** A `<motion.circle>` with `pathLength` animated from 0 to `count / target` (clamped at 1). Re-animates every time count changes.

**When to use:** Rendered inside every DhikrCard, reads from the session store.

```typescript
// Source: motion.dev/docs/react-svg-animation (verified 2026-05-30)
"use client";
import { motion } from "motion/react";

interface ProgressRingProps {
  count: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ count, target, size = 280, strokeWidth = 6 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const progress = Math.min(count / target, 1); // clamp at 1 even if count > target
  const completed = count >= target;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track ring — always visible */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={completed ? "#a8edaa" : "white"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        // pathLength normalizes to 0-1; motion handles circumference math
        initial={{ pathLength: 0, rotate: -90 }}
        animate={{ pathLength: progress }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ originX: "50%", originY: "50%", rotate: -90 }}
      />
    </svg>
  );
}
```

**Note:** `rotate: -90` shifts the ring start from the right (SVG 0°) to the top (12 o'clock). Apply via `style={{ rotate: -90, originX: "50%", originY: "50%" }}` or a CSS transform. Use `motion.circle`'s `style` prop, not a Tailwind class, for the transform-origin.

**pathLength vs stroke-dashoffset:** `pathLength` is the modern Motion approach — no manual circumference calculation (`2πr`) required. It normalizes the 0–1 range internally. Verified against motion.dev official docs.

### Pattern 4: Full-Screen Tap Surface

**What:** A full-screen `div` that listens to `pointerup` (not `click`) and calls `incrementCount`. CSS prevents double-tap zoom and pull-to-refresh interference.

**When to use:** The primary tap zone in DhikrCard.

```typescript
// Verified against MDN pointer events + PITFALLS research
"use client";
import { useCallback } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { DhikrIndex } from "@/lib/storage/schema";

interface TapSurfaceProps {
  dhikrIndex: DhikrIndex;
  onTap?: () => void; // for haptic + visual pulse trigger
  children: React.ReactNode;
}

export function TapSurface({ dhikrIndex, onTap, children }: TapSurfaceProps) {
  const incrementCount = useSessionStore((s) => s.incrementCount);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Only fire for primary pointer (finger or left click); ignore drag completion
    if (e.isPrimary && e.button === 0) {
      incrementCount(dhikrIndex);
      onTap?.();
    }
  }, [dhikrIndex, incrementCount, onTap]);

  return (
    <div
      onPointerUp={handlePointerUp}
      style={{
        touchAction: "manipulation",  // prevents 300ms delay + double-tap zoom
        userSelect: "none",
        WebkitUserSelect: "none",
        overscrollBehavior: "none",
      }}
      className="w-full h-full flex flex-col items-center justify-center"
    >
      {children}
    </div>
  );
}
```

**Critical:** Use `pointerup`, not `click` or `touchend`, to avoid the 300ms delay and double-fire. Do NOT handle both `touchend` and `pointerup` — pick one. `pointerup` is the correct unified choice.

**Swipe vs tap conflict:** When the user drags the deck, `pointerup` on the inner `TapSurface` will fire after the drag ends. Suppress this by tracking `pointerdown` position and comparing to `pointerup` — if movement exceeds a small threshold (e.g., 10px), it was a swipe, not a tap.

### Pattern 5: Wake Lock Hook

**What:** A React custom hook that acquires a wake lock on mount, releases on unmount, and re-acquires on `visibilitychange` to "visible".

**When to use:** Mount in the counter page, not globally.

```typescript
// Source: developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API (verified 2026-05-30)
"use client";
import { useEffect, useRef } from "react";

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  async function acquire() {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Silently fail — wake lock is an enhancement, not a requirement
    }
  }

  useEffect(() => {
    acquire();

    async function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        await acquire();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);
}
```

### Pattern 6: Haptic Feedback Hook

**What:** A thin hook that wraps `navigator.vibrate` with feature detection. Always returns a function — on iOS it silently no-ops.

**When to use:** Call on each tap in `TapSurface` or `DhikrCard`.

```typescript
// Source: MDN Vibration API + iOS compatibility research (verified 2026-05-30)
export function useHaptic() {
  function vibrate(ms = 10) {
    if ("vibrate" in navigator) {
      navigator.vibrate(ms);
    }
    // On iOS Safari: navigator.vibrate is undefined; this branch is silently skipped
  }
  return vibrate;
}
```

**iOS fallback:** Since iOS does not support `navigator.vibrate`, the visual pulse is the primary feedback on iPhone. Implement a CSS `@keyframes` scale pulse (e.g., scale 1 → 1.04 → 1 over 150ms) on a count-display element, triggered by toggling a CSS class or a motion `animate` call on each tap.

### Pattern 7: Mode Toggle + Default Mode Setting (SET-01)

**What:** Mode toggle within the counter screen for per-session override. A Settings sheet (shadcn Sheet) for setting the persistent default.

**Session initialization:** On counter page mount, initialize `mode` from `settingsStore.defaultMode` ONLY if this is a new session (i.e., `sessionStartedAt === null`). Never overwrite an in-progress session's mode.

```typescript
// Counter page mount — initialize mode from defaultMode if no active session
useEffect(() => {
  const { sessionStartedAt, setMode, setSessionStartedAt } = useSessionStore.getState();
  const { defaultMode } = useSettingsStore.getState();
  if (sessionStartedAt === null) {
    setMode(defaultMode);
    setSessionStartedAt(Date.now());
  }
}, []);
```

### Anti-Patterns to Avoid

- **Using `click` event instead of `pointerup`**: The `click` event has a 300ms delay on mobile and can fire twice (touchend then click). Use `pointerup` as the single source of truth.
- **Animating the ring with `stroke-dashoffset` manually**: Requires circumference math (`2πr`). Motion's `pathLength` handles this declaratively. Don't hand-roll it.
- **Letting `onDragEnd` fire a tap**: A swipe ending will fire `pointerup` on any children. Track pointer movement distance; skip the tap if movement > 10px.
- **Setting `drag="x"` on the same element as the tap handler**: Separate concerns — drag lives on the outer `DhikrDeck` wrapper, tap handling on the inner `TapSurface`.
- **Acquiring wake lock globally in layout**: Wake lock should only be held while the counter screen is visible. Mount the hook in the counter page only, release on unmount.
- **Calling `setMode` on every render**: Read `defaultMode` from settingsStore only once on new-session initialization, not on every re-render.
- **Using `min-h-screen` for the counter**: On mobile, `100vh` shifts when browser chrome appears/disappears. Use `h-dvh` (dynamic viewport height) for the full-screen surface.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress ring circumference math | Manual `stroke-dashoffset = 2πr * (1 - progress)` | `motion.circle` + `pathLength` | pathLength is a 0–1 value; Motion normalizes internally — no r × π math needed |
| Swipe velocity physics | Custom easing + requestAnimationFrame spring | `motion` drag with `dragElastic` + `dragMomentum: false` | Motion handles all physics; onDragEnd gives velocity already computed |
| Arabic font self-hosting | Download + serve woff2 files manually | `next/font/google` (Noto Naskh Arabic) | `next/font` self-hosts automatically, eliminates CLS, sets `font-display: swap` |
| Wake lock lifecycle management | Bare `navigator.wakeLock` + manual event listeners | `useWakeLock` custom hook (20 lines) | Hook encapsulates acquire/release/re-acquire pattern with cleanup on unmount |
| Tap deduplication | Timestamp-based debounce | Movement-distance check (`pointerdown` origin vs `pointerup` position) | Debounce adds latency that loses fast taps; distance check is instantaneous |

**Key insight:** This phase's hardest problems (swipe physics, ring animation, wake lock lifecycle) are all solved by libraries or platform APIs already in the project. No new dependencies are needed.

---

## Common Pitfalls

### Pitfall 1: Swipe gesture fires a tap (double action)
**What goes wrong:** Dragging to switch dhikr also increments the count because `pointerup` fires at the end of a drag.
**Why it happens:** The drag `pointerup` bubbles to the `TapSurface` `onPointerUp` handler.
**How to avoid:** In `TapSurface`, record the pointer position on `pointerdown`. In `onPointerUp`, compare: if `Math.hypot(dx, dy) > 10`, it was a swipe — skip the count increment.
**Warning signs:** Tapping dhikr index changes but also increments. Swipe to next dhikr shows count = 1 even though user didn't intentionally tap.

### Pitfall 2: `motion.circle` rotation starting at wrong position (3 o'clock instead of 12 o'clock)
**What goes wrong:** The SVG coordinate system starts angles at 3 o'clock (0°). The progress ring fills from the right instead of the top.
**Why it happens:** SVG default; `pathLength` does not auto-rotate.
**How to avoid:** Apply `style={{ rotate: -90, originX: "50%", originY: "50%" }}` directly on the `motion.circle` element. Do NOT use a Tailwind `-rotate-90` class — it applies `transform: rotate(-90deg)` which may conflict with Motion's inline style transform.
**Warning signs:** Ring fills starting from the right side instead of the top.

### Pitfall 3: Arabic text not rendering harakat correctly
**What goes wrong:** Tashkeel (short vowels / diacritics) are missing, clipped, or misaligned. Arabic letters appear disconnected.
**Why it happens:** System fallback fonts rarely have complete Arabic shaping + harakat glyph coverage. Missing `lang="ar"` causes the browser to skip Arabic-specific font features.
**How to avoid:** Load Noto Naskh Arabic (or Amiri) via `next/font/google`. Apply `lang="ar"` and `dir="rtl"` to the Arabic text container. Set adequate `line-height` (1.8–2.2) for voweled text to prevent diacritic clipping.
**Warning signs:** Circles/dots appearing instead of letters; diacritics floating above the line or cut off.

### Pitfall 4: Wake lock silently released on tab switch without re-acquisition
**What goes wrong:** User switches apps and returns; screen immediately dims during counting.
**Why it happens:** Browser automatically releases wake lock when `document.visibilityState !== "visible"`.
**How to avoid:** In `useWakeLock`, listen for `visibilitychange` and call `navigator.wakeLock.request("screen")` again when `document.visibilityState === "visible"`.
**Warning signs:** Screen sleeps 30s after switching apps even though the counter is active.

### Pitfall 5: `100vh` jump on mobile browser chrome show/hide
**What goes wrong:** The full-screen counter surface jumps in height as the browser URL bar appears/disappears during tap interactions, shifting the progress ring and tap target.
**Why it happens:** `100vh` is measured against the layout viewport, which includes the hidden browser chrome. `100dvh` (dynamic viewport height) accounts for visible chrome.
**How to avoid:** Use `h-dvh` (Tailwind) or `height: 100dvh` CSS on the full-screen surface. Add `overscroll-behavior: none` to prevent pull-to-refresh on the counting screen.
**Warning signs:** Visible height jump when browser toolbar appears/disappears; elements shifting 56–64px.

### Pitfall 6: Mode not initialized from default on new sessions
**What goes wrong:** User sets default mode to "shortened", kills the app, reopens — counter shows "full" mode because the session store loaded its last persisted mode.
**Why it happens:** The session store persists `mode` directly; if a prior session used "full" mode, that's what rehydrates.
**How to avoid:** On counter mount, check if `sessionStartedAt === null` (true only if no active session exists). If so, call `setMode(settingsStore.defaultMode)` before setting `sessionStartedAt`. This ensures a fresh session inherits the user's default, while an in-progress session keeps its own mode.
**Warning signs:** Users report that changing the default mode in settings has no effect on the next session.

### Pitfall 7: `pathLength` transition creating lag at high tap rates
**What goes wrong:** At 3–5 taps/second toward a target of 200, each tap triggers a new motion animation. If the transition duration is too long, animations queue up and the ring appears to lag behind the actual count.
**Why it happens:** Each new `animate={{ pathLength: value }}` cancels the prior animation, but with `duration: 0.4s` the ring appears to always be "catching up."
**How to avoid:** Keep `transition={{ duration: 0.15, ease: "easeOut" }}` or shorter. The ring should complete its animation before the next likely tap at even high tap rates (3 taps/s = 333ms between taps; 0.15s transition leaves headroom).
**Warning signs:** Ring visually trails behind count number by several steps at fast tap rates.

---

## Code Examples

Verified patterns from official sources:

### motion.circle pathLength ring (official Motion docs)
```typescript
// Source: motion.dev/docs/react-svg-animation (verified 2026-05-30)
<motion.circle
  cx={center}
  cy={center}
  r={radius}
  fill="none"
  stroke="white"
  strokeWidth={6}
  strokeLinecap="round"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: progress }} // 0.0–1.0
  transition={{ duration: 0.15, ease: "easeOut" }}
  style={{ rotate: -90, originX: "50%", originY: "50%" }}
/>
```

### motion drag swipe pager (official Motion docs)
```typescript
// Source: motion.dev/docs/react-drag (verified 2026-05-30)
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.15}
  dragMomentum={false}
  onDragEnd={(event, info) => {
    const swipedLeft = info.offset.x < -80 || info.velocity.x < -500;
    const swipedRight = info.offset.x > 80 || info.velocity.x > 500;
    if (swipedLeft) advance();
    if (swipedRight) retreat();
  }}
/>
```

### Wake Lock re-acquire on visibilitychange (MDN)
```typescript
// Source: developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API (verified 2026-05-30)
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    wakeLock = await navigator.wakeLock.request("screen");
  }
});
```

### Noto Naskh Arabic via next/font/google
```typescript
// Source: Next.js official docs (next/font/google API)
import { Noto_Naskh_Arabic } from "next/font/google";

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic",
  display: "swap",
});
// Apply: <div style={{ fontFamily: "var(--font-arabic)" }} dir="rtl" lang="ar">
```

### Tap with swipe discrimination
```typescript
// Prevents swipe-end from registering as a tap
const pointerStart = useRef<{ x: number; y: number } | null>(null);

function onPointerDown(e: React.PointerEvent) {
  pointerStart.current = { x: e.clientX, y: e.clientY };
}

function onPointerUp(e: React.PointerEvent) {
  if (!e.isPrimary || !pointerStart.current) return;
  const dx = e.clientX - pointerStart.current.x;
  const dy = e.clientY - pointerStart.current.y;
  if (Math.hypot(dx, dy) > 10) return; // was a swipe, not a tap
  incrementCount(dhikrIndex);
  triggerHaptic();
  pointerStart.current = null;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `stroke-dashoffset` math for SVG rings | `motion.circle` + `pathLength` (0–1) | Motion 6+ (Framer Motion era) | No manual circumference calculation; declarative animation |
| `click` event for tap counting | `pointerup` with `touch-action: manipulation` | Pointer Events Level 2 (~2018, now universal) | Eliminates 300ms tap delay on mobile; unified across touch/mouse |
| `100vh` for mobile full-screen | `100dvh` (dynamic viewport height) | CSS spec shipped ~2022; broad support 2023+ | No height jump when browser chrome shows/hides |
| Wake Lock per-page acquire only | Wake Lock + `visibilitychange` re-acquire | MDN recommendation (Baseline 2025) | Screen stays awake after tab switch + return |
| Swipe via `touchstart`/`touchend` | Motion `drag="x"` + `onDragEnd` with velocity | Motion v10+ | Handles physics, momentum, and elastic constraints declaratively |

**Deprecated/outdated approaches to avoid:**
- `framer-motion` import: use `motion/react` (the package was renamed — `motion` is the current package, already installed)
- `react-circular-progressbar` for rings: overkill when `motion.circle` pathLength is available
- `navigator.vibrate` as primary feedback: treat as enhancement only; visual pulse is required as co-equal fallback

---

## Open Questions

1. **Exact Arabic text of the 4 adhkar**
   - What we know: The 4 dhikr are identified in REQUIREMENTS.md (hasbi/hasbiyallah, istighfar, la ilaha illallah, salawat) and their targets (200/200/100/100 full; 20/20/10/10 shortened) are locked
   - What's unclear: The precise wording of each dhikr as the owner wants it rendered (Arabic text is sensitive to variant wordings and harakat)
   - Recommendation: The planner should include a task asking the owner to confirm/correct the Arabic text in `lib/data/adhkar.ts` before any other task in the phase begins, OR use widely-recognized standard wordings as placeholders with a clear confirmation checkpoint

2. **Completion moment design for COMP-03**
   - What we know: Must be "calm, dignified, no confetti or gamification" (REQUIREMENTS.md)
   - What's unclear: Specific visual — is it a full-screen overlay, a ring color change, a soft glow, or a toast? Duration? Dismissible or auto-dismiss?
   - Recommendation: The planner should note this as a discretionary design decision. A safe default: when all 4 counts >= target, show a full-screen centered overlay with a brief Arabic phrase (e.g., "تقبل الله") and "May Allah accept" — fades in via `motion` animate, tap to dismiss. No sound, no animation beyond a gentle fade + scale.

3. **Counter page routing**
   - What we know: `app/page.tsx` is currently the placeholder ("coming soon")
   - What's unclear: Does Phase 1 replace `app/page.tsx` entirely with the counter, or add a new route (e.g., `app/counter/page.tsx`)?
   - Recommendation: Replace `app/page.tsx` directly with the counter — there is no reason for a splash page in the MVP. This is the simplest routing decision. The planner should decide and note it.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 (already installed and configured) |
| Config file | `vitest.config.mts` (exists at repo root) |
| Quick run command | `npm run test:run` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COUNT-01 | Dhikr data file exports 4 entries with Arabic, transliteration, translation | unit | `npm run test:run -- lib/data/adhkar.test.ts` | Wave 0 (new file) |
| COUNT-03 | `incrementCount(index)` adds 1 to the correct dhikr count | unit | `npm run test:run -- lib/store/sessionStore.test.ts` | Wave 0 (new file) |
| COUNT-04 | `getTarget(entry, "full")` and `getTarget(entry, "shortened")` return correct values | unit | `npm run test:run -- lib/data/adhkar.test.ts` | Wave 0 (new file) |
| COUNT-05 | Progress value clamps at 1 when count > target | unit | `npm run test:run -- lib/data/adhkar.test.ts` | Wave 0 (new file) |
| COUNT-07 | Full mode targets: 200/200/100/100; Shortened: 20/20/10/10 | unit | `npm run test:run -- lib/data/adhkar.test.ts` | Wave 0 (new file) |
| COUNT-08 | Session store persists + rehydrates counts across simulated page reloads | unit (existing) | `npm run test:run` | Covered by Phase 0 store tests (manual verified) |
| COUNT-02 | Swipe deck advances/retreats activeIndex on drag | smoke (manual) | `npm run dev` + swipe on device | N/A — gesture testing is manual-only |
| COUNT-09 | Wake lock acquired on counter mount; released on unmount | smoke (manual) | Check DevTools → Application → Wake Lock status | N/A — platform API, manual verification |
| COUNT-10 | Haptic fires on Android; silent fallback on iOS | smoke (manual) | Test on real device | N/A — device-specific |
| COMP-03 | Completion overlay shows when all 4 counts reach target | smoke (manual) | Tap to target on all 4 dhikr | N/A — visual UI |
| SET-01 | `useSettingsStore.defaultMode` persists across simulated reloads | unit | `npm run test:run -- lib/store/settingsStore.test.ts` | Wave 0 (new file — if not already covered) |

### Sampling Rate
- **Per task commit:** `npm run test:run` (all unit tests green)
- **Per wave merge:** `npm run test:run` + `npm run build`
- **Phase gate:** Full suite green + `npm run build` + manual smoke on a real mobile device

### Wave 0 Gaps

- [ ] `lib/data/adhkar.ts` — static dhikr data (not a test file, but a required artifact before any tests)
- [ ] `lib/data/adhkar.test.ts` — validates data shape and target values for COUNT-01, COUNT-04, COUNT-05, COUNT-07
- [ ] `lib/store/sessionStore.test.ts` — validates `incrementCount` behavior for COUNT-03 (the store exists but has no unit test yet)
- [ ] `lib/store/settingsStore.test.ts` — validates `setDefaultMode` persistence for SET-01 (same: store exists, no test)

*(No new framework install needed — Vitest and jsdom are already configured from Phase 0.)*

---

## Sources

### Primary (HIGH confidence)
- [motion.dev/docs/react-drag](https://motion.dev/docs/react-drag) — verified 2026-05-30 — drag API: `drag="x"`, `dragConstraints`, `dragMomentum`, `onDragEnd` info object (offset, velocity)
- [motion.dev/docs/react-svg-animation](https://motion.dev/docs/react-svg-animation) — verified 2026-05-30 — `pathLength` on `motion.circle`; supported elements list; 0–1 normalization
- [developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) — verified 2026-05-30 — acquire/release API, `visibilitychange` re-acquire pattern, Baseline 2025 support
- [developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) — WebSearch verified 2026-05-30 — iOS Safari does not support Vibration API; feature-detect required
- Phase 0 VERIFICATION.md — confirms `useSessionStore` (all 6 actions), `useSettingsStore` (2 actions), and `StoreHydration` are fully implemented and verified

### Secondary (MEDIUM confidence)
- [fonts.google.com/noto/specimen/Noto+Naskh+Arabic](https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic) — WebSearch verified 2026-05-30 — Noto Naskh Arabic supports harakat; available in `next/font/google` via `Noto_Naskh_Arabic`
- [fonts.google.com/specimen/Amiri](https://fonts.google.com/specimen/Amiri) — WebSearch verified 2026-05-30 — alternative Arabic font with Quranic mark support; good for classical text

### Tertiary (LOW confidence)
- Pitfall 1 (swipe vs tap conflict) — derived from general pointer events knowledge + .planning/research/PITFALLS.md Pitfall 9; needs runtime validation on real mobile device
- Pitfall 7 (pathLength lag at high tap rate) — derived from motion animation behavior; exact threshold (0.15s transition) is an estimate to validate during development

---

## Metadata

**Confidence breakdown:**
- Standard stack (no new deps): HIGH — all libraries already installed; APIs verified against official docs
- Motion drag swipe deck: HIGH — official motion docs verified
- Motion pathLength ring: HIGH — official motion docs verified, supported elements list confirmed
- Wake Lock hook: HIGH — MDN official docs, Baseline 2025 confirmed
- Arabic font (Noto Naskh): MEDIUM — Google Fonts availability confirmed; exact `next/font/google` export name (`Noto_Naskh_Arabic`) derived from naming convention, to be confirmed with `import { Noto_Naskh_Arabic } from "next/font/google"`
- Swipe vs tap discrimination: MEDIUM — logic is sound but exact threshold (10px) is a starting estimate
- pathLength ring transition duration: LOW — 0.15s is a best estimate; validate at high tap rates during development

**Research date:** 2026-05-30
**Valid until:** 2026-08-30 (motion API is stable; Wake Lock is now Baseline 2025; Arabic font availability is stable)
