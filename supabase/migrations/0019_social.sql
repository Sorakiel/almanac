-- Minimal social layer: friendships + an activity feed ("friend closed 5/5").
-- Friends-and-family scope: a small trusted circle sends friend requests, and
-- once accepted each can see the other's recent completions. Kept minimal and
-- RLS-first — the raw habit/log tables stay strictly owner-only; friends see
-- ONLY the lightweight, explicitly-emitted `activity_events` rows, never the
-- underlying data.

-- ---------------------------------------------------------------------------
-- friendships — one row per unordered pair, directed while pending
-- ---------------------------------------------------------------------------
create type friendship_status as enum ('pending', 'accepted');

create table friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status       friendship_status not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

-- One relationship per pair regardless of who sent the request — blocks both a
-- duplicate A→B and a crossing B→A.
create unique index friendships_pair_uidx
  on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on friendships (addressee_id, status);
create index friendships_requester_idx on friendships (requester_id, status);

-- Accepted-friendship check as SECURITY DEFINER so friend-scoped policies can
-- read friendships without recursing through their own RLS.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a)
      )
  );
$$;

alter table friendships enable row level security;

-- Either party sees the row; admins see all (for the console).
create policy "friendships: select party" on friendships
  for select using (
    requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin()
  );
-- You send your own requests, always starting pending.
create policy "friendships: insert own request" on friendships
  for insert with check (requester_id = auth.uid() and status = 'pending');
-- Only the addressee acts on an incoming request (accept).
create policy "friendships: addressee responds" on friendships
  for update using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
-- Either party can remove: cancel a request, reject one, or unfriend.
create policy "friendships: either removes" on friendships
  for delete using (requester_id = auth.uid() or addressee_id = auth.uid());

-- True if any friendship row (pending OR accepted) links auth.uid() and target.
-- SECURITY DEFINER so the profile policy below can consult friendships without
-- tripping its own RLS. Covers pending requests both ways, so a request card can
-- show the counterparty's name before the two are accepted friends.
create or replace function public.is_connected(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where (f.requester_id = auth.uid() and f.addressee_id = target)
       or (f.addressee_id = auth.uid() and f.requester_id = target)
  );
$$;

-- Connected users (friends + pending either way) may read each other's profile
-- name/avatar for the friend list, request cards, and feed.
create policy "profiles: select connected" on profiles
  for select using (public.is_connected(id));

-- ---------------------------------------------------------------------------
-- activity_events — the feed source, emitted client-side on notable moments
-- ---------------------------------------------------------------------------
create table activity_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null,                       -- 'habit_completed' | 'day_completed'
  habit_id   uuid references habits (id) on delete cascade,
  title      text,                                -- habit name (habit_completed)
  meta       jsonb not null default '{}'::jsonb,  -- { done, total } (day_completed)
  event_date date not null,                       -- the local day the event is about
  created_at timestamptz not null default now()
);
create index activity_events_user_created_idx on activity_events (user_id, created_at desc);
-- Idempotent emission: at most one completion event per habit per day, and one
-- day-closed event per day, so re-toggling never spams the feed.
create unique index activity_events_habit_day_uidx
  on activity_events (user_id, habit_id, event_date) where kind = 'habit_completed';
create unique index activity_events_day_uidx
  on activity_events (user_id, event_date) where kind = 'day_completed';

alter table activity_events enable row level security;

create policy "activity_events: select own or friend" on activity_events
  for select using (
    user_id = auth.uid() or public.are_friends(user_id, auth.uid()) or public.is_admin()
  );
create policy "activity_events: insert own" on activity_events
  for insert with check (user_id = auth.uid());
create policy "activity_events: delete own" on activity_events
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- search_profiles — friend discovery. Profiles are otherwise owner-only, so a
-- SECURITY DEFINER lookup is the only way to find someone to befriend. Returns
-- a capped name-match list; requires ≥2 chars so it can't dump the directory.
-- ---------------------------------------------------------------------------
create or replace function public.search_profiles(q text)
returns table (id uuid, display_name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.avatar_url
  from public.profiles p
  where p.id <> auth.uid()
    and length(btrim(q)) >= 2
    and p.display_name ilike '%' || btrim(q) || '%'
  order by p.display_name
  limit 8;
$$;

grant execute on function public.search_profiles(text) to authenticated;
