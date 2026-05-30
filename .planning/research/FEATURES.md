# Feature Landscape: Dhikr / Tasbih / Wird Tracker

**Domain:** Mobile-first Islamic devotional counter (PWA)
**Overall confidence:** MEDIUM (training data on known apps: Muslim Pro, Tasbih Fingertips, Tasbih Dhikr & Dua Counter, Athan, Pillars, Quran Majeed, Kalimah)

---

## Table Stakes (must have or users leave)

| Feature | Why expected | Complexity | Notes |
|---|---|---|---|
| Large, forgiving tap target | Core interaction; users count while reciting, often not looking at screen | Low | Full-screen tap already specced |
| Clear, large count number | Users glance to confirm progress | Low | Center of ring |
| Haptic feedback on tap | Most-cited "feels right" feature in tasbih apps; replaces click of physical beads | Low–Med | **iOS Safari does NOT support Vibration API** — needs visual/scale pulse fallback |
| Optional tap sound | Bead-click audio cue; many users toggle this | Low | Must be toggleable; default off |
| Target/goal per dhikr with completion signal | Users count to a set number; needs to know when reached | Low | Ring + completion mark — already specced |
| Progress persists across app close/reopen | Losing count is the #1 frustration | Med | Already specced; use IndexedDB, write debounced on every tap |
| Screen stays awake while counting | Screen sleeping mid-count is a top complaint | Med | Wake Lock API — **iOS Safari 16.4+ supports it**; needs re-acquire on visibility change |
| Works offline | Devotional use anywhere (mosque, travel, no signal) | Med | PWA service worker; already specced |
| Correct Arabic RTL rendering with quality Arabic font | Mis-rendered Arabic is a trust-breaker for this audience | Med | Use vetted Arabic webfont (Amiri, Scheherazade, Noto Naskh Arabic); test diacritics/tashkeel |
| Daily reset of counts | A daily wird must start fresh each day | Med | Specced as Fajr-based |
| Don't-lose-count guarantee | Trust foundation of the whole category | Med | Persistence + no accidental reset |

---

## Differentiators (competitive advantage)

| Feature | Value proposition | Complexity | Notes |
|---|---|---|---|
| Fixed, curated wird (the 4 adhkar) | Most apps are generic counters; purpose-built tracker removes setup friction entirely | Low | **Core differentiator — lean into it** |
| Fajr-aligned day boundary | Aligns reset with Islamic day rather than midnight; feels theologically correct | Med | Aladhan API; needs location + offline cache of times |
| Full vs Shortened mode with per-session override | Meets users on heavy and light days; reduces guilt/abandonment | Low | Already specced |
| Streak + longest streak + calendar heatmap | Proven habit-formation pattern (GitHub/Duolingo); strong retention driver | Med | Heatmap needs compact mobile-friendly grid |
| Partial-completion tracking (distinct from full) | "I did some" beats binary done/not-done; reduces streak anxiety | Med | Already specced; faded color in history |
| Resume-in-place across all 4 adhkar (any order) | Respects real recitation flow | Med | Per-dhikr independent state |
| Transliteration + translation display | Serves non-Arabic readers and learners | Low | Already implied in spec |
| Gentle, non-gamified completion celebration | Calm "completion" moment fits devotional tone better than confetti | Low | Soft ring fill, checkmark, subtle haptic |
| Fajr push notification | Re-engagement aligned to natural prayer time | Med–High | **iOS requires app be installed to Home Screen (Safari 16.4+)** |

---

## Anti-Features (deliberately NOT build for v1)

| Anti-feature | Why avoid |
|---|---|
| User accounts / cloud sync | Friction, backend cost, contradicts local-first decision |
| Custom dhikr / multiple wirds | Scope creep; dilutes focused product |
| Social feed / sharing / leaderboards | Turns private worship into performance; riya' concern |
| Undo / decrement button | Adds clutter to tap surface; spec already excludes |
| Heavy gamification (badges, XP, mascots) | Cheapens devotional intent; can feel disrespectful |
| Ads / paywalls | Erodes trust for a spiritual tool |
| In-app Quran / prayer-times / qibla suite | Scope bloat; do one thing well |
| Configurable arbitrary targets | The wird's targets are fixed |
| Audio recitation playback | Large assets, licensing, out of scope |

---

## UX Patterns Specific to Counter Apps

**What makes counting feel right:**
- Immediate feedback on every tap (haptic + slight number scale/pulse + ring tick). Latency or dropped taps feel broken — debounce persistence writes, not the visual.
- Full-screen tap with no precision required; never make the user aim.
- No accidental resets: any reset must be deliberate and confirmed.
- Milestone micro-feedback (e.g. stronger pulse at target) is common and well-received.
- Count legible at arm's length: high contrast, large numerals.

**Completion celebration (calm, not loud):**
- Ring fills and locks; soft checkmark or subtle glow at target.
- Allow counting to continue past target (already specced) — reciters often overshoot intentionally.
- Whole-wird completion (all 4): single gentle, dignified moment (soft fade, brief du'a line, subtle haptic) — not confetti.

**Streak display:**
- Show current streak prominently, longest streak secondary.
- Calendar heatmap with 2–3 intensity levels: full completion, partial, none.
- Partial preserves a "soft" grace state to reduce abandonment guilt (product decision needed).

---

## Feature Dependencies

```
Fajr push notification  → Prayer time API + location + PWA install (iOS requirement)
Daily reset at Fajr     → Prayer time API + cached times for offline
Streak / heatmap        → Daily completion records (daily reset + partial/full status)
Partial vs full status  → Per-dhikr target tracking
Resume mid-count        → Persistent storage (IndexedDB)
Wake lock + haptics     → PWA + platform capability checks (iOS gaps)
Offline                 → Service worker + cached prayer times
```

---

## MVP Priority Order

**Spine (table stakes):**
1. Full-screen tap counter with ring, large count, per-dhikr targets, swipe between 4 adhkar
2. Haptic + visual tap feedback (with iOS visual fallback) and screen wake lock
3. Persistence/resume + offline (IndexedDB + service worker)
4. Fajr-based daily reset (Aladhan + location, cached) and Full/Shortened modes

**High-leverage differentiators:**
5. Streak + longest streak + calendar heatmap with partial/full distinction
6. Fajr push notification (last — heaviest, most platform-fragile)

---

## Open Questions

- Streak-break policy on partial days — product decision needed.
- Whether v1 ships push notifications given iOS install-to-Home-Screen requirement.
- Exact Arabic font choice and tashkeel rendering — needs device testing.

---
*Source: Training knowledge of tasbih/dhikr app ecosystem. Confidence: MEDIUM.*
