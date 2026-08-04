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

| Concern                  | Choice                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Build tool               | **Vite** + React 19 + **TypeScript** (strict)                                           |
| Styling                  | **Tailwind CSS** + **shadcn/ui** (Radix primitives)                                     |
| Routing                  | React Router v7 (data router)                                                           |
| Backend                  | **Supabase** — Postgres + Auth + RLS + Storage (client SDK; no custom server for v1)    |
| Server state             | **TanStack Query** (React Query)                                                        |
| UI / cross-cutting state | React state + **Zustand** (theme, session)                                              |
| Charts                   | Recharts                                                                                |
| Icons                    | lucide-react                                                                            |
| Forms + validation       | react-hook-form + **zod**                                                               |
| Dates / timezones        | date-fns (+ tz handling)                                                                |
| E2E testing              | **Playwright** — 6 specs, run on every PR in CI against staging                         |
| Unit                     | Vitest + Testing Library                                                                |
| Quality                  | ESLint + Prettier; `tsc` in CI                                                          |
| Hosting                  | **Vercel** (static SPA build)                                                           |
| Native shells            | **Tauri** (macOS/Windows/Linux) · **Capacitor** (Android). Not interchangeable — see §9 |
| Analytics                | **PostHog** (EU) — pageviews, six named events, error capture                           |
| Dashboards               | **Grafana Cloud** over an `analytics` schema of aggregate views                         |
| Notifications            | Web Push (edge function + pg_cron) · native local notifications in the shells           |

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
├─ public/                 # favicon, PWA icons, manifest.webmanifest, sw.js (push only)
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
│  ├─ lib/                 # supabase.ts, queryClient.ts, date.ts, analytics.ts, push.ts, notify.ts
│  ├─ hooks/               # cross-cutting (useTheme, useSession)
│  ├─ stores/              # zustand stores (theme, ui)
│  ├─ styles/              # tailwind base, tokens.css, globals.css
│  ├─ types/               # database.generated.ts, shared types
│  └─ main.tsx
├─ tests/                  # Playwright e2e specs + helpers/ (shared sign-in, staging client)
├─ supabase/               # migrations/, functions/ (edge), seed.sql, config.toml
├─ grafana/                # dashboard JSON, version-controlled rather than living in Grafana
├─ android/                # Capacitor shell
├─ src-tauri/              # desktop shell
├─ .env.example
├─ .env.local              # NEVER commit
├─ CLAUDE.md
├─ README.md
└─ (vite/tailwind/eslint/prettier/tsconfig configs)
```

## 5. Data model (Supabase / Postgres)

All user-owned tables carry `user_id` and are protected by RLS. Use `timestamptz` (UTC) everywhere.

| Table                | Key columns                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`           | id → auth.users, display_name, avatar_url, timezone, role (`user`\|`admin`\|`owner`), onboarded, reminder_enabled, reminder_hour, reminder_minute, reminder_sent_on, created_at |
| `habits`             | id, user_id, name, description, icon, color, frequency (`daily`\|`weekly`\|`x_per_week`), target_count, sort_order, archived_at, created_at                                     |
| `habit_logs`         | id, user_id, habit_id, date (local calendar date), count, note, created_at — **unique(habit_id, date)**                                                                         |
| `workouts`           | id, user_id, name, scheduled_date, completed_at, created_at                                                                                                                     |
| `exercises`          | id, user_id, name, muscle_group, created_at                                                                                                                                     |
| `workout_exercises`  | id, workout_id, exercise_id, target_sets, target_reps, target_weight, sort_order                                                                                                |
| `set_logs`           | id, workout_exercise_id, set_number, reps, weight, done, logged_at                                                                                                              |
| `quotes`             | id, text, author — **global, read-only to users**                                                                                                                               |
| `support_methods`    | id, kind (`link`\|`crypto`), label, hint, network, value, enabled, sort_order — **global; users read enabled rows, owner writes** (donations)                                   |
| `app_settings`       | id (singleton), support_enabled — **global flags; any auth reads, owner writes**                                                                                                |
| `reflections`        | id, user_id, date, body, mood, energy, day_rating, quote_id, created_at                                                                                                         |
| `feedback`           | id, user_id, body, status, created_at                                                                                                                                           |
| `habit_freezes`      | id, user_id, habit_id, date — a protected day that doesn't break a streak                                                                                                       |
| `habit_subtasks`     | id, user_id, habit_id, title, completed_dates[], sort_order                                                                                                                     |
| `books`              | id, user_id, title, author, status, progress_mode, current_unit, total_units, daily_goal, rating, started_on, finished_on                                                       |
| `reading_sessions`   | id, user_id, book_id, date, units_read, minutes                                                                                                                                 |
| `book_notes`         | id, user_id, book_id, body, page                                                                                                                                                |
| `focus_sessions`     | id, user_id, date, minutes, label                                                                                                                                               |
| `friendships`        | id, requester_id, addressee_id, status (`pending`\|`accepted`), responded_at                                                                                                    |
| `activity_events`    | id, user_id, kind, subject, meta, event_date — privacy-safe friend feed; **dedup unique indexes make a duplicate insert an expected 409**                                       |
| `achievement_grants` | id, user_id, achievement_id, granted_by — owner-awarded badges only; the rest are derived                                                                                       |
| `push_subscriptions` | id, user_id, endpoint (**unique**), p256dh, auth, user_agent, last_success_at — one row per browser, not per user                                                               |

