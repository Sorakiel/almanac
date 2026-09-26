-- Quantitative habits (v0.6 Phase 4): "8 glasses a day".
--
-- `target_count` already means two different things — the interval of an
-- every-N cadence and the times-per-week of x_per_week — and the client also
-- read it as "taps to complete a day" for everything else. A daily amount
-- needs its own column so a 3×/week habit can also be "20 pages" each time.
--
-- `daily_goal`: how many units close one day. 1 = an ordinary check-off.
-- `unit`: what is counted. A known key ('glasses', 'pages', 'minutes',
-- 'times') is pluralised by the client; anything else is the user's own
-- word, shown as typed. Null = no unit.
--
-- Backfill: a daily / weekdays / weekly habit with target_count > 1 was a
-- multi-tap habit, so that count becomes its goal. x_per_week is deliberately
-- left at 1: its target_count is times per *week*, and reading it as taps per
-- day (the quick form's "3 times a week" since #73) made each of those days
-- need three taps to count. Interval cadences were always one tap.
--
-- No new RLS policy: the habits policies are per row, not per column.

alter table public.habits
  add column if not exists daily_goal smallint not null default 1
    check (daily_goal between 1 and 999),
  add column if not exists unit text
    check (char_length(unit) between 1 and 16);

update public.habits
set daily_goal = least(target_count, 999)
where frequency in ('daily', 'weekdays', 'weekly')
  and target_count > 1;

comment on column public.habits.daily_goal is
  'Units that complete one day (habit_logs.count >= daily_goal); 1 = a plain check-off.';
comment on column public.habits.unit is
  'What daily_goal counts: a known key (glasses|pages|minutes|times) or free text; null = none.';
