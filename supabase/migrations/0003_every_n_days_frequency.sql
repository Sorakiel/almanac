-- Interval habits: "once every N days". The interval N is stored in
-- habits.target_count (same slot x_per_week uses for its weekly target).
alter type habit_frequency add value if not exists 'every_n_days';
