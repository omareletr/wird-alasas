# wird_alasas

Keep this file under ~150 lines.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI primitives, Lucide icons, Nova theme)
- **Supabase** for auth / database / storage (`@supabase/ssr`)
- **motion** (the modern Framer Motion) for JS-driven animation
- **Netlify** for hosting (`@netlify/plugin-nextjs`)

Import alias: `@/*` maps to the repo root (e.g. `@/lib/supabase/server`).

## Commands

```bash
npm run dev      # local dev at http://localhost:3000
npm run build    # production build (run before committing big changes)
npm run lint     # eslint
npx shadcn@latest add <component>   # add a shadcn/ui component
```

## Project structure

```
app/
  page.tsx                 Landing page (links to auth flow)
  login/page.tsx           Magic-link sign-in form (Client Component)
  protected/page.tsx       Auth-gated page; shows session, sign-out
  auth/confirm/route.ts    Verifies the magic-link token, sets session
  auth/auth-code-error/    Shown when a link is invalid/expired
  layout.tsx, globals.css  Root layout + Tailwind/theme tokens
components/ui/             shadcn/ui components (button, input, label, card)
lib/
  supabase/client.ts       Browser client (Client Components)
  supabase/server.ts       Server client (Server Components / actions / routes)
  supabase/middleware.ts   Session refresh + route guarding
  utils.ts                 cn() class-name helper
middleware.ts              Runs lib/supabase/middleware on every request
netlify.toml               Build, Netlify plugin, security headers, CSP
.env.example               Required env vars (copy to .env.local)
```

## Going live with Supabase

The auth code is fully wired but needs a real project to function:

1. Create a project at supabase.com → **Settings → API**.
2. `cp .env.example .env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. (`.env.local` is gitignored — never commit keys.)
3. In Supabase: **Authentication → Email Templates → Magic Link**, set the link to:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
4. In **Authentication → URL Configuration**, add your site + localhost redirect URLs.
5. `npm run dev`, visit `/login`, request a link.

`SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose it to the browser or
prefix it with `NEXT_PUBLIC_`.

## Database & storage (pattern, not demoed)

These reuse the same clients as auth — no extra setup beyond your Supabase keys.
First create the table/bucket in the Supabase dashboard and enable Row Level
Security policies (otherwise reads/writes are blocked).

```ts
// Read/write rows — in a Server Component, route handler, or server action:
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase.from("notes").select("*");          // read
await supabase.from("notes").insert({ body: "hello", user_id: user.id });  // write

// Upload a file to Storage (bucket must exist; "avatars" here):
await supabase.storage.from("avatars").upload(`${user.id}/pic.png`, file);
const { data: pub } = supabase.storage.from("avatars").getPublicUrl(`${user.id}/pic.png`);
```

In Client Components, swap the import for `@/lib/supabase/client`.

## Deploying to Netlify

- Connect the repo in Netlify; it auto-detects Next.js and installs the plugin
  declared in `netlify.toml`. No `output: export` (the plugin needs the server build).
- Set the Supabase env vars in **Site settings → Environment variables**.
- The CSP in `netlify.toml` already allows `*.supabase.co`. If you add other
  external services (analytics, CDNs), widen `connect-src` / `img-src` there.

## Conventions for Codex

- **Branch workflow:** after merging to `main`, always switch back to `staging`.
- **Auth reads:** use `supabase.auth.getUser()` (verifies the token), never
  `getSession()` for trust decisions on the server.
- **Server vs browser client:** Server Components / route handlers / server actions
  use `@/lib/supabase/server`; Client Components use `@/lib/supabase/client`.
  Create a fresh server client per request — never cache it in module scope.
- **Middleware:** don't insert code between `createServerClient` and `getUser()` in
  `lib/supabase/middleware.ts`; protect new routes by extending its path checks.
- **UI:** prefer shadcn/ui components from `@/components/ui`; add new ones via the
  CLI rather than hand-writing. Use the `cn()` helper for conditional classes.
- **Animation:** use `motion` for JS animation (`import { motion } from "motion/react"`);
  `motion` components must live in Client Components (`"use client"`). For simple
  fade/slide effects, prefer `tw-animate-css` utility classes (no JS needed).
- **Secrets:** anything sensitive is server-only and stays out of `NEXT_PUBLIC_*`.
- **Before committing** meaningful changes, run `npm run build` and `npm run lint`.
- Keep this file current when the structure or stack changes.
