-- Owner role + admin/owner user management.
--
-- Adds a top-tier `owner` role above `admin`. The owner can appoint/demote
-- admins and (like admins) read every user's data; admins can delete regular
-- users. Role changes and user deletion go through SECURITY DEFINER RPCs with
-- guards so the owner can never be locked out or removed via the app.
--
-- NOTE: `owner` is only ever assigned directly in the database (see the
-- one-off promote in a follow-up step) — the app can only toggle user<->admin.

-- 1. Extend the role enum. Adding the value in its own statement is fine; the
--    functions below only reference it inside plpgsql bodies (not executed at
--    migration time), so this stays safe within one migration.
alter type user_role add value if not exists 'owner';

-- 2. Admins AND owners get cross-user read access (owner is a superset of admin).
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  );
end;
$$;

-- 3. Owner check, used to gate role management.
create or replace function public.is_owner()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
end;
$$;

grant execute on function public.is_owner() to authenticated;

-- 4. Tighten the role-lock trigger: only the owner may change roles (was any
--    admin), only between user/admin, and the `owner` role itself can only be
--    granted/removed directly in the database. Service role (auth.uid() null)
--    is unrestricted so dashboard/migrations still work.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is null then
      return new;
    end if;
    if not public.is_owner() then
      raise exception 'Only the owner can change roles';
    end if;
    if new.role = 'owner' or old.role = 'owner' then
      raise exception 'The owner role can only be changed directly in the database';
    end if;
  end if;
  return new;
end;
$$;

-- 5. Owner appoints/demotes admins. Runs as definer but reads auth.uid() for the
--    caller, so the guards apply to whoever calls it.
create or replace function public.set_user_role(target uuid, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only the owner can change roles';
  end if;
  if new_role not in ('user', 'admin') then
    raise exception 'Role must be user or admin';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;
  if (select role from public.profiles where id = target) = 'owner' then
    raise exception 'The owner role cannot be changed here';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

revoke all on function public.set_user_role(uuid, user_role) from public, anon;
grant execute on function public.set_user_role(uuid, user_role) to authenticated;

-- 6. Admin/owner deletes a user. Deleting the auth.users row cascades to every
--    public table (all FKs are ON DELETE CASCADE). Guards: no self-delete, the
--    owner is never deletable, and only the owner may delete an admin.
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role user_role;
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete users';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot delete your own account here';
  end if;
  select role into target_role from public.profiles where id = target;
  if target_role is null then
    raise exception 'User not found';
  end if;
  if target_role = 'owner' then
    raise exception 'The owner account cannot be deleted';
  end if;
  if target_role = 'admin' and not public.is_owner() then
    raise exception 'Only the owner can delete an admin';
  end if;
  delete from auth.users where id = target;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;
