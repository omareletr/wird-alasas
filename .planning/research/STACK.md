# Technology Stack

**Project:** wird al-asas (mobile-first PWA daily dhikr tracker)
**Researched:** 2026-05-29
**Mode:** Ecosystem (Stack dimension)

> **VERIFICATION CAVEAT (read first):** In this environment all external research tools
> (WebSearch, WebFetch, Context7, Bash/npm) were unavailable — only file read/write was
> permitted. Therefore **specific version numbers below could NOT be verified against live
> npm/registry data** and are derived from training knowledge (cutoff Jan 2026). They are
> marked LOW–MEDIUM confidence and **must be re-verified with `npm view <pkg> version`
> before pinning in package.json.** Architectural and "which library" recommendations are
> higher confidence because they rest on stable, well-established ecosystem facts.

---

## TL;DR Recommendation

Build this as a **pure client-side PWA** layered on the existing Next.js 15 starter. The
defining architectural decision is: **this app has no backend of its own.** Supabase auth,
SSR session middleware, and server clients are all dead weight for a local-only devotional
tracker. The "stack" is really five small, focused choices on top of the starter you already
have:

1. **Serwist** for the service worker / offline / install (the maintained successor to `next-pwa`).
2. **IndexedDB via `idb`** for persistence (not localStorage — see rationale).
3. **`adhan` (adhan-js)** for *local, offline* Fajr calculation (not a network API as the
   PROJECT.md currently assumes).
4. **`motion`** (already installed) + an SVG ring for the circular progress — no new dep.
5. **`react-activity-calendar`** for the GitHub-style heatmap; **`motion` drag** for swipe nav.

Native Web Platform APIs cover the rest: **Wake Lock API** (screen-awake), **Notifications +
Push API** (Fajr prompt), **Geolocation API** (for prayer-time latitude/longitude).

---

## Recommended Stack

### Core Framework (already in place — keep)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js (App Router) | ^15.5.x (installed) | App shell, routing | Already the starter; App Router + Client Components fine for a client-only PWA |
| React | ^19.0.0 (installed) | UI | Installed; React 19 stable |
| TypeScript | ^5 (installed) | Types | Installed, strict |
| Tailwind CSS v4 | ^4 (installed) | Styling | Installed |
| shadcn/ui + Radix | installed | UI primitives | Installed; use for Settings sheet, dialogs, toggles |
| motion | ^12.40.0 (installed) | Animation | **Reuse for the progress ring AND swipe gestures** — no new animation dep needed |
| lucide-react | ^1.17.0 (installed) | Icons | Installed |

### PWA Layer (new)
| Technology | Version (verify!) | Purpose | Why |
|------------|-------------------|---------|-----|
| `serwist` + `@serwist/next` | ~9.x *(LOW — verify)* | Service worker, offline caching, precache, install prompt | Maintained successor to the now-stale `next-pwa`; first-class Next 15 / App Router support; Workbox-based |
| Web App Manifest | n/a (static `app/manifest.ts`) | Installability, icons, standalone display | Next 15 supports a typed `manifest.ts` route — no library needed |

### Persistence (new)
| Technology | Version (verify!) | Purpose | Why |
|------------|-------------------|---------|-----|
| `idb` (Jake Archibald) | ~8.x *(LOW — verify)* | Promise-based IndexedDB wrapper | Tiny (~1KB), the de-facto standard IDB wrapper; stores daily completion records + streak history reliably and asynchronously |

### Prayer Times (new — REPLACES the assumed network API)
| Technology | Version (verify!) | Purpose | Why |
|------------|-------------------|---------|-----|
| `adhan` (adhan-js) | ~4.x *(LOW — verify)* | **Local, offline** Fajr/prayer time calculation from lat/long | Battle-tested astronomical calc used across Muslim apps; works fully offline (critical — app must work without internet); no rate limits, no API key, no privacy leak |
| Web Geolocation API | platform | Get device lat/long once for the calc | Native; no dep |

