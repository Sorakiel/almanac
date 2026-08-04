-- Web Push subscriptions.
--
-- Email reminders are being retired: they run fine, but Resend will only
-- deliver to a verified domain and there isn't one, so for everybody except the
-- account owner the "Daily reminder" toggle has been switching on nothing.
-- Push costs no domain and no money.
--
-- One row per browser, not per user — the same person legitimately has Chrome
-- on a laptop and an installed PWA on a phone, and each gets its own endpoint.
-- The endpoint is the natural key: re-subscribing the same browser must update
-- the keys rather than pile up dead rows.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

-- Own rows only, same shape as every other user-owned table. `(select …)` so
-- the planner hoists the auth call out of the per-row filter (see 0025).
create policy "push_subscriptions: select own" on push_subscriptions
  for select using (user_id = (select auth.uid()));
create policy "push_subscriptions: insert own" on push_subscriptions
  for insert with check (user_id = (select auth.uid()));
create policy "push_subscriptions: update own" on push_subscriptions
  for update using (user_id = (select auth.uid()));
create policy "push_subscriptions: delete own" on push_subscriptions
  for delete using (user_id = (select auth.uid()));
