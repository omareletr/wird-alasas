---
phase: 0
slug: foundation-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.mts — Wave 0 installs |
| **Quick run command** | `npm run test:run` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 00-01-T1 | 01 | 1 | FOUND-01 | build | `npm run build` | ✅ | ⬜ pending |
| 00-01-T2 | 01 | 1 | FOUND-01 | build+lint | `npm run build && npm run lint` | ✅ | ⬜ pending |
| 00-02-T1 | 02 | 1 | FOUND-01 | unit | `npm run test:run` | ❌ W0 | ⬜ pending |
| 00-02-T2 | 02 | 1 | FOUND-01 | unit | `npm run test:run -- lib/utils/devotionalDay.test.ts` | ❌ W0 | ⬜ pending |
| 00-03-T1 | 03 | 2 | FOUND-01 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 00-03-T2 | 03 | 2 | FOUND-01 | build+unit | `npm run build && npm run test:run` | ❌ W0 | ⬜ pending |
| 00-03-T3 | 03 | 2 | FOUND-01 | manual | MISSING — visual browser check | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom` — install as devDependencies (Plan 02 Task 1)
- [ ] `vitest.config.mts` — configure with jsdom environment and `@/*` alias via vite-tsconfig-paths (Plan 02 Task 1)
- [ ] `lib/utils/devotionalDay.test.ts` — test stubs for getDevotionalDay (Plan 02 Task 2)
- [ ] `test:run` script added to `package.json` (Plan 02 Task 1)

*Test infrastructure does not exist yet — Plan 02 Task 1 installs and configures vitest before any test tasks can run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App loads in browser with dark base theme | FOUND-01 | Visual check | Run `npm run dev`, visit localhost:3000, confirm #000000 background + white text |
| No Supabase network calls on page load | FOUND-01 | Network inspection | Open DevTools Network tab, hard reload, confirm no requests to supabase.co |
| Zustand store rehydrates on page reload | FOUND-01 | Browser state | Set a count in localStorage manually, reload page, confirm store reads it back |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
