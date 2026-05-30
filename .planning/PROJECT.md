# wird al-asas

## What This Is

A mobile-first daily dhikr tracker for the wird al-asas — a foundational Islamic devotional litany of four adhkar recited each day. The app lets you tap-count each dhikr with a focused full-screen interface, tracks your completion history and streaks, and resets daily at Fajr time.

## Core Value

Completing the wird al-asas every day without losing count or losing your place.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Display the 4 adhkar (Arabic text, transliteration, translation) one at a time, swipeable
- [ ] Full-screen tap area increments count; circular progress ring fills toward target
- [ ] Two modes — Full (200/200/100/100) and Shortened (20/20/10/10) — with a settable default and per-session override
- [ ] Tapping past target allowed; completion mark appears at target but counting continues
- [ ] Each dhikr tracked independently (any order)
- [ ] Progress persists if app is closed mid-count (resume from saved count)
- [ ] Day resets at Fajr time based on device location
- [ ] Full completion = all 4 adhkar hit their target
- [ ] Partial completion tracked and displayed differently in history (faded/distinct color)
- [ ] History view: current streak + longest streak + calendar heatmap
- [ ] Fajr push notification to prompt the daily wird
- [ ] Local-only storage — no account or login required
- [ ] Works offline

### Out of Scope

- User accounts / cloud sync — local-first, no Supabase auth
- Custom dhikr — fixed to these 4 adhkar only
- Social or sharing features
- Multiple wirds or custom liturgies

## Context

**The 4 adhkar (in order):**

| # | Arabic | Transliteration | Full | Shortened |
|---|--------|-----------------|------|-----------|
| 1 | حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ | Hasbuna 'llāhu wa ni'ma 'l-wakīl | 200× | 20× |
| 2 | أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ | Astaghfiru 'llāha 'l-'Aẓīm | 200× | 20× |
| 3 | لَا إِلَهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ | Lā ilāha illā 'llāhu 'l-Maliku 'l-Ḥaqqu 'l-Mubīn | 100× | 10× |
| 4 | اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ | Allāhumma ṣalli 'alā sayyidinā Muḥammadin wa 'alā ālihi wa ṣaḥbihi wa sallim | 100× | 10× |

**UX decisions captured:**
- One dhikr at a time (swipe navigation), not a list/grid
- Circular progress ring around the count number
- Full-screen is the tap target — no small button
- No undo tap (keep it simple)
- Screen should stay awake while counting

**Tech environment:**
- Next.js 15 + React 19 + TypeScript (starter template already in place)
- Tailwind v4 + shadcn/ui, mobile-first
- Local storage (localStorage / IndexedDB) for persistence — Supabase auth not used
- PWA capabilities needed for: offline support, push notifications, screen wake lock
- Prayer time API needed for Fajr calculation (e.g. Aladhan API)

## Constraints

- **Platform**: Mobile-first web app (phone is primary device)
- **Auth**: None — local storage only, no backend account system
- **Offline**: Must work without internet (except initial prayer time fetch)
- **Arabic rendering**: RTL text must render correctly with appropriate font

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-only storage | No account friction; personal devotional practice | — Pending |
| Fajr-based day reset | Aligns with Islamic day boundary | — Pending |
| One-at-a-time swipe UI | Focused, distraction-free counting experience | — Pending |
| PWA over native app | Fastest to build on existing Next.js starter | — Pending |
| Muslim World League prayer method hardcoded | Fajr used only as a rough day boundary; not worth exposing a setting for this precision | — Pending |
| Push notifications out of scope | iOS requires both installed PWA and a server; too much complexity for v1 | — Pending |

---
*Last updated: 2026-05-29 after initialization*
