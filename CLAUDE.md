# Almanac — Project Guide

> Personal **command-center** app for habits, workouts, and self-discipline.
> This file is the single source of truth for _how_ we build Almanac.
> **Read it fully before writing code.** Claude Code loads `CLAUDE.md`
> automatically, so keep it accurate and up to date.

---

## 1. Product vision

- One screen answers **"where am I now, and where am I headed?"** every time it opens.
- **Dashboard-first**: the user _acts_ on the dashboard (one-tap habit completion), not just reads it.
- A modular **"life OS"** that grows into a super app: habits and workouts first, then finances, reading, goals, sleep — each a self-contained module behind a modules hub.
- **Multi-user from day one** (the owner shares it with friends). Per-user data isolation is enforced by Supabase Row-Level Security, not app code.
- **North-star design**: the _Almanac_ spec board — two themes, `dark` (default) and `coffee` (warm beige light theme).
- **The #1 risk is abandonment.** Bias every decision toward low-friction daily use: fast loads, one-tap logging, instant (optimistic) feedback, forgiving streaks.

## 2. Tech stack

| Concern                  | Choice                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------ |
| Build tool               | **Vite** + React 19 + **TypeScript** (strict)                                        |
| Styling                  | **Tailwind CSS** + **shadcn/ui** (Radix primitives)                                  |
| Routing                  | React Router v7 (data router)                                                        |
| Backend                  | **Supabase** — Postgres + Auth + RLS + Storage (client SDK; no custom server for v1) |
| Server state             | **TanStack Query** (React Query)                                                     |
| UI / cross-cutting state | React state + **Zustand** (theme, session)                                           |
| Charts                   | Recharts                                                                             |
| Icons                    | lucide-react                                                                         |
| Forms + validation       | react-hook-form + **zod**                                                            |
| Dates / timezones        | date-fns (+ tz handling)                                                             |
| E2E testing              | **Playwright** (run via the Playwright MCP during dev)                               |
| Unit (optional early)    | Vitest + Testing Library                                                             |
| Quality                  | ESLint + Prettier; `tsc` in CI                                                       |
| Hosting                  | **Vercel** (static SPA build)                                                        |

**Why Vite SPA + Supabase (not a custom server):** the Supabase JS client talks to Postgres directly, and RLS enforces per-user security at the database. That means no backend to run or pay for. Trade-off: no SSR/SEO — irrelevant here since the whole app sits behind auth.

## 3. Architecture principles

- **Feature-first structure.** Each life area is a self-contained module under `features/`.
- **Dumb components, smart hooks.** UI components are presentational; all data access and logic live in hooks (`useHabits`, `useToggleHabit`) and a thin `api/` layer.
- **React Query is the one source of truth for server data.** No ad-hoc `useEffect` fetching.
- **Types are generated from the DB** (`supabase gen types typescript`). Never hand-maintain database types.
- **Components never import `supabase` directly** — they go through the feature's `api/` + `hooks/`.
- **Every data view ships three states**: loading, empty, error.
- **Optimistic updates on completion actions** — taps must feel instant (retention-critical).
- **Accessibility is not optional** — semantic HTML, labels, visible focus, keyboard support, AA contrast.

## 4. Folder structure

```
almanac/
├─ public/
├─ src/
│  ├─ app/                 # shell, providers, router
│  │  ├─ App.tsx
│  │  ├─ router.tsx
│  │  └─ providers.tsx     # QueryClient, Theme, Auth, Supabase session
│  ├─ components/
│  │  ├─ ui/               # shadcn primitives (button, card, dialog, sheet…)
│  │  └─ common/           # app composites (StatCard, EmptyState, ProgressBlocks, BottomNav)
│  ├─ features/            # one folder per module
│  │  ├─ auth/
│  │  ├─ dashboard/
│  │  ├─ habits/
│  │  │  ├─ components/    # HabitCard, HabitFormSheet, HabitHeatmap
│  │  │  ├─ hooks/         # useHabits, useHabitLogs, useToggleHabit
│  │  │  ├─ api/           # habits.queries.ts (supabase calls)
│  │  │  └─ types.ts
│  │  ├─ workouts/
│  │  ├─ reading/
│  │  ├─ flow/            # deep-work focus timer
│  │  ├─ insights/
│  │  ├─ achievements/
│  │  ├─ reflect/
│  │  ├─ social/
│  │  ├─ onboarding/
│  │  ├─ modules/
│  │  ├─ settings/
│  │  └─ admin/
│  ├─ lib/                 # supabase.ts, queryClient.ts, date.ts, tz.ts, utils.ts
│  ├─ hooks/               # cross-cutting (useTheme, useSession)
│  ├─ stores/              # zustand stores (theme, ui)
│  ├─ styles/              # tailwind base, tokens.css, globals.css
│  ├─ types/               # database.generated.ts, shared types
│  └─ main.tsx
├─ tests/                  # Playwright e2e specs
├─ supabase/               # migrations/, seed.sql, config.toml
├─ .env.example
├─ .env.local              # NEVER commit
├─ CLAUDE.md
├─ README.md
└─ (vite/tailwind/eslint/prettier/tsconfig configs)
```

