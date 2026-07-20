-- Privacy pass on the activity feed. Friends must never see WHAT a habit is or
-- WHICH book you read — only privacy-safe signals: closed days, streak
-- milestones, and pages/chapters read. So the feed stops carrying habit names /
-- book titles entirely, and per-habit "completed X" events are dropped.

-- Names/titles must never be persisted in the feed.
alter table activity_events drop column if exists title;
-- habit_id was only used to dedup the now-removed habit_completed events, and it
-- linked a feed row to a specific habit. Replace it with an opaque, un-joinable
-- subject id (a habit or book id) used purely for per-day dedup.
drop index if exists activity_events_habit_day_uidx;
alter table activity_events drop column if exists habit_id;
alter table activity_events add column if not exists subject uuid;

-- Purge any legacy per-habit completion rows.
delete from activity_events where kind = 'habit_completed';

-- Dedup: one event per (kind, subject) per local day for subject-scoped events
-- (streaks, reading); day_completed stays one-per-day via its own index.
create unique index if not exists activity_events_subject_day_uidx
  on activity_events (user_id, kind, subject, event_date) where subject is not null;
