---
phase: 3
slug: history-streaks
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-30
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.mts` (project root) |
| **Quick run command** | `npx vitest run lib/utils/streaks.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run lib/utils/streaks.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-TDD | 01 | 1 | HIST-01, HIST-02 | unit | `npx vitest run lib/utils/streaks.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-scaffold | 01 | 1 | HIST-03 | unit (RED) | `npx vitest run components/history/HeatmapCalendar.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | HIST-03 | unit | `npx vitest run components/history/HeatmapCalendar.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | HIST-01, HIST-02 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 3-03-01 | 03 | 3 | HIST-04 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 3-03-02 | 03 | 3 | HIST-01–04 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 3-03-visual | 03 | 3 | HIST-01–04 | manual | browser click test (checkpoint) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/utils/streaks.test.ts` — 8 unit test cases for HIST-01 and HIST-02 streak logic
- [ ] `lib/utils/streaks.ts` — the implementation under test
- [ ] `components/history/HeatmapCalendar.test.ts` — 3 concrete `expect` assertions for HIST-03 level-mapping (none→0, partial→1, full→2); intentionally RED until plan 03-02 creates HeatmapCalendar.tsx

*Created by plan 03-01.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Calendar heatmap renders with correct color levels | HIST-03 | Visual rendering of react-activity-calendar | Open app, verify full/partial/none days show distinct colors |
| Day detail sheet opens on heatmap cell tap | HIST-04 | User interaction + sheet animation | Tap a filled day cell, verify detail view slides in with dhikr breakdown |
| Per-dhikr completion breakdown in day detail | HIST-04 | Data display correctness | Open a specific day, verify all 4 dhikr rows show correct counts |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
