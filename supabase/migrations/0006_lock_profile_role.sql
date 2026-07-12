-- Fix: prevent privilege escalation via self role change.
--
-- The "profiles: update own" policy uses `with check (id = auth.uid())` with no
-- column guard, so ANY signed-in user can PATCH their own row to role='admin'
-- and then read every other user's data (admin-aware RLS grants cross-user
-- SELECT). This trigger blocks a non-admin session from changing `role`, while
-- still allowing admin sessions and service-role/dashboard edits (auth.uid() is
-- null for the service role, so the owner can still manage roles in Supabase).

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change a profile role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_role on public.profiles;
create trigger profiles_lock_role
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();
