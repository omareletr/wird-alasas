# Domain Pitfalls

**Domain:** Mobile-first PWA daily dhikr (counter/tracker) app
**Researched:** 2026-05-29
**Overall confidence:** MEDIUM-HIGH (iOS PWA installation behavior verified against MDN; storage/push/RTL/prayer-time findings from established training knowledge, current through Jan 2026; some items flagged for runtime verification)

> Research note: Web search and most WebFetch tooling was unavailable in this session. iOS PWA installation constraints were verified against MDN. Remaining findings draw on documented, stable platform behavior (Safari/WebKit storage policy, Aladhan API, WebKit RTL) current through the January 2026 knowledge cutoff. Items that change frequently or are version-sensitive are explicitly flagged LOW/MEDIUM and tagged "verify at build time."

---

## Critical Pitfalls

Mistakes that cause rewrites, silent data loss, or a broken core experience.

### Pitfall 1: iOS evicts IndexedDB/localStorage after ~7 days of non-use (silent streak loss)
**Confidence:** HIGH (well-documented WebKit ITP / storage policy)
**What goes wrong:** WebKit caps script-writable storage (localStorage, IndexedDB, Cache API) for sites the user has NOT added to the Home Screen. If the user opens the app in a Safari tab and doesn't return for 7 days, all local data — including the entire streak history and current count — can be deleted. For a streak app, this is catastrophic: the user's longest streak silently vanishes.
**Why it happens:** ITP (Intelligent Tracking Prevention) treats browser-tab storage as cache, not durable data. The 7-day cap applies to *browser* usage. Crucially, this cap is **lifted once the PWA is installed to the Home Screen** (standalone mode).
**Consequences:** Total loss of streak history; the app's single core value ("never lose your place / your streak") is destroyed.
**Prevention:**
- Make Home Screen installation a first-class, strongly-encouraged onboarding step. Detect `display-mode: standalone`; if not installed, show a persistent (but dismissible) "Add to Home Screen for your streak to be saved" prompt with iOS Share-sheet instructions (iOS has no `beforeinstallprompt`).
- Call `navigator.storage.persist()` early and surface the result. (Note: on iOS this is best-effort and historically less reliable than Chrome; treat it as defense-in-depth, not a guarantee.)
- Provide a manual JSON export/import escape hatch so a determined user can never permanently lose history. Cheap insurance against eviction and against device migration.
**Detection:** Test by installing to Home Screen vs. leaving in a tab; simulate by clearing site data. Watch for "history empty on reopen" bug reports.
**Phase:** PWA installability + persistence layer phase (and onboarding phase).

### Pitfall 2: Fajr-based day boundary creates timezone/DST/midnight streak bugs
**Confidence:** HIGH (classic date-handling failure mode)
**What goes wrong:** "Day resets at Fajr" means the dhikr day does NOT align with calendar midnight. A naive implementation using `new Date().toDateString()` or UTC dates will:
- Reset at the wrong time (midnight local or UTC, not Fajr).
- Count a session done at 11:30pm and one at 2:00am as the same "day" or different "days" incorrectly.
- Break across DST transitions (a day that is 23 or 25 hours long).
- Break when the user travels across timezones (Fajr time and offset both change).
**Why it happens:** Storing/keying days by calendar date instead of by "devotional day" defined as [Fajr_today, Fajr_tomorrow). Mixing UTC and local time. Comparing `Date` objects by `.getDate()`.
**Consequences:** Streaks increment or break incorrectly; "today" shows the wrong dhikr session; user loses trust ("I did it but it says I missed").
**Prevention:**
- Define a single canonical function: `getDevotionalDay(now, location) -> dayKey`. The dayKey is the calendar date of the Fajr that *opened* the current window. If `now < today's Fajr`, the devotional day is *yesterday's* date.
- Store completion records keyed by this `dayKey` (e.g., `"2026-05-29"`), not by timestamp alone. Also store the raw timestamp for audit.
- Use a vetted date library for timezone arithmetic (Luxon, or `Temporal` if polyfilled) — never hand-roll offset math.
- Decide and document the travel policy: use the device's *current* location/timezone for "today's" Fajr. Persist the timezone with each record so historical days aren't retroactively recomputed.
- Test explicitly: just-before-Fajr, just-after-Fajr, DST spring-forward, DST fall-back, timezone change mid-streak.
**Detection:** Unit tests around the Fajr boundary; QA crossing midnight and Fajr; check streak after a DST weekend.
**Phase:** Day-boundary / streak-engine phase (foundational — many features depend on `getDevotionalDay`).

