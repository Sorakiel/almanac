<div align="center">

# 📔 Almanac

**A personal command-center for habits, workouts, and self-discipline.**

One screen that answers _"where am I now, and where am I headed?"_ — every time it opens.

[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## What is Almanac?

Almanac is a private daily companion for building good habits and staying on top
of your training. Open it and one screen tells you where your day stands: the
habits you've committed to, how many you've completed, and a nudge to keep going.

Most habit trackers fail for the same reason — they become a chore. Almanac is
built around a single belief: **the biggest risk isn't a missing feature, it's
that you stop opening the app.** So everything is tuned for a five-second daily
visit rather than a lengthy one.

## The problem it solves

Keeping a routine takes momentum, and momentum dies when logging is slow, when
the screen is cluttered, or when a missed day feels like failure. Almanac
attacks that on three fronts:

- **Friction kills habits, so logging is one tap.** Marking a habit done is a
  single press, and the screen updates _instantly_ — it never makes you wait for
  the network before showing your progress.
- **A wall of numbers is discouraging, so the dashboard leads with clarity.**
  Today's habits, a simple completion ring, and a rotating quote — the answer to
  "how am I doing?" at a glance, without digging.
- **Life is more than one thing, so it's built to grow.** Habits and workouts
  come first, with room to add finances, reading, goals, and sleep later — each
  a self-contained module, so the app expands without becoming a mess.

It's also **multi-user from day one**: you can share it with friends, and each
person's data is fully private to them.

## How it works

Almanac runs entirely in your browser and talks directly to a hosted database —
there's no separate server to maintain. That keeps it fast, cheap to run, and
simple to reason about:

- **The app** is a snappy single-page React app. Your progress appears the
  instant you tap, then quietly syncs in the background; if something fails, it
  gracefully rolls back.
- **The data** lives in a Postgres database (via Supabase), which also handles
  sign-in. Privacy is enforced at the database itself — every person can only
  ever see their own rows — rather than trusting the app to be careful.
- **The look** is a calm, focused interface with two hand-picked themes: a
  default **dark** mode and a warm, beige **coffee** light mode, both designed
  for daily comfort and readable contrast.

## Features

- ✅ **One-tap habits** — daily / weekly / interval habits with instant feedback,
  schedule-aware streaks, streak freezes, and a year-at-a-glance heatmap.
- 🏋️ **Workouts** — an exercise library and set-by-set training sessions.
- 📚 **Reading & reflection** — track books you're reading and keep a daily journal.
- 🎯 **Flow** — a deep-work focus timer with a console-style session visualizer,
  feeding a Deep Work heatmap.
- 📊 **Insights & achievements** — progress charts, tiered achievement badges, and
  **The Almanac** — a narrator that reads your day from your own data.
- 👥 **Friends** — a privacy-safe activity feed to stay accountable together.
- ✨ **Alive, not static** — cascade entrances, view-transition theme wipes,
  celebration confetti, living streak flames, and perfect-day moments (all
  respecting reduced-motion).
- 🔐 **Private accounts** — email sign-in, each user's data isolated from everyone
  else's.
- 🎨 **Two themes** — dark and coffee, switchable anytime; accessible and legible
  in both.
- 📱 **Everywhere** — a web app (Vercel), an Android build (Capacitor), and a
  desktop app (Tauri) from one codebase.

## Tech stack

| Area          | Built with                           |
| ------------- | ------------------------------------ |
| Framework     | **Vite** + React + **TypeScript**    |
| Styling       | **Tailwind CSS** + shadcn/ui (Radix) |
| Data & auth   | **Supabase** (Postgres + Auth)       |
| Data fetching | **TanStack Query** (React Query)     |
| App state     | **Zustand**                          |
| Charts        | Recharts                             |
| Forms         | react-hook-form + **zod**            |
| Testing       | **Playwright**                       |
| Hosting       | **Vercel**                           |

## Running it locally

```bash
git clone https://github.com/Sorakiel/almanac.git
cd almanac
npm install
npm run dev
```

Almanac connects to a Supabase project for its data and sign-in. Copy
`.env.example` to `.env.local` and add your own Supabase credentials — the setup
steps are documented there and in the `supabase/` folder.

## Roadmap

Shipped so far: habits + the daily dashboard, workouts, reading, a reflection
journal, focus/deep-work, insights, achievements, friends, and a layer of motion
and celebration polish across the app.

Next up:

- **Goals** — set a goal and roll up progress from the habits, workouts, and
  reading that feed it.
- **Routines & subtasks** — group habits into named routines and add a checklist
  inside a habit.
- **More life modules** — finances and sleep, behind the modules hub.

## License

[MIT](LICENSE) © Nikita Vasilev