**RLS rules**

- Enable RLS on **every** table before it's used from the client.
- Default policy per user table: `user_id = auth.uid()` for select/insert/update/delete.
- `quotes`: readable by any authenticated user; not writable by users.
- Admin access (`role = 'admin'`) to other users' data goes through a `security definer` function or explicit admin policy — never by disabling RLS.
- **Wrap `auth.uid()` in a scalar subquery** in every policy — `user_id = (select auth.uid())`. Bare, it is re-evaluated per row; the planner hoists the subquery. This was worth 68 advisor warnings.
- The **`analytics` schema crosses RLS on purpose** (owner-privileged views, no `security_invoker`) because a cross-user aggregate cannot work otherwise. Its column list is therefore the only thing between a Grafana dashboard and everyone's data: **counts and dates only — never a name, title or body.**

**Timezone rule:** store instants in UTC; determine "today" from `profiles.timezone`; `habit_logs.date` is the user's _local_ calendar date, computed client-side. Getting this wrong silently corrupts streaks.

## 6. Design system

Mirror the _Almanac_ spec board. All colors are **CSS variables** referenced through Tailwind — **no hard-coded hex in components.** Theme is set via `data-theme` on `<html>` (`dark` default, `coffee` light).

**Dark theme**

- Backgrounds: `#1B1B1D` / `#0E0E10` · surface `#26262A`
- Text: `#ECE7D8` · muted `#A8A59E` / `#85817A`
- Accent: `#EF8857` (bright) / `#C2562A` (deep)

**Coffee theme (warm light)**

- Canvas `#F4ECDD` · cards/surface `#ECE3D2` (a step darker than canvas — the inverse of dark) · deep panel `#E0D2BC`
- Text: espresso `#2A2018` · muted `#6E5F4E`
- Accent is **theme-adaptive**, not identical: dark reads the bright shade
  (`#EF8857`) as its accent, coffee reads the deep shade (`#C2562A`) — bright
  orange has too little contrast against warm paper, so the handoff never
  uses it as an accent there (text, borders, solid fills all read deep on
  coffee). The bright shade still exists as an **invariant raw token**
  (`--color-accent-bright`) for the handful of spots pinned to one literal
  shade regardless of theme — the brand-mark gradient's first stop, mainly.
  `--color-accent-deep` (`#C2562A`) is likewise invariant (2nd gradient stop,
  danger button, "deep" hover shade on dark).

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

## 9. Testing

**Unit — Vitest.** `npm test`. Pure logic only: streaks, schedules, insight maths, the analytics path sanitiser. Fast enough to run on every save.

**E2E — Playwright.** Six specs in `/tests`, run on every PR by the `e2e` CI job. They drive a real browser against the **staging** Supabase project — never production, because they create and delete real rows. `--mode e2e` makes `.env.e2e.local` win over `.env.local` so the target is explicit rather than whatever a developer happens to have configured.

The specs share **one pre-seeded staging account** and clean up their own rows through ordinary RLS — no service_role key anywhere. Consequences worth knowing before you touch them:

- They must run serially. The CI job is serialised repo-wide by `concurrency: e2e-staging`.
- Leftover data from a failed run, or from a second Claude session working this repo, can turn a spec red for reasons unrelated to your diff. Check staging before debugging your own change.
- Cleanup belongs in `afterEach`, **not** a `finally` inside the test: Playwright aborts the body on timeout and the `finally` may never run.
- Pin anything environment-dependent. A spec that asserted "the timezone is not UTC" passed locally and failed on UTC runners, where "adopted the zone" and "wrote nothing" are the same string.

**Offline is reads only.** The service worker precaches the app shell and React Query's
cache is persisted, so a cold start with no network opens on real data. Writes are not
covered: a mutation paused while offline does not resume in this version, and persisted
mutations come back without a `mutationFn`. Restored data is invalidated on restore rather
than trusted — the snapshot is throttled, and without that a reload right after a change
replays the pre-change state.

**What a browser sandbox cannot verify.** Notification permission is denied there, so Web Push delivery has never been proven end to end from a dev machine, and there is no Android emulator. Verify every link you can, then say plainly which one you could not.

