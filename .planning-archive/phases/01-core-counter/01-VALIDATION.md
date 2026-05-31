---
phase: 1
slug: core-counter
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.7 (already installed and configured) |
| **Config file** | `vitest.config.mts` (repo root) |
| **Quick run command** | `npm run test:run` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run `npm run test:run` + `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke on real mobile device
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-W0-01 | W0 | 0 | COUNT-01 | unit | `npm run test:run -- lib/data/adhkar.test.ts` | ❌ W0 | ⬜ pending |
| 1-W0-02 | W0 | 0 | COUNT-03 | unit | `npm run test:run -- lib/store/sessionStore.test.ts` | ❌ W0 | ⬜ pending |
| 1-W0-03 | W0 | 0 | SET-01 | unit | `npm run test:run -- lib/store/settingsStore.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-01 | 01 | 1 | COUNT-01, COUNT-04, COUNT-05, COUNT-07 | unit | `npm run test:run -- lib/data/adhkar.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | COUNT-02 | smoke (manual) | `npm run dev` + swipe on device | N/A | ⬜ pending |
| 1-02-01 | 02 | 1 | COUNT-03 | unit | `npm run test:run -- lib/store/sessionStore.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | COUNT-06 | smoke (manual) | Tap past target, check ring + completion mark | N/A | ⬜ pending |
| 1-03-01 | 03 | 2 | COUNT-08 | unit | `npm run test:run` | ✅ (store exists) | ⬜ pending |
| 1-03-02 | 03 | 2 | SET-01 | unit | `npm run test:run -- lib/store/settingsStore.test.ts` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 2 | COUNT-09 | smoke (manual) | DevTools → Application → Wake Lock status | N/A | ⬜ pending |
| 1-04-02 | 04 | 2 | COUNT-10 | smoke (manual) | Test haptic on real device | N/A | ⬜ pending |
| 1-05-01 | 05 | 3 | COMP-03 | smoke (manual) | Tap to target on all 4 dhikr | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/data/adhkar.ts` — static dhikr data (4 entries with Arabic, transliteration, translation, targets)
- [ ] `lib/data/adhkar.test.ts` — validates data shape and target values for COUNT-01, COUNT-04, COUNT-05, COUNT-07
- [ ] `lib/store/sessionStore.test.ts` — validates `incrementCount` behavior for COUNT-03
- [ ] `lib/store/settingsStore.test.ts` — validates `setDefaultMode` persistence for SET-01

*No new framework install needed — Vitest and jsdom are already configured from Phase 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swipe deck advances/retreats activeIndex | COUNT-02 | Gesture testing requires real device or emulator | Run `npm run dev`, swipe left/right on counter screen |
| Wake lock acquired on mount | COUNT-09 | Platform API, not testable in jsdom | Open DevTools → Application → Wake Lock status; should show "acquired" |
| Haptic on Android, silent on iOS | COUNT-10 | Device-specific API, no jsdom equivalent | Test on real Android (vibrate) and iOS (no vibrate, no error) |
| Completion overlay shows at target | COMP-03 | Visual UI requiring full render | Tap to reach target on all 4 dhikr; overlay should appear |
| Screen stays awake during counting | COUNT-09 | Platform API | Count for 2+ minutes without touching screen; device should stay on |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
