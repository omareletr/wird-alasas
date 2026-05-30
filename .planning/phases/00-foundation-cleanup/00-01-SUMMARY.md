---
phase: "00-foundation-cleanup"
plan: "01"
subsystem: "foundation"
tags: [cleanup, supabase, theme, branding]
dependency_graph:
  requires: []
  provides: [clean-nextjs-baseline, dark-theme, branded-placeholder]
  affects: [all-subsequent-phases]
tech_stack:
  added: []
  removed: ["@supabase/ssr", "@supabase/supabase-js"]
  patterns: [always-dark-css-variables, no-op-middleware]
key_files:
  created: []
  modified:
    - middleware.ts
    - app/globals.css
    - app/layout.tsx
    - app/page.tsx
    - package.json
  deleted:
    - lib/supabase/client.ts
    - lib/supabase/server.ts
    - lib/supabase/middleware.ts
    - app/login/page.tsx
    - app/auth/confirm/route.ts
    - app/auth/auth-code-error/page.tsx
    - app/protected/page.tsx
decisions:
  - "Collapsed light/dark CSS blocks into a single always-dark :root block since the app has no theme toggle"
  - "Used empty matcher [] on no-op middleware to ensure it never runs on any path"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-05-30"
  tasks_completed: 2
  files_modified: 5
  files_deleted: 7
---

# Phase 00 Plan 01: Strip Supabase and Apply Dark Base Theme Summary

Removed all Supabase auth scaffolding from the Next.js starter template and applied the always-dark branded placeholder that Phase 1 will build on.

## What Was Built

- **No-op middleware** (`middleware.ts`): Replaced Supabase session-update middleware with a minimal pass-through that has an empty matcher — runs on zero paths, no auth logic.
- **Pure-black CSS theme** (`app/globals.css`): Collapsed the separate `:root` (light) and `.dark` (dark) variable blocks into a single `:root` block with `--background: oklch(0 0 0)` and `--foreground: oklch(1 0 0)`. All other tokens use the former `.dark` values so shadcn components render correctly against the dark background.
- **Updated layout** (`app/layout.tsx`): Title "wird al-asas", description "Complete your daily wird al-asas — four adhkar, every day.", `className="dark"` on `<html>` so Radix/shadcn dark-variant selectors resolve.
- **Branded placeholder** (`app/page.tsx`): Full-viewport centered page showing Arabic name "وِرد الأساس" (`dir="rtl" lang="ar"`) and "coming soon" subtitle in muted text. Zero Next.js starter boilerplate.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Delete Supabase files, uninstall packages, fix middleware | 0c349ce |
| 2 | Dark theme, branded placeholder page, layout metadata | 1328580 |

## Verification Results

- `npm run build` exits 0, no module-not-found errors
- `npm run lint` exits 0, no ESLint warnings or errors
- `grep -r "supabase" app/ middleware.ts` returns nothing
- `lib/supabase/`, `app/login/`, `app/auth/`, `app/protected/` do not exist
- `package.json` contains neither `@supabase/ssr` nor `@supabase/supabase-js`

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **Always-dark :root block**: Rather than keeping separate `:root` and `.dark` blocks and only overriding `--background`/`--foreground`, the entire `.dark` block was promoted to `:root` and the `.dark` block removed. This means all dark tokens (card, popover, muted, etc.) are active from the start without needing `.dark` context — consistent with the app never having a light mode.

2. **Empty middleware matcher**: Plan specified `matcher: []` (empty array). This is safe and correct — Next.js does not error on an empty matcher array; the middleware simply never runs.
