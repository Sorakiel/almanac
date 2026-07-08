<div align="center">

# 📔 Almanac

**A personal command-center for habits, workouts, and self-discipline.**

One screen that answers _"where am I now, and where am I headed?"_ — every time it opens.

[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Overview

Almanac is a **dashboard-first "life OS"**: you _act_ on the dashboard — one-tap
habit completion with instant, optimistic feedback — instead of just reading it.
It starts with habits and workouts and is built to grow into a modular super app
(finances, reading, goals, sleep) behind a modules hub.

It is **multi-user from day one**. Per-user data isolation is enforced by
Supabase **Row-Level Security** at the database, not by application code — the
browser only ever holds the public anon key.

> **Design north-star:** two themes — `dark` (default) and `coffee` (a warm
> beige light theme) — sharing one brand accent, mono micro-labels, and block
> progress bars (`▓▓▓▓░░░░`).

## Features

- **🔐 Auth** — email/password sign-in; session handled entirely by `supabase-js`.
- **📊 Dashboard** — today's habits, a completion donut, and a rotating quote.
- **✅ Habits** — create / edit / archive, with **one-tap completion** that updates
  optimistically and persists across reloads.
- **🎨 Dual themes** — `dark` / `coffee` toggle via `data-theme`, AA-contrast in both.
- **♿ Accessible** — semantic HTML, labels, visible focus, keyboard support.
- **🧭 Roadmap-ready** — feature-first architecture; workouts, insights, reflect,
  and admin modules are scaffolded for later phases.

## Tech stack

| Concern            | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Build / framework  | **Vite** + React 19 + **TypeScript** (strict)      |
| Styling            | **Tailwind CSS** + shadcn/ui (Radix primitives)    |
| Routing            | React Router                                        |
| Backend            | **Supabase** — Postgres + Auth + RLS + Storage      |
| Server state       | **TanStack Query** (React Query)                   |
| UI / theme state   | React state + **Zustand**                          |
| Charts             | Recharts                                           |
| Forms + validation | react-hook-form + **zod**                          |
| Dates / timezones  | date-fns                                           |
| Testing            | **Playwright** (E2E) · Vitest (optional unit)      |
| Hosting            | **Vercel** (static SPA)                            |

**Why Vite SPA + Supabase, no custom server:** the Supabase JS client talks to
Postgres directly and RLS enforces per-user security at the database — so there
is no backend to run or pay for. The trade-off (no SSR/SEO) is irrelevant: the
whole app sits behind auth.

## Architecture

- **Feature-first** — each life area is a self-contained module under `src/features/`.
- **Dumb components, smart hooks** — UI is presentational; data access and logic
  live in hooks (`useHabits`, `useToggleHabit`) over a thin `api/` layer.
- **React Query is the single source of truth for server data** — no `useEffect` fetching.
- **Components never import `supabase` directly** — they go through `api/` + `hooks/`.
- **Every data view ships three states**: loading, empty, error.

```
src/
├─ app/          # shell, providers, router
├─ components/   # ui/ (primitives) + common/ (composites)
├─ features/     # auth, dashboard, habits, workouts, …
├─ lib/          # supabase, queryClient, date/tz, utils
├─ hooks/        # cross-cutting (useTheme, useSession)
├─ stores/       # zustand (theme, ui)
├─ styles/       # tokens.css (themes) + globals.css
└─ types/        # database.generated.ts
```

## Local setup

**Prerequisites:** Node 20+ and npm.

```bash
git clone https://github.com/Sorakiel/almanac.git
cd almanac
npm install
cp .env.example .env.local   # then fill in your Supabase values (below)
npm run dev                  # http://localhost:5173
```

### Environment variables

Create `.env.local` (gitignored) with values from your Supabase project
(**Dashboard → Project Settings → API**):

| Variable                 | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | Project URL, e.g. `https://xxxx.supabase.co`                 |
| `VITE_SUPABASE_ANON_KEY` | Public **anon** key — safe in the client because RLS is on.  |

> ⚠️ Never put the `service_role` key in the client or the repo.

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema — either paste `supabase/migrations/0001_init.sql` into the
   **SQL Editor**, or use the CLI:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```
3. Load starter data: run `supabase/seed.sql` (adds quotes + a demo habit).
4. (Recommended) regenerate DB types:
   ```bash
   supabase gen types typescript --linked > src/types/database.generated.ts
   ```

RLS is enabled on **every** table by the migration, with per-user "own rows"
policies; admin access flows through a `security definer` function.

## Scripts

| Script                 | Purpose                              |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the Vite dev server            |
| `npm run build`        | Type-check (`tsc -b`) + production build |
| `npm run preview`      | Preview the production build         |
| `npm run typecheck`    | Type-check only                      |
| `npm run lint`         | ESLint                               |
| `npm run format`       | Prettier write                       |

## Testing

End-to-end smoke tests run against the dev server with **Playwright**:

```bash
npm run dev            # in one terminal
npx playwright test    # specs live in /tests
```

The smoke checklist covers: app loads with no console errors, sign-in, create +
complete a habit (optimistic, persists on reload), theme toggle, and sign out.

## Deployment (Vercel)

1. Import the repo into [Vercel](https://vercel.com) — framework preset **Vite**,
   output dir `dist`.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Project Settings →
   Environment Variables**.
3. Deploy. Every PR gets a preview deployment.

Because Supabase's free tier pauses after ~7 days idle, a small daily keep-alive
(GitHub Action doing one tiny read) is planned so the app never cold-starts.

## Roadmap

- **Phase 1 (this slice)** — auth → app shell → habits CRUD → one-tap completion →
  basic dashboard. _Ship, then dogfood._
- **Phase 2** — workouts + exercise library + sessions; habit-detail heatmap;
  settings + timezone; keep-alive job.
- **Phase 3** — insights/progress, reflect/journal, admin + feedback, polish.
- **Phase 4+** — new modules (finances, reading, goals, sleep) behind a modules hub.

## License

[MIT](LICENSE) © Nikita Vasilev
