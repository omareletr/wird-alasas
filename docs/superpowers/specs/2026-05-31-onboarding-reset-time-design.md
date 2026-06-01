# Onboarding + Daily Reset Time — Design Spec

**Date:** 2026-05-31
**Status:** Approved

---

## Context

The app currently calculates the daily wird reset time by requesting the user's device location, passing it to the `adhan` library, and computing the exact Fajr prayer time. While theologically precise, this creates friction (browser location permission dialog) and raises privacy concerns.

The goal is to remove location entirely and replace it with a user-controlled reset hour — defaulting to 5am local time — presented through a friendly first-launch onboarding screen.

---

## What Changes

### Removed
- `lib/hooks/useFajrRollover.ts` — replaced by a simpler reset timer hook
- `lib/hooks/useGeolocation.ts` — no longer needed
- `lib/store/settingsStore.ts` location field — replaced by `resetHour`
- `adhan` npm package — can be removed entirely

### Added
- `components/onboarding/OnboardingScreen.tsx` — first-launch screen (welcome + time picker)
- `lib/hooks/useResetTimer.ts` — schedules the daily reset at the user's chosen hour (local time), replacing `useFajrRollover`
- `resetHour: number` (0–23, default 5) in `settingsStore`
- `hasOnboarded: boolean` (default false) in `settingsStore`

### Updated
- `lib/utils/devotionalDay.ts` — use `resetHour` instead of Fajr time for day-boundary calculation
- `app/page.tsx` — render `OnboardingScreen` when `hasOnboarded` is false, main counter otherwise

---

## Onboarding Screen Design

A single full-screen experience shown once on first launch.

**Top half — welcome:**
- App name / wordmark
- Tagline: short, warm, one line (e.g. *"Your daily wird, beautifully simple"*)
- 1–2 sentence description of what the app does, for first-time users

**Bottom half — reset time:**
- Section label: *"When should your wird reset each day?"*
- Full 24-hour time picker (all hours 12am–11pm), default 5am pre-selected
- UX: scrollable wheel or 4×6 grid of tappable hour chips — whichever fits the existing design language best (Nova theme, amber accent)
- Single CTA button: **"Begin"**

On "Begin": set `hasOnboarded = true` and `resetHour = selectedHour` in settings store, then render the main counter.

---

## Reset Timer (`useResetTimer`)

Replaces `useFajrRollover` with the same archival + counter-reset logic, but triggered by a `setTimeout` until the next occurrence of `resetHour:00` local time (using `Date` in the user's local timezone — no geolocation needed).

Handles the same edge cases as the original:
- `visibilitychange` re-check (tab was sleeping overnight)
- Correct archival to IndexedDB before clearing the active session

---

## Day Key Calculation (`devotionalDay.ts`)

Currently: if current time is before Fajr, the devotional day = yesterday.
After: if current time is before `resetHour:00`, the devotional day = yesterday.

The logic is identical — just swap the Fajr timestamp for `today @ resetHour:00`.

---

## Settings Access

Users can change their reset hour at any time via the existing **Settings sheet** (`SettingsSheet.tsx`). Add a "Daily reset time" row with the same hour picker used in onboarding.

---

## Migration: Existing Users

Users who already have the app installed (with location stored) will:
- Not see the onboarding screen (set `hasOnboarded = true` for them, or show it once to let them pick their hour)
- Default to `resetHour = 5` if no value is present

Recommendation: show the onboarding screen once for all existing users on this update by resetting `hasOnboarded = false`. Frame it as "we've simplified how your wird resets — choose your time." This ensures no one silently gets defaulted to 5am without awareness.

---

## Verification

1. Fresh install: onboarding screen appears, user picks 7am, taps Begin → counter loads, settings show resetHour=7
2. Re-open app: onboarding does NOT appear again
3. Change reset hour in Settings → new hour takes effect on next reset cycle
4. Cross-midnight test: open app at 11:55pm, leave it open, confirm reset fires at the chosen hour (not midnight)
5. `devotionalDay` unit test: counts made before resetHour credited to previous day key
6. `adhan` package removed from `package.json` and no import errors