### Pitfall 3: Streak logic mishandles "missed a day" and partial completions
**Confidence:** HIGH
**What goes wrong:** Ambiguous rules produce wrong streaks:
- Is a *partial* completion (not all 4 adhkar hit target) a streak-continuing day or a break? PROJECT.md says partial is tracked and displayed differently — so the rule must be explicit: partial does NOT continue the streak (only full completion does), but is still recorded.
- "Current streak" computed from "today" when today isn't done yet: should not show 0 mid-morning if yesterday was completed (grace until the day's Fajr window closes).
- Backfilling: if the user opens the app two days late, the streak should already be broken; don't silently let them "catch up."
- Off-by-one at the boundary (streak counts today twice, or resets a still-valid streak).
**Why it happens:** Streak computed ad hoc on render instead of from a deterministic pass over the records keyed by `dayKey`.
**Prevention:**
- Compute streaks as a pure function of the completion-record list: walk backward from the current devotional day; a streak is an unbroken run of *full-completion* days ending at today or yesterday.
- Define and unit-test the exact rules: full = continues; partial = recorded but breaks the streak (or define "freeze" if desired — but decide deliberately); no record = breaks.
- "Current streak" = longest run ending at (today if today is full) else (yesterday if yesterday is full) else 0.
- Longest streak = max over history; persist it so it's never recomputed-down by a bug.
**Detection:** Property-based / table-driven tests over synthetic record sequences including gaps, partials, and boundary days.
**Phase:** Streak-engine phase (shares foundation with Pitfall 2).