### History / Heatmap (new)
| Technology | Version (verify!) | Purpose | Why |
|------------|-------------------|---------|-----|
| `react-activity-calendar` | ~2.x *(LOW — verify)* | GitHub-style contribution heatmap for streak history | Purpose-built, dependency-light, themeable, supports custom levels (perfect for full vs partial completion coloring) |

### Gestures (new — or reuse motion)
| Technology | Version (verify!) | Purpose | Why |
|------------|-------------------|---------|-----|
| `motion` drag/pan (installed) | ^12.40.0 | Swipe between the 4 dhikr screens | **Preferred** — already installed; `<motion.div drag="x">` + `onDragEnd` velocity check covers swipe-to-paginate without a new dep |
| *(fallback)* `embla-carousel-react` | ~8.x *(LOW — verify)* | Carousel-style swipe paging | Only if motion drag proves fiddly; very mobile-smooth, used by shadcn's Carousel |

### Arabic / RTL (new — mostly config, not libraries)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `next/font/google` → **Amiri** or **Noto Naskh Arabic** | platform | Self-hosted Arabic webfont with proper harakat (vowel) rendering | `next/font` self-hosts + avoids layout shift; Amiri/Noto Naskh render tashkīl correctly, which generic system fonts often mangle |
| `dir="rtl"` + Tailwind logical props | platform | Correct bidirectional layout for Arabic dhikr text | Tailwind v4 supports logical properties (`ps-*`, `pe-*`, `text-start`); set `dir="rtl"` on the Arabic text container only (app chrome stays LTR) |

### Web Platform APIs (no dependencies)
| API | Purpose | Note |
|-----|---------|------|
| Wake Lock API (`navigator.wakeLock.request('screen')`) | Keep screen awake while counting | Re-acquire on `visibilitychange`; release when leaving counter screen |
| Notification API + Push API + service worker | Fajr push prompt | See PITFALLS — true *push* needs VAPID + a push service; a *local scheduled notification* is NOT reliably possible on the web |
| Geolocation API | Lat/long for `adhan` | Request once, cache the coords in IndexedDB |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Service worker | **Serwist** | `next-pwa` | `next-pwa` is effectively unmaintained / lagging Next 15 App Router; Serwist is the community successor |
| Service worker | **Serwist** | Hand-rolled SW + Workbox | More boilerplate, easy to get caching wrong; Serwist wraps Workbox with Next integration |
| Storage | **IndexedDB (`idb`)** | `localStorage` | localStorage is synchronous (jank), ~5MB cap, string-only (JSON.stringify tax), and easy to corrupt; IDB is async, structured, and the correct tool for date-keyed history records |
| Storage | **IndexedDB (`idb`)** | `Dexie.js` | Dexie is great but heavier than needed for a handful of object stores; `idb` is sufficient. Upgrade to Dexie only if querying grows complex |
| Prayer times | **`adhan` (local)** | Aladhan REST API | The PROJECT.md assumes a network API, but the app **must work offline**. A network dependency for the *daily reset boundary* is a reliability bug waiting to happen. Local calc is offline, instant, private, free |
| Prayer times | **`adhan`** | `praytimes.js` (PrayTimes) | adhan-js is more actively maintained and has cleaner TS-friendly API |
| Progress ring | **SVG + motion** | `react-circular-progressbar` | Avoids a dep; an SVG `<circle>` with animated `stroke-dashoffset` via motion is smoother and fully controllable. Use the lib only if you want zero custom code |
| Swipe nav | **motion drag** | `embla-carousel-react` | Reuse installed motion first; embla is the fallback |
| Swipe nav | motion drag | `react-swipeable` | Only gives handlers, no transform; motion does both |
| Heatmap | **`react-activity-calendar`** | `@uiw/react-heat-map` | Both viable; react-activity-calendar has nicer theming + level semantics for full/partial completion |
| Notifications | Web Push (VAPID) | OneSignal / Firebase Cloud Messaging | Third-party SDK + account overkill for a local-first single-user devotional app; see PITFALLS for the honest limitation |

---

## Conflicts & Cleanup vs the Existing Starter

**FLAG — the starter ships a backend stack this app does not use:**

