# Phase 0: Foundation & Cleanup - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Strip all Supabase/auth scaffolding from the starter template and establish the local-first data foundation: a versioned localStorage + IndexedDB storage schema, the canonical `getDevotionalDay()` keystone function with passing unit tests, a Zustand store that persists and rehydrates the active session, and a minimal branded placeholder page. No counter UI is delivered — this phase makes the codebase ready for Phase 1 feature work.

</domain>

<decisions>
## Implementation Decisions

### Session data model
- The Zustand active session holds: `counts` (object keyed by numeric index 0–3, one count per dhikr), `mode` ('full' | 'shortened'), `sessionStartedAt` (timestamp), and `activeIndex` (0–3, the dhikr the user was last viewing)
- Dhikr identity uses numeric index 0–3 (canonical order: hasbi, istighfar, la ilaha, salawat)
- Mode is stored in the session (supports per-session override over the default setting)
- `sessionStartedAt` is stored so Phase 2 can assign the session to the correct day at Fajr rollover
- `activeIndex` is persisted so reopening the app lands on the same dhikr the user left off on
- On Fajr rollover: archive the session's counts to history as a daily record, then reset counts to zero

### Storage split
- **localStorage**: active session + user settings (default mode, location). Small, synchronous reads, handled by Zustand persist middleware
- **IndexedDB**: daily history records. Will grow over time; benefits from proper async storage
- Schema versioning: store a `schemaVersion` key in localStorage; on app load, if version doesn't match, run a migration function and update the version (migrate-on-read strategy)

### Landing page
- `app/page.tsx` becomes a minimal branded placeholder after stripping auth (e.g. "wird al-asas — coming soon")
- Update layout.tsx metadata: set a proper title and description for wird al-asas
- Apply the dark base theme (pure black `#000000` background, white text) in `globals.css` in Phase 0, so Phase 1 builds on the correct canvas from the start

### Claude's Discretion
- Test runner choice (Vitest recommended), test file location (co-located recommended), and whether to add storage layer tests alongside `getDevotionalDay()` tests
- Implementation details of the IndexedDB helper layer (raw IDB vs a thin wrapper)
- Exact Zustand store file structure and persist key naming
- Specifics of the schema migration function shape

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx` — shadcn/ui components already installed; the placeholder page can use Button if needed
- `lib/utils.ts` — `cn()` helper already present, keep it
- `components.json` — shadcn config (`rtl: false`); Phase 1 will need to revisit for Arabic RTL support

### Established Patterns
- Tailwind v4 + shadcn/ui Nova theme already configured in `app/globals.css`
- `@/*` import alias configured in `tsconfig.json`

### Integration Points
- `app/layout.tsx` — needs metadata update (title, description) and dark theme applied
- `middleware.ts` — currently runs Supabase session refresh on every route; must be replaced or removed entirely
- `lib/supabase/` directory — delete entirely (client.ts, server.ts, middleware.ts)
- Auth routes to delete: `app/login/`, `app/auth/`, `app/protected/`
- `package.json` — remove `@supabase/ssr` and `@supabase/supabase-js` dependencies

</code_context>

<specifics>
## Specific Ideas

- The placeholder page should feel on-brand (dark background, white text) even though it's just a stub
- Dark base: `background: #000000`, `color: white` — matches the "Behold-inspired" aesthetic from PROJECT.md

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 00-foundation-cleanup*
*Context gathered: 2026-05-30*
