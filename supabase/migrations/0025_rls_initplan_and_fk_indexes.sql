-- Stop RLS policies re-evaluating auth calls once per row.
--
-- Every policy written so far calls `auth.uid()` (and often `is_admin()`)
-- bare. Postgres treats those as correlated per-row expressions, so a query
-- returning N rows calls them N times — 68 policies were flagged for it. The
-- fix is purely mechanical: wrap each call in a scalar subquery, which the
-- planner hoists into an InitPlan evaluated once per statement. Semantics are
-- unchanged; all three functions are STABLE.
--
-- Rewritten dynamically rather than by hand: 78 policies across 22 tables is
-- far too much surface to retype without introducing a typo in a security
-- rule, and pg_policies already holds the rendered expression.
--
-- Note the negative lookbehind. A first version guarded re-runs with a plain
-- "skip anything containing '( SELECT'", which silently skipped the eight
-- `EXISTS (SELECT 1 FROM …)` policies on workout_exercises and set_logs — the
-- ones that most needed it. Matching only *unwrapped* calls is both correct
-- and idempotent.
--
-- Left alone deliberately: `is_connected(id)` and `are_friends(user_id, …)`
-- take row-dependent arguments, so they genuinely must run per row and cannot
-- be hoisted.
do $$
declare
  r record;
  q text;
  c text;
  stmt text;
  roles_clause text;
  touched int := 0;
begin
  for r in
    select tablename, policyname, cmd, permissive, roles, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '')       ~ '(?<!SELECT )(auth\.uid|is_admin|is_owner)\(\)'
        or coalesce(with_check, '') ~ '(?<!SELECT )(auth\.uid|is_admin|is_owner)\(\)')
    order by tablename, policyname
  loop
    q := r.qual;
    c := r.with_check;

    if q is not null then
      q := regexp_replace(q, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'g');
      q := regexp_replace(q, '(?<!SELECT )is_admin\(\)',  '(select is_admin())',  'g');
      q := regexp_replace(q, '(?<!SELECT )is_owner\(\)',  '(select is_owner())',  'g');
    end if;
    if c is not null then
      c := regexp_replace(c, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'g');
      c := regexp_replace(c, '(?<!SELECT )is_admin\(\)',  '(select is_admin())',  'g');
      c := regexp_replace(c, '(?<!SELECT )is_owner\(\)',  '(select is_owner())',  'g');
    end if;

    -- `{public}` is the default; naming it explicitly in CREATE POLICY is not
    -- valid syntax, so only a non-default role list gets a TO clause.
    roles_clause := case
      when r.roles::text = '{public}' then ''
      else ' to ' || array_to_string(r.roles, ', ')
    end;

    execute format('drop policy %I on public.%I', r.policyname, r.tablename);

    stmt := format('create policy %I on public.%I as %s for %s%s',
                   r.policyname, r.tablename,
                   lower(r.permissive), lower(r.cmd), roles_clause);
    if q is not null then stmt := stmt || format(' using (%s)', q); end if;
    if c is not null then stmt := stmt || format(' with check (%s)', c); end if;
    execute stmt;

    touched := touched + 1;
  end loop;

  raise notice 'rewrote % policies', touched;
end
$$;

-- ---------------------------------------------------------------------------
-- Covering indexes for foreign keys that had none
-- ---------------------------------------------------------------------------
-- Without one, every delete of a parent row has to sequentially scan the child
-- table to enforce the constraint. Exactly these six lack cover; habit_logs
-- and reading_sessions look unindexed at a glance but are already covered by
-- their composite unique/lookup indexes.
create index if not exists achievement_grants_granted_by_idx on public.achievement_grants (granted_by);
create index if not exists book_notes_user_id_idx            on public.book_notes (user_id);
create index if not exists feedback_user_id_idx              on public.feedback (user_id);
create index if not exists habit_subtasks_user_id_idx        on public.habit_subtasks (user_id);
create index if not exists reflections_quote_id_idx          on public.reflections (quote_id);
create index if not exists workout_exercises_exercise_id_idx on public.workout_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- One SELECT policy on profiles instead of two
-- ---------------------------------------------------------------------------
-- Multiple permissive policies for the same role and action are OR-ed, but
-- each is evaluated separately for every row. `profiles` is read on nearly
-- every screen, so folding the two into a single expression removes a whole
-- pass. Same result, one evaluation.
drop policy if exists "profiles: select own" on public.profiles;
drop policy if exists "profiles: select connected" on public.profiles;

create policy "profiles: select own, connected or admin" on public.profiles
  for select using (
    id = (select auth.uid())
    or is_connected(id)
    or (select is_admin())
  );