**Interface language.** English is the source dictionary (`src/i18n/en.ts`); `ru.ts` is
typed against it, so a missing translation is a build error rather than a blank label.
Plurals go through `Intl.PluralRules` — Russian needs one/few/many and 11–14 take "many",
which is where hand-rolled `n % 10` always breaks. Pure functions take `t` as a parameter
instead of reaching for a hook, and nothing resolves a label at module scope, or it stops
updating when the language changes. Russian is landing screen by screen: the default stays
English and untranslated screens fall back to it, so a stage never regresses a screen.

**Native shells are not interchangeable.** Desktop is **Tauri**, Android is **Capacitor**. `isTauri()` is false in the Android app. Gating a native feature on the wrong one silently disables a whole platform — that is exactly how Android lost its reminders for weeks. Prefer a capability check (`isNativeScheduler()`) over a platform check.

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
- Also client-side and therefore public by design: `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`, `VITE_VAPID_PUBLIC_KEY`. Their private counterparts (`VAPID_PRIVATE_KEY`, service keys) live only as Supabase function secrets.
- **Every `VITE_*` var must be set for Production in Vercel, not just Development** — the build inlines them, so a Development-only var means the feature is silently dead in prod with no error anywhere. PostHog shipped dark for a day this way.
- RLS **on** before any table is queried from the client — verify each policy.
- Ship an `.env.example` documenting required vars.
- A secret belongs in a migration **never** — this repo is public. Create roles without a password and set it out of band.

## 12. Deployment & ops

- **Vercel:** framework preset **Vite**, output dir `dist`, env vars set in the Vercel dashboard (not committed). Preview deploy per PR.
- **Supabase free tier pauses after 7 days of inactivity** → a daily keep-alive cron keeps it warm so the app never cold-starts on a friend.
- **Backups:** a nightly GitHub Action pg_dumps the database, encrypts it, and uploads it as an artifact (90-day retention, same repo as the code). **A restore has never been rehearsed** — when it matters, restore into a scratch Supabase project, not a vanilla Postgres container.
- **Two Supabase projects.** Prod `fddabnnsgfjmlgeoeksz`, staging `lahcyvybqqwkocrbtpyv`, both eu-west-2. **Every migration goes to staging first**, gets verified there, then to prod. There is no local stack — Docker is off the table by the owner's decision.
- **Edge functions + pg_cron** run the daily reminder: an hourly-ish (`*/5`) tick invokes `daily-reminder`, which decides who is due from each profile's timezone and reminder time.
- **Vercel Hobby is personal/non-commercial** — fine for friends-and-family. If it ever earns money, move to Pro.

## 13. Definition of done (per feature)

- `tsc` clean, ESLint clean, Prettier clean, no console errors.
- Loading / empty / error states present.
- Works in **both** themes, on mobile **and** desktop layouts.
- Keyboard + screen-reader sane; AA contrast.
- Unit tests green; Playwright e2e green in CI.
- Migrations applied to staging and verified before prod.
- Committed with a Conventional Commit message; PR body in Russian.

## 14. Roadmap

**Shipped:** auth + dashboard, habits (schedule-aware streaks, freezes, heatmap), workouts, reading, reflect, flow (deep-work), insights, achievements, friends, onboarding, admin/feedback — plus a motion & celebration layer (cascade entrances, view-transition theme wipe, confetti, streak flames, focus console, the Almanac narrator).

Plus the v0.4 reliability and observability work: timezone-correct days, bounded queries, e2e in CI, PostHog, a Grafana usage dashboard, Web Push reminders, and installability as a PWA.

**The numbers say breadth already outran depth.** Of five registered users three are active, and only habits see daily use — workouts have never had a single session completed. Retention beats another module: finish RET (offline, i18n/ru, data export, widgets) before adding a tenth life area.

Keep the daily loop fast and low-friction above all — the #1 risk is still abandonment, not a missing feature.

## 15. How Claude Code should work here

- **Read this file first** and follow it.
- After each slice: `prettier` → `tsc` → lint → unit tests → e2e → commit.
- Work on a branch, open a PR, and **merge it yourself once CI is green**. Wait for an explicit yes only for migrations, auth/RLS changes, native builds, and data deletion.
- Prefer **small PRs and frequent commits** over big drops.
- **Verify before claiming.** Say which link you checked and which you could not — "works" without evidence is worse than "unproven". Two claims in this project turned out false on inspection; both are recorded in `../handoff.md` so they are not repeated.
- **Ask before destructive/irreversible actions:** deleting data, rewriting already-applied migrations, force-pushing, or changing auth/RLS in ways that could lock the owner out.
- **Never handle the owner's credentials.** For GitHub/Vercel/Supabase auth, output the exact commands and pause for the owner to run them.
- **Never add AI/Claude attribution** anywhere — commits, PR bodies, release notes.
- Reports to the owner are: what shipped · what they must do · how to see it. No narration of work in progress.
- Keep `README.md`, this file and `../handoff.md` current when the architecture changes.
