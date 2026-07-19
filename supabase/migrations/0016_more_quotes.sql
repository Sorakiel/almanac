-- Expand the global quote pool. The dashboard rotates one quote per day by
-- day-of-year, so a 7-quote pool repeats weekly; this grows it past 50 so the
-- rotation stays fresh for months. Idempotent: each row inserts only when its
-- text isn't already present, so re-running never duplicates.

insert into quotes (text, author)
select v.text, v.author
from (
  values
    ('Success is the sum of small efforts repeated day in and day out.', 'Robert Collier'),
    ('It does not matter how slowly you go as long as you do not stop.', 'Confucius'),
    ('The best time to plant a tree was twenty years ago. The second best time is now.', 'Chinese Proverb'),
    ('Well done is better than well said.', 'Benjamin Franklin'),
    ('Do something today that your future self will thank you for.', 'Anonymous'),
    ('A year from now you may wish you had started today.', 'Karen Lamb'),
    ('Fall seven times, stand up eight.', 'Japanese Proverb'),
    ('Quality is not an act, it is a habit.', 'Aristotle'),
    ('The journey of a thousand miles begins with a single step.', 'Lao Tzu'),
    ('What you do every day matters more than what you do once in a while.', 'Gretchen Rubin'),
    ('Discipline is the bridge between goals and accomplishment.', 'Jim Rohn'),
    ('You will never always be motivated. You have to learn to be disciplined.', 'Anonymous'),
    ('Consistency is what transforms average into excellence.', 'Anonymous'),
    ('Little by little, one travels far.', 'J.R.R. Tolkien'),
    ('Habits are the compound interest of self-improvement.', 'James Clear'),
    ('Either you run the day or the day runs you.', 'Jim Rohn'),
    ('The pain of discipline weighs ounces; the pain of regret weighs tons.', 'Anonymous'),
    ('Start where you are. Use what you have. Do what you can.', 'Arthur Ashe'),
    ('Energy and persistence conquer all things.', 'Benjamin Franklin'),
    ('We first make our habits, and then our habits make us.', 'John Dryden'),
    ('Continuous improvement is better than delayed perfection.', 'Mark Twain'),
    ('Do the hard jobs first. The easy jobs will take care of themselves.', 'Dale Carnegie'),
    ('You do not have to be great to start, but you have to start to be great.', 'Zig Ziglar'),
    ('Perseverance is not a long race; it is many short races one after another.', 'Walter Elliot'),
    ('The secret of your future is hidden in your daily routine.', 'Mike Murdock'),
    ('Great things are done by a series of small things brought together.', 'Vincent van Gogh'),
    ('Amateurs sit and wait for inspiration; the rest of us just get up and go to work.', 'Stephen King'),
    ('Nothing will work unless you do.', 'Maya Angelou'),
    ('The difference between who you are and who you want to be is what you do.', 'Anonymous'),
    ('Action is the foundational key to all success.', 'Pablo Picasso'),
    ('Focus on being productive instead of busy.', 'Tim Ferriss'),
    ('Your habits will determine your future.', 'Jack Canfield'),
    ('Every action you take is a vote for the person you wish to become.', 'James Clear'),
    ('The man who moves a mountain begins by carrying away small stones.', 'Confucius'),
    ('Willpower is like a muscle: the more you train it, the stronger it gets.', 'Anonymous'),
    ('If you get tired, learn to rest, not to quit.', 'Banksy'),
    ('Slow progress is still progress.', 'Anonymous'),
    ('The expert in anything was once a beginner.', 'Helen Hayes'),
    ('Motivation is what gets you started. Habit is what keeps you going.', 'Jim Ryun'),
    ('Do not wait. The time will never be just right.', 'Napoleon Hill'),
    ('Success usually comes to those too busy to be looking for it.', 'Henry David Thoreau'),
    ('Courage does not always roar. Sometimes it is the quiet voice saying I will try again tomorrow.', 'Mary Anne Radmacher'),
    ('The only bad workout is the one that did not happen.', 'Anonymous'),
    ('Discipline equals freedom.', 'Jocko Willink'),
    ('Make each day your masterpiece.', 'John Wooden'),
    ('Dripping water hollows out stone, not through force but through persistence.', 'Ovid'),
    ('You are what you do, not what you say you will do.', 'Carl Jung'),
    ('One day or day one. You decide.', 'Anonymous'),
    ('The habit of persistence is the habit of victory.', 'Herbert Kaufman')
) as v (text, author)
where not exists (select 1 from quotes q where q.text = v.text);
