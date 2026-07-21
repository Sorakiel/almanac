-- Owner-managed "Support Almanac" config.
--
-- The donation methods (Boosty, crypto…) shown to users used to be a hard-coded
-- array in the client. Make them owner-editable at runtime: a global master
-- toggle for the whole Support section, plus a table of methods the owner can
-- add, edit, enable/disable, and order. Global config (not per-user), so it
-- follows the `quotes` pattern — any authenticated user reads, only the owner
-- writes. Guards reuse public.is_owner() / public.is_admin() (migrations 0001/0007).

-- ---------------------------------------------------------------------------
-- app_settings — single-row, app-wide flags
-- ---------------------------------------------------------------------------
-- The boolean primary key pinned to true keeps this a singleton (only one row
-- can ever exist). Add future global flags as columns here.
create table app_settings (
  id              boolean primary key default true check (id),
  support_enabled boolean not null default true,
  updated_at      timestamptz not null default now()
);

insert into app_settings (id) values (true);

alter table app_settings enable row level security;

-- Any signed-in user reads the flags (the Support row/sheet gate on them).
create policy "app_settings: read for authenticated" on app_settings
  for select to authenticated using (true);

-- Only the owner flips them.
create policy "app_settings: update owner" on app_settings
  for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- support_methods — the donation methods users can see
-- ---------------------------------------------------------------------------
create table support_methods (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('link', 'crypto')),
  label      text not null,
  hint       text,
  network    text,
  value      text not null default '',   -- URL for links, wallet address for crypto
  enabled    boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table support_methods enable row level security;

-- Users see only enabled methods; admins/owner see all (to manage the disabled
-- ones in the console).
create policy "support_methods: read enabled or admin" on support_methods
  for select to authenticated using (enabled or public.is_admin());

-- Owner-only writes.
create policy "support_methods: insert owner" on support_methods
  for insert to authenticated with check (public.is_owner());
create policy "support_methods: update owner" on support_methods
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "support_methods: delete owner" on support_methods
  for delete to authenticated using (public.is_owner());

-- Seed the two methods we already shipped in code. TON starts disabled + blank
-- until the owner fills in an address.
insert into support_methods (kind, label, hint, network, value, enabled, sort_order) values
  ('link',   'Boosty', 'One-off tip or monthly support', null,  'https://boosty.to/sorakield', true,  0),
  ('crypto', 'TON',    'The Open Network',               'TON', '',                            false, 1);
