---
phase: 3
slug: history-streaks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x / vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run test -- --testPathPattern=history` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --testPathPattern=history`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | HIST-01 | unit | `npm run test -- --testPathPattern=streak` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | HIST-01 | unit | `npm run test -- --testPathPattern=streak` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | HIST-02 | manual | browser visual check | N/A | ⬜ pending |
| 3-02-02 | 02 | 1 | HIST-02 | manual | browser visual check | N/A | ⬜ pending |
| 3-03-01 | 03 | 2 | HIST-03 | manual | browser click test | N/A | ⬜ pending |
| 3-03-02 | 03 | 2 | HIST-04 | manual | browser sheet test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/utils/streakCalculator.test.ts` — stubs for HIST-01 streak logic
- [ ] `__tests__/lib/utils/historyUtils.test.ts` — stubs for day classification/grouping

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Calendar heatmap renders with correct color levels | HIST-02 | Visual rendering of react-activity-calendar | Open /history, verify full/partial/none days show distinct colors |
| Day detail sheet opens on heatmap cell tap | HIST-03 | User interaction + sheet animation | Tap a filled day cell, verify sheet slides up with dhikr breakdown |
| Per-dhikr completion breakdown in day detail | HIST-04 | Data display correctness | Open a specific day, verify all 4 dhikr rows show correct counts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