## 5. Data model (Supabase / Postgres)

All user-owned tables carry `user_id` and are protected by RLS. Use `timestamptz` (UTC) everywhere.

| Table               | Key columns                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`          | id → auth.users, display_name, avatar_url, timezone, role (`user`\|`admin`), created_at                                                     |
| `habits`            | id, user_id, name, description, icon, color, frequency (`daily`\|`weekly`\|`x_per_week`), target_count, sort_order, archived_at, created_at |
| `habit_logs`        | id, user_id, habit_id, date (local calendar date), count, note, created_at — **unique(habit_id, date)**                                     |
| `workouts`          | id, user_id, name, scheduled_date, completed_at, created_at                                                                                 |
| `exercises`         | id, user_id, name, muscle_group, created_at                                                                                                 |
| `workout_exercises` | id, workout_id, exercise_id, target_sets, target_reps, target_weight, sort_order                                                            |
| `set_logs`          | id, workout_exercise_id, set_number, reps, weight, done, logged_at                                                                          |
| `quotes`            | id, text, author — **global, read-only to users**                                                                                           |
| `reflections`       | id, user_id, date, body, quote_id, created_at                                                                                               |
| `feedback`          | id, user_id, body, status, created_at                                                                                                       |

**RLS rules**

- Enable RLS on **every** table before it's used from the client.
- Default policy per user table: `user_id = auth.uid()` for select/insert/update/delete.
- `quotes`: readable by any authenticated user; not writable by users.
- Admin access (`role = 'admin'`) to other users' data goes through a `security definer` function or explicit admin policy — never by disabling RLS.

**Timezone rule:** store instants in UTC; determine "today" from `profiles.timezone`; `habit_logs.date` is the user's _local_ calendar date, computed client-side. Getting this wrong silently corrupts streaks.

## 6. Design system

Mirror the _Almanac_ spec board. All colors are **CSS variables** referenced through Tailwind — **no hard-coded hex in components.** Theme is set via `data-theme` on `<html>` (`dark` default, `coffee` light).

**Dark theme**

- Backgrounds: `#1B1B1D` / `#0E0E10` · surface `#26262A`
- Text: `#ECE7D8` · muted `#A8A59E` / `#85817A`
- Accent: `#EF8857` (bright) / `#C2562A` (deep)

**Coffee theme (warm light)**

- Canvas `#ECE3D2` · surface `#F4ECDD` · deep panel `#E0D2BC`
- Text: espresso `#2A2018` · muted `#6E5F4E`
- Accent: **same** `#EF8857` / `#C2562A` (shared brand accent across both themes)

**Shared category colors:** teal `#2A9D8F`, amber `#C79A3A`.

**Typography**

- UI + body: **Inter** (or SF Pro on Apple).
- Micro-labels, numbers, timestamps, tags, `// section` comments: **JetBrains Mono**, uppercase, letter-spacing ≈ 0.12–0.16em.
- Titles: large, tight tracking (≈ −0.02em), semibold.

**Shape & motifs**

- Radius: cards 20–28px, sheets/frames up to 36–46px. Shadows: soft, large, low-opacity.
- Bottom nav: glassmorphism (backdrop-blur) with a central "+" action.
- Signature motifs: block progress bars (`▓▓▓▓░░░░`), pill tags with thin borders, mono section labels, dotted pagination.
- The `◇` glyph is **decorative only** — no "AI/auto-plan" meaning (that was the reference app, not ours).

## 7. Coding style

