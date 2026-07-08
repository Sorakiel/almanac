-- handle_new_user() is only invoked by the on_auth_user_created trigger, never
-- directly. Revoke the default PUBLIC execute grant so it isn't callable as an
-- RPC endpoint. Triggers fire independent of role EXECUTE grants, so signup is
-- unaffected. is_admin() intentionally keeps its grant — RLS policies call it,
-- and policy expressions are evaluated with the querying role's privileges.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
