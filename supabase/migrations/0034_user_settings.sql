-- Per-user app settings that should follow the person across devices:
-- which modules are on, their order on Today, the pinned tab, theme, language
-- and sound. Until now these lived only in each device's localStorage, so a
-- phone and a laptop drifted apart and a reinstall lost them (HANDOFF §2.4).
--
-- One row per user, created lazily by the client's first upsert rather than
-- backfilled. A missing row means "this account has never synced", which is
-- exactly when the device's current local choices must be written up instead
-- of being overwritten by server defaults. Every column is nullable for the
-- same reason: null means "no choice made — use the app default".

create table if not exists public.user_settings (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  modules    jsonb,
  home_order text[],
  pinned_tab text,
  theme      text,
  locale     text,
  sound      boolean,
  updated_at timestamptz not null default now(),

  constraint user_settings_modules_is_object
    check (modules is null or jsonb_typeof(modules) = 'object'),
  constraint user_settings_theme_known
    check (theme is null or theme in ('dark', 'coffee', 'system')),
  constraint user_settings_locale_known
    check (locale is null or locale in ('en', 'ru')),
  constraint user_settings_home_order_bounded
    check (home_order is null or cardinality(home_order) <= 32),
  constraint user_settings_pinned_tab_short
    check (pinned_tab is null or char_length(pinned_tab) <= 32)
);

alter table public.user_settings enable row level security;

-- Own row only. No delete policy: the row goes with the account (cascade),
-- and "reset to defaults" is an update to nulls, not a delete.
create policy "user_settings: select own" on public.user_settings
  for select using (user_id = (select auth.uid()));
create policy "user_settings: insert own" on public.user_settings
  for insert with check (user_id = (select auth.uid()));
create policy "user_settings: update own" on public.user_settings
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The server stamps updated_at, so two devices never argue over clock skew
-- about which write is newer.
create or replace function public.user_settings_touch()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.user_settings_touch() from public, anon, authenticated;

create trigger user_settings_touch
  before insert or update on public.user_settings
  for each row execute function public.user_settings_touch();
