-- Planned rest between sets, for the workout set-editor (08B edit template).
alter table set_logs add column if not exists rest_seconds smallint;
comment on column set_logs.rest_seconds is 'Planned rest after the set, in seconds; null = no target.';