- **TypeScript strict.** No `any` — use `unknown` + narrowing. Explicit return types on exported functions.
- **Functional components only**; logic lives in hooks. One component per file.
- **Naming:** `PascalCase` component files (`HabitCard.tsx`), `camelCase` hooks (`useHabits.ts`), `camelCase` utils. **Named exports** preferred; default export only for route/page components.
- Keep components under ~150 lines; extract when larger.
- Props typed via `interface`, destructured in the signature.
- No magic numbers/colors — use tokens and named constants.
- **Errors handled explicitly** — surface user-facing failures via toast; never swallow silently.
- **No `useEffect` data fetching** — React Query only.
- Comments explain **why**, not what; keep them sparse and honest.
- **Import order:** react → external libs → `@/` internal → relative → styles.

## 8. State & data conventions

- **Server state:** React Query. Namespaced query keys: `['habits', userId]`, `['habitLogs', habitId, month]`.
- **Mutations:** optimistic for completion toggles; invalidate the relevant keys on settle; roll back on error.
- **Theme + session:** Zustand store + a Supabase `onAuthStateChange` listener.
- Never hand-manage tokens in `localStorage` — rely on `supabase-js` session handling.
- Validate all user input with **zod** at the boundary (forms + any external data).

## 9. Testing — Playwright via MCP

Run against the dev server (`http://localhost:5173`) **after each feature / vertical slice**. A red smoke run blocks moving on.

**Smoke checklist**

1. App loads with **no console errors**.
2. Sign up / sign in with a test user works.
3. Dashboard renders.
4. Create a habit → it appears.
5. Complete it → count increments **instantly** (optimistic), persists after reload.
6. Toggle theme → dark ↔ coffee switches correctly.
7. Sign out returns to auth.

Guidelines: keep specs in `/tests`; select by **role/label**, not brittle CSS; favor a fast feedback loop over exhaustive coverage early.

## 10. Git & commit style

- **Conventional Commits:** `type(scope): summary`
  - Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `build`, `perf`.
  - e.g. `feat(habits): add one-tap completion with optimistic update`
- **Small, focused commits** — one logical change each; commit after every passing slice.
- Branches: `main` (always deployable) + `feat/*`, `fix/*`. PRs squash-merge with a clean title.
- **Never commit secrets** (`.env*`, service keys) — gitignore them.
- Keep `README.md` and this file current when architecture changes.

## 11. Environment & security

- `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — **anon key only** (safe for the client _because_ RLS is on). The `service_role` key must **never** reach the client or the repo.
- RLS **on** before any table is queried from the client — verify each policy.
- Ship an `.env.example` documenting required vars.

## 12. Deployment & ops

- **Vercel:** framework preset **Vite**, output dir `dist`, env vars set in the Vercel dashboard (not committed). Preview deploy per PR.
- **Supabase free tier pauses after 7 days of inactivity** → set up a **daily keep-alive** early (a GitHub Action cron doing one tiny DB read) so the app never cold-starts on a friend.
- No backups on the free tier → add a **nightly DB export** action once real data accumulates.
- **Vercel Hobby is personal/non-commercial** — fine for friends-and-family. If it ever earns money, move to Pro.

## 13. Definition of done (per feature)

- `tsc` clean, ESLint clean, no console errors.
- Loading / empty / error states present.
- Works in **both** themes.
- Keyboard + screen-reader sane; AA contrast.
- Playwright smoke green.
- Committed with a Conventional Commit message.

## 14. Roadmap

**Shipped:** auth + dashboard, habits (schedule-aware streaks, freezes, heatmap), workouts, reading, reflect, flow (deep-work), insights, achievements, friends, onboarding, admin/feedback — plus a motion & celebration layer (cascade entrances, view-transition theme wipe, confetti, streak flames, focus console, the Almanac narrator).

**Next:** goals, habit routines + subtasks, workout PRs; then finances/sleep behind the modules hub. Each life area stays a self-contained module under `features/`.

Keep the daily loop fast and low-friction above all — the #1 risk is still abandonment, not a missing feature.

## 15. How Claude Code should work here

- **Read this file first** and follow it.
- After each slice: `tsc` → lint → Playwright smoke → commit.
- Prefer **small PRs and frequent commits** over big drops.
- **Ask before destructive/irreversible actions:** deleting data, rewriting already-applied migrations, force-pushing, or changing auth/RLS in ways that could lock the owner out.
- **Never handle the owner's credentials.** For GitHub/Vercel/Supabase auth, output the exact commands and pause for the owner to run them.
- Keep `README.md` and `CLAUDE.md` updated when the architecture changes.
