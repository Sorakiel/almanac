-- Almanac seed data.
-- Quotes are global (read-only to users) and safe to seed unconditionally.
-- The demo habit is only inserted if at least one user exists, and is attached
-- to the earliest-created user so a fresh local project has something to show.

insert into quotes (text, author) values
  ('Discipline is choosing between what you want now and what you want most.', 'Abraham Lincoln'),
  ('We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Will Durant'),
  ('The secret of getting ahead is getting started.', 'Mark Twain'),
  ('Small daily improvements are the key to staggering long-term results.', 'Anonymous'),
  ('You do not rise to the level of your goals. You fall to the level of your systems.', 'James Clear'),
  ('Motivation gets you going, but discipline keeps you growing.', 'John C. Maxwell'),
  ('How we spend our days is, of course, how we spend our lives.', 'Annie Dillard')
on conflict do nothing;

-- Demo habit for the first user (no-op on an empty auth.users table).
insert into habits (user_id, name, description, icon, color, frequency, target_count, sort_order)
select id, 'Drink water', 'Eight glasses a day', 'droplet', '#2A9D8F', 'x_per_week', 8, 0
from auth.users
order by created_at
limit 1
on conflict do nothing;