| Installed | Status for this project | Action |
|-----------|------------------------|--------|
| `@supabase/ssr`, `@supabase/supabase-js` | **Unused** — PROJECT.md explicitly excludes accounts/cloud sync | Remove the deps and `lib/supabase/*`, `app/login`, `app/protected`, `app/auth/*`, `middleware.ts` |
| `lib/supabase/middleware.ts` + root `middleware.ts` | Session refresh on every request — pure overhead | Delete; a PWA SW + static client app needs no auth middleware |
| Netlify CSP (`netlify.toml`) allowing `*.supabase.co` | Stale once Supabase removed | Tighten CSP; **must add the geolocation/notification needs** and SW scope. If using Web Push, `connect-src` must allow your push endpoint |
| `motion` | **Keep and reuse** | Ring + swipe both use it |

> Do this cleanup as an early roadmap phase ("strip the backend / convert to client-only PWA")
> before building features, otherwise the Supabase middleware and auth routes create confusion
> and dead code paths.

**Hosting note:** Netlify is fine, but since this becomes a (near) fully static client app you
could also `output: 'export'` — *except* Serwist and a typed `manifest.ts` work cleanly with the
standard Next build, so keep the standard build and the Netlify Next plugin.

---

## Installation (verify versions before running)

```bash
# PWA + storage + domain libs
npm install serwist @serwist/next idb adhan react-activity-calendar

# (optional swipe fallback — only if motion drag is insufficient)
# npm install embla-carousel-react

# Remove unused backend stack
npm uninstall @supabase/ssr @supabase/supabase-js
```

Fonts come via `next/font/google` (no install). shadcn components via `npx shadcn@latest add ...`.

---

## Confidence Summary

| Recommendation | Confidence | Basis |
|----------------|------------|-------|
| Use IndexedDB (`idb`) over localStorage | **HIGH** | Stable platform fact; async + structured storage is correct for date-keyed history |
| Local prayer calc (`adhan`) over network API | **HIGH** | App must work offline — a network dep on the day-boundary is an architectural flaw |
| Serwist over next-pwa | **MEDIUM** | Strong ecosystem consensus through training cutoff; verify current maintenance status |
| Reuse `motion` for ring + swipe | **HIGH** | Already installed; standard motion capabilities |
| `react-activity-calendar` for heatmap | **MEDIUM** | Well-known lib; verify it still supports React 19 peer range |
| Amiri / Noto Naskh via next/font | **HIGH** | Stable; correct harakat rendering |
| Wake Lock / Notification / Geolocation APIs | **HIGH** | Stable web platform APIs |
| Web Push for *scheduled* Fajr reminder | **LOW** | Real limitation — true local scheduling unreliable on web; see PITFALLS |
| **All specific version numbers** | **LOW** | Could not verify against npm registry in this environment — re-verify before pinning |

---

## Open Questions / Flags for Roadmap

1. **Fajr notification is the riskiest requirement.** The web platform has no reliable *local
   scheduled notification* (unlike native). A daily-at-Fajr push requires a push service + a
   server tick to send it, OR degrades to "remind only while app/SW is alive." This needs a
   dedicated research/decision spike in its own phase — do NOT assume it's a simple toggle.
2. **iOS PWA caveats:** Web Push on iOS works only for *installed* (Add-to-Home-Screen) PWAs and
   Wake Lock support has historically been spotty on iOS Safari. Test on real iOS early.
3. **Day-reset logic** depends on `adhan` Fajr time + correct timezone/DST handling and a stored
   "last completed day" — verify date-boundary edge cases (travel, DST) during the history phase.
4. **Verify all versions** with `npm view <pkg> version` and check React 19 peer compatibility
   for `react-activity-calendar` and any carousel lib before committing.

## Sources

- Could not access live sources (WebSearch / WebFetch / Context7 / npm all blocked in this
  environment). All findings are from model training knowledge (cutoff Jan 2026) and the
  read-in `PROJECT.md`, `package.json`, and `CLAUDE.md`. Treat version numbers as unverified.
