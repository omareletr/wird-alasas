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
| **Config file** | vitest.config.ts — Wave 0 installs |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 00-01-01 | 01 | 0 | FOUND-01 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 00-01-02 | 01 | 1 | FOUND-01 | unit | `npx vitest run lib/storage` | ❌ W0 | ⬜ pending |
| 00-01-03 | 01 | 1 | FOUND-01 | unit | `npx vitest run lib/time` | ❌ W0 | ⬜ pending |
| 00-02-01 | 02 | 1 | FOUND-01 | unit | `npx vitest run lib/store` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom` — install as devDependencies
- [ ] `vitest.config.ts` — configure with jsdom environment and `@/*` alias via vite-tsconfig-paths
- [ ] `lib/time/getDevotionalDay.test.ts` — stub file, all tests pending
- [ ] `lib/storage/session.test.ts` — optional; stub if storage tests are included

*Test infrastructure does not exist yet — Wave 0 must install and configure vitest before any test tasks can run.*

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