### Pitfall 4: iOS Web Push only works when installed to Home Screen, and cannot be scheduled locally
**Confidence:** HIGH (verified pattern; Safari 16.4+ enabled Web Push for Home Screen web apps only)
**What goes wrong:** Two distinct traps:
1. On iOS, Web Push (and the Notifications permission prompt) is **only available when the PWA is installed to the Home Screen and running in standalone mode** — NOT in a Safari tab. Requesting permission in-tab silently fails / the API is absent. Also, the permission request must be tied to a user gesture.
2. There is **no reliable client-side scheduled/local notification API** on the web. The "Fajr notification" cannot be a `setTimeout`/`showNotification` scheduled days in advance from the client — service workers are not kept alive, and `Notification Triggers`/`showTrigger` is not broadly supported (and not on iOS). A daily Fajr reminder fundamentally requires **a server (or push service) that sends a push at the right time**, OR a much weaker best-effort approach.
**Why it happens:** Developers assume web push == native local notifications. iOS especially diverges from Android/Chrome.
**Consequences:** The Fajr reminder feature silently doesn't fire, or only fires when the app is open. Users miss their wird — defeating a key feature.
**Prevention:**
- Treat the Fajr notification as requiring a **push backend** (a small serverless function + a push subscription store + a cron/scheduler that computes each user's Fajr time and sends a push). PROJECT.md says "no account / local-only" — reconcile this: an *anonymous push subscription* (no login) can still be stored server-side keyed by the push endpoint. This is the only path to reliable scheduled notifications and should be called out in the roadmap as a backend dependency, contradicting the "purely local" assumption.
- Gate the notification UI behind `display-mode: standalone` AND iOS-installed detection; only request permission after install, on a tap.
- If a backend is truly out of scope for v1, ship notifications as explicitly "best-effort, only on supported platforms" and consider an Android/desktop-only push, plus an in-app reminder when opened — set user expectations honestly.
- VAPID keys, subscription expiry/renewal, and `pushsubscriptionchange` handling are required for any push backend.
**Detection:** Test on a real iPhone (simulator does not fully represent push); verify the permission prompt only appears installed.
**Phase:** Notifications phase — flag as needing deeper architecture research; it likely forces a minimal backend decision.

### Pitfall 5: Service worker / Next.js caching serves stale app or breaks offline incorrectly
**Confidence:** MEDIUM-HIGH (verify exact tooling at build time)
**What goes wrong:**
- Aggressive precaching serves a stale build after deploy; users are stuck on old JS/CSS and never see fixes ("ghost" old version).
- Caching the prayer-time API response forever means Fajr times never update for the new day/month.
- Next.js App Router emits hashed/versioned assets and uses streaming/RSC; a hand-rolled or misconfigured service worker can cache HTML or RSC payloads incorrectly and break navigation or hydration offline.
- A registered SW that never updates `skipWaiting`/`clients.claim()` leaves two versions live.
**Why it happens:** Copy-pasted Workbox config; caching strategy not matched to resource type.
**Prevention:**
- Use a maintained integration (e.g., `@serwist/next`, the current successor to `next-pwa`) rather than hand-rolling — verify the package's Next.js 15 / App Router compatibility at build time (MEDIUM confidence on specific package).
- Apply correct strategies per resource: precache the app shell (stale-while-revalidate or cache-first with versioning), but use **network-first with short TTL** for prayer-time data, and cache only the *static* dhikr content aggressively.
- Implement an "update available — reload" prompt (listen for new SW `waiting`), so users escape stale builds.
- Disable the SW in development to avoid debugging confusion.
**Detection:** Deploy twice and confirm clients update; test offline cold-load; confirm prayer times roll over to a new day offline-cached value.
**Phase:** PWA / offline phase.

---

## Moderate Pitfalls

### Pitfall 6: Prayer-time accuracy, calculation-method, and offline gaps (Aladhan)
**Confidence:** MEDIUM-HIGH
**What goes wrong:**
- Fajr time depends heavily on the **calculation method** (MWL, ISNA, Umm al-Qura, Egyptian, etc.) and the **Fajr angle** (e.g., 18° vs 15°). The same location yields Fajr times that differ by 20+ minutes across methods. Picking a wrong/default method makes the reset "feel wrong" to users who follow a specific convention.
- High-latitude locations have no true Fajr on some days; the API/method must apply a high-latitude rule, or computation returns null/odd values.
- The app needs Fajr offline, but Aladhan is a network call. Fetching only "today" means a day with no connectivity has no reset time.
- Hitting the API on every app open is wasteful and fails offline.
**Prevention:**
- Let the user pick a calculation method (sensible default by region) — or at minimum store and reuse one consistent method so the boundary is stable.
- Fetch a **monthly calendar** of prayer times (Aladhan supports a calendar endpoint) and cache it locally; refetch when the cache is near expiry or location changed materially. This gives offline-correct Fajr for ~a month.
- Handle high-latitude rule selection and null Fajr gracefully (fallback boundary).
- Store the resolved Fajr alongside each completion record's `dayKey` so history stays stable.
**Detection:** Compare app Fajr against a known local source for the user's method; test offline after caching the month.
**Phase:** Prayer-time / day-boundary phase.

### Pitfall 7: Location permission handling (denial, drift, privacy)
**Confidence:** HIGH
**What goes wrong:**
- Geolocation requires a user gesture and HTTPS; on iOS the prompt and accuracy are restrictive. If the user denies, the app has no location → no Fajr → no reset. Many apps then break entirely.
- Requesting location on first launch (before explaining why) tanks grant rates.
- Continuous/high-accuracy watching drains battery; not needed for a city-level Fajr time.
- A cached location from a previous city silently gives wrong Fajr after travel.
**Prevention:**
- Request location *after* explaining why ("to calculate your local Fajr"), on a tap, not on cold start.
- Provide a manual fallback: city search / lat-long entry so a denied permission doesn't brick the app.
- Use a single low-accuracy fetch (city-level is enough), cache it, and re-request only on explicit "update location."
- Detect significant location change and prompt to refresh prayer times.
**Detection:** Test denied-permission path end to end; verify the app still functions (with manual location).
**Phase:** Location / prayer-time phase.

### Pitfall 8: Screen Wake Lock is unreliable / leaks (counting screen sleeps or stays on forever)
**Confidence:** MEDIUM-HIGH
**What goes wrong:**
- `navigator.wakeLock.request('screen')` requires a secure context and a user gesture, and the lock is **automatically released when the tab loses visibility** (backgrounded, screen off). It must be **re-acquired on `visibilitychange`** when returning, or the screen sleeps mid-count.
- iOS support arrived relatively late and can be flaky in non-installed Safari; treat as best-effort.
- Forgetting to release the lock (or holding it on screens where counting isn't happening) keeps the screen on, draining battery.
- No graceful fallback when the API is unavailable.
**Prevention:**
- Acquire the wake lock only on the active counting screen; release it on navigate-away and on `pagehide`.
- Re-acquire on `visibilitychange` → visible.
- Feature-detect and degrade silently if unavailable (don't crash).
**Detection:** Lock the phone mid-count and return; navigate away and confirm release; test on a real iPhone.
**Phase:** Counting-screen / interaction phase.

### Pitfall 9: Tap counter — accidental taps, double-counts, swipe conflicts, and lost taps at high rate
**Confidence:** MEDIUM-HIGH
**What goes wrong:**
- Full-screen tap area + swipe navigation conflict: a fast tap is interpreted as a swipe, or a swipe registers a tap, mis-counting or changing dhikr unintentionally.
- Mobile `click` has ~300ms delay or "ghost click" double-firing if both `touchend` and `click` are handled → double counts. Rapid tapping can also drop events if state updates are heavy.
- Re-rendering the whole screen on every increment (heavy React tree, ring animation) causes jank and dropped taps at high tap rates (users tapping 3-5/sec toward 200).
- No undo (by design) means any accidental count is permanent — raising the cost of accidental/double taps.
- Pull-to-refresh / iOS rubber-band scroll or text selection triggered by rapid tapping in the tap zone.
**Prevention:**
- Use Pointer Events (`pointerup`) as the single source of truth; do not also handle `click`. Set a small movement threshold to distinguish tap from swipe; dedicate horizontal-swipe to navigation with a clear gesture handler.
- Keep increment cheap: update a single counter atom/ref and animate the ring via CSS/transform driven by a value, not by re-rendering the dhikr text. Decouple display from the hot path.
- Disable text selection, double-tap zoom, and overscroll/pull-to-refresh on the tap surface (`touch-action: manipulation`, `user-select: none`, `overscroll-behavior: contain`, viewport `maximum-scale`).
- Persist count incrementally (debounced) so closing mid-count resumes (PROJECT.md requirement).
- Consider light haptic feedback (where supported) for tap confirmation; consider a tiny dead-zone or debounce only if double-counts are observed — but don't add latency that loses fast taps.
**Detection:** Tap-rate stress test (hold a finger drumming); test on a low-end Android; verify swipe vs tap doesn't misfire; confirm count survives app kill.
**Phase:** Counting / interaction phase.

### Pitfall 10: Arabic/RTL rendering bugs in React/Next.js
**Confidence:** HIGH
**What goes wrong:**
- Arabic letters not joining (appearing as isolated/disconnected forms) because the chosen font lacks proper Arabic shaping or a fallback font is used — looks broken to Arabic readers.
- Diacritics (tashkeel/harakat) in the dhikr text rendering misaligned, clipped, or with wrong line-height; the PROJECT.md adhkar are fully voweled, so this matters.
- Mixed LTR/RTL (Arabic + transliteration + Latin numerals + the count) causing bidi reordering surprises — punctuation, parentheses, and numbers appearing on the wrong side.
- React string concatenation / interpolation breaking bidi runs; missing `dir="rtl"` and `lang="ar"` on the Arabic element.
- Whole-app RTL layout flips harming the mostly-LTR chrome, or icons/progress not mirroring as intended; logical vs physical CSS confusion (margin-left vs margin-inline-start).
- Tailwind v4 utilities applied physically (left/right) instead of logical (start/end) breaking under RTL.
**Prevention:**
- Set `lang="ar"` and `dir="rtl"` on the Arabic text containers specifically (not necessarily the whole app — the UI chrome is likely LTR). Use per-element dir, or Unicode isolation, for mixed content.
- Ship a known-good Arabic webfont with full shaping + tashkeel support (e.g., Amiri, Scheherazade New, or a quality Naskh font) and `font-display: swap`; verify glyph joining and harakat positioning on-device, not just desktop.
- Wrap counts/numbers and transliteration so bidi doesn't reorder them unexpectedly; test with Eastern vs Western Arabic numerals decision made explicitly.
- Prefer CSS logical properties (`margin-inline-start`, `text-align: start`) and Tailwind's logical/`rtl:` variants.
- Set adequate `line-height` for voweled Arabic so diacritics aren't clipped.
**Detection:** Native Arabic reader review on a real device; check letter joining and harakat; test the mixed Arabic+number lines.
**Phase:** UI / content-display phase (early — it shapes the typography system).

### Pitfall 11: localStorage vs IndexedDB choice and migration/versioning
**Confidence:** HIGH
**What goes wrong:**
- Using `localStorage` for growing history: it's synchronous (blocks the main thread, hurting tap responsiveness), ~5MB-capped, and string-only — fine for settings, poor for a growing record set.
- No schema version field → a later data-model change (e.g., adding partial-completion fields, method-per-day) corrupts or can't read old records.
- `JSON.parse` on corrupted/partial data throwing and bricking app load.
- Multiple tabs writing concurrently to IndexedDB without care.
**Prevention:**
- Settings (mode default, method, location) → `localStorage` is fine. **History/streak records → IndexedDB** (async, larger, structured). Consider a thin wrapper (e.g., `idb` / `idb-keyval` / Dexie) — verify maintenance status at build time.
- Add a top-level `schemaVersion` and a migration function run on load; never assume the stored shape.
- Wrap all reads in try/catch with a safe default; never let a parse error block the counting UI.
- Keep the data model small and append-only-ish (one record per devotional day) to simplify migration.
**Detection:** Write a record on an old schema, upgrade, confirm migration; corrupt a record and confirm graceful recovery.
**Phase:** Persistence-layer phase (foundational).

---

## Minor Pitfalls

### Pitfall 12: PWA manifest / icon / install-prompt mistakes
**Confidence:** HIGH
**What goes wrong:** Missing maskable icons (icon looks cropped/ugly on Android), missing `apple-touch-icon` and iOS meta tags (no proper Home Screen icon/splash on iOS, since iOS partly ignores the manifest), wrong `display: standalone`, missing `theme-color`, no iOS-specific status bar handling. Result: a sloppy installed experience.
**Prevention:** Provide full icon set incl. maskable + `apple-touch-icon`; set `apple-mobile-web-app-capable`/status-bar meta; test installed appearance on a real iPhone and Android. Verify Next 15 metadata API handles the manifest + apple tags.
**Phase:** PWA installability phase.

### Pitfall 13: Safe-area insets and notch/home-indicator overlap on full-screen UI
**Confidence:** HIGH
**What goes wrong:** A full-screen tap surface puts the count or controls under the notch, dynamic island, or home indicator; in standalone iOS, content runs to the edges. Tap targets or the progress ring get partially hidden/unusable.
**Prevention:** Use `viewport-fit=cover` + `env(safe-area-inset-*)` padding; keep interactive controls out of the home-indicator zone.
**Phase:** Counting-screen / layout phase.

### Pitfall 14: Number formatting and Arabic numerals confusion
**Confidence:** MEDIUM
**What goes wrong:** Displaying counts toward 200/100 — mixing Western (123) and Eastern Arabic (١٢٣) numerals inconsistently, or `toLocaleString` under `ar` locale flipping numerals unexpectedly across the app.
**Prevention:** Decide one numeral system for counts explicitly and force it (don't let locale guess); keep the count display fast and isolated from locale machinery.
**Phase:** Counting-screen phase.

### Pitfall 15: 100vh / mobile viewport height jumps with browser chrome
**Confidence:** HIGH
**What goes wrong:** `100vh` on mobile includes the area under the dynamic browser toolbar; the full-screen counter shifts/jumps as the URL bar shows/hides, moving the tap target.
**Prevention:** Use `100dvh` (dynamic viewport units) for the full-screen surface; test scroll/no-scroll behavior. Lock the counting screen from scrolling.
**Phase:** Counting-screen / layout phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Persistence layer | iOS 7-day eviction; localStorage misuse; no schema version | IndexedDB + `persist()` + export; schemaVersion + migrations; encourage install (Pitfalls 1, 11) |
| Day boundary / streak engine | Fajr-boundary timezone/DST bugs; ambiguous partial/missed rules | Canonical `getDevotionalDay`; pure streak function; exhaustive boundary tests (Pitfalls 2, 3) |
| Prayer time | Wrong calc method; offline gap; high-latitude null | Method picker + monthly cached calendar + high-lat rule (Pitfall 6) |
| Location | Denied permission bricks app | Explain-then-ask; manual city fallback (Pitfall 7) |
| Counting / interaction | Tap/swipe conflict; double-count; jank at high tap rate; wake lock leak | Pointer events only; cheap increments; gesture separation; re-acquire wake lock on visibility (Pitfalls 8, 9) |
| Notifications | iOS push needs install + cannot schedule client-side | Push backend + anonymous subscription; gate behind standalone; set expectations (Pitfall 4) — **flag for deeper research** |
| PWA / offline | Stale-build caching; bad SW strategy per resource | Maintained Serwist integration; per-resource strategies; update prompt (Pitfalls 5, 12) |
| UI / content (Arabic) | Letter non-joining; harakat clipping; bidi reorder | Quality Arabic font; per-element dir/lang; logical CSS; native review (Pitfall 10) |

---

## Cross-Cutting Flags for the Roadmap

1. **The "local-only, no backend" constraint conflicts with reliable Fajr push notifications on iOS.** A scheduled daily push fundamentally needs a server (anonymous push subscriptions are fine — no login required). The roadmap must either (a) add a minimal serverless push scheduler, or (b) explicitly scope notifications as best-effort/non-iOS for v1. **This needs an explicit decision and deeper research before the notifications phase.**

2. **Home Screen installation is load-bearing for BOTH iOS data durability AND iOS push.** Installation onboarding is not a nice-to-have polish item — it protects the streak (Pitfall 1) and enables notifications (Pitfall 4). Treat it as a core early phase, not an afterthought.

3. **`getDevotionalDay()` is the keystone primitive.** Persistence, streaks, history heatmap, and notifications all depend on a single correct definition of the Fajr-bounded day. Build and test it first.

---

## Sources

- MDN — Making PWAs installable (verified: iOS install constraints, no `beforeinstallprompt` on iOS, 16.3 vs 16.4 install behavior): https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable — **HIGH**
- WebKit/Safari storage policy (ITP 7-day script-writable storage cap for non-installed sites; lifted on Home Screen install) — training knowledge, current through Jan 2026 — **MEDIUM-HIGH, verify at build time**
- Safari 16.4+ Web Push for Home Screen web apps (push requires standalone install on iOS) — training knowledge — **HIGH** (well-established)
- Aladhan API calculation methods, Fajr angles, calendar endpoint, high-latitude rules — training knowledge — **MEDIUM-HIGH**
- Screen Wake Lock API behavior (released on visibility loss; secure context; iOS support caveats) — MDN-documented behavior, training knowledge — **MEDIUM-HIGH**
- WebKit Arabic shaping / bidi rendering and RTL CSS logical properties — training knowledge — **HIGH**
- Serwist (`@serwist/next`, successor to `next-pwa`) for Next.js App Router PWA — training knowledge — **MEDIUM, verify package + Next 15 compatibility at build time**

> Verification debt (web tooling unavailable this session): confirm at build time — (a) current iOS storage eviction window and `persist()` reliability on the latest iOS, (b) Serwist/Next 15 App Router compatibility and recommended caching recipe, (c) Notification Triggers support status, (d) Aladhan calendar endpoint shape and method IDs.
