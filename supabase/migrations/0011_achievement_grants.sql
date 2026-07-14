-- Owner-awarded (manual) achievements. Auto achievements are derived from data;
-- these are bestowed by the owner and stored as grant rows. One row per
-- (user, achievement). Only the owner may grant/revoke; users read their own,
-- and admins may read all (for the admin console).

create table achievement_grants (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null,
  granted_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (user_id, achievement_id)
);
create index achievement_grants_user_idx on achievement_grants (user_id);

alter table achievement_grants enable row level security;

create policy "achievement_grants: select own or admin" on achievement_grants
  for select using (user_id = auth.uid() or public.is_admin());
create policy "achievement_grants: owner grants" on achievement_grants
  for insert with check (public.is_owner() and granted_by = auth.uid());
create policy "achievement_grants: owner revokes" on achievement_grants
  for delete using (public.is_owner());
