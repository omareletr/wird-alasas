---
phase: 2
slug: day-boundary-completion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | FOUND-02 | unit | `npm test -- --run lib/time` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | FOUND-03 | unit | `npm test -- --run lib/location` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 2 | COMP-01 | unit | `npm test -- --run lib/storage` | ❌ W0 | ⬜ pending |
| 2-01-04 | 01 | 2 | COMP-02 | unit | `npm test -- --run lib/completion` | ❌ W0 | ⬜ pending |
| 2-01-05 | 01 | 3 | COMP-04 | manual | n/a | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/time.test.ts` — stubs for FOUND-02 (Fajr boundary calculation)
- [ ] `__tests__/lib/location.test.ts` — stubs for FOUND-03 (geolocation fallback)
- [ ] `__tests__/lib/storage.test.ts` — stubs for COMP-01 (day archiving)
- [ ] `__tests__/lib/completion.test.ts` — stubs for COMP-02 (classification logic)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Partial completion renders visually distinct | COMP-04 | Visual styling cannot be unit tested | Open app, complete 1-3 (not all 4) adhkar, verify faded/different-color state in UI |
| Geolocation prompt appears then falls back | FOUND-03 | Requires browser permission dialog interaction | Deny geolocation, verify manual entry form appears in SettingsSheet |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
