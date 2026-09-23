-- Almanac seed data.
-- Quotes are global (read-only to users) and safe to seed unconditionally.
-- The demo habit is only inserted if at least one user exists, and is attached
-- to the earliest-created user so a fresh local project has something to show.

insert into quotes (text, author, text_ru, author_ru)
select v.text, v.author, v.text_ru, v.author_ru
from (
  values
    ('Discipline is choosing between what you want now and what you want most.', 'Abraham Lincoln', 'Дисциплина — это выбор между тем, чего хочешь сейчас, и тем, чего хочешь больше всего.', 'Авраам Линкольн'),
    ('We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Will Durant', 'Мы — то, что мы делаем изо дня в день. Совершенство — не поступок, а привычка.', 'Уилл Дюрант'),
    ('The secret of getting ahead is getting started.', 'Mark Twain', 'Секрет продвижения вперёд — начать.', 'Марк Твен'),
    ('Small daily improvements are the key to staggering long-term results.', 'Anonymous', 'Маленькие ежедневные улучшения — ключ к ошеломляющим результатам в долгую.', 'Неизвестный автор'),
    ('You do not rise to the level of your goals. You fall to the level of your systems.', 'James Clear', 'Вы не поднимаетесь до уровня своих целей. Вы опускаетесь до уровня своих систем.', 'Джеймс Клир'),
    ('Motivation gets you going, but discipline keeps you growing.', 'John C. Maxwell', 'Мотивация помогает начать, а дисциплина — продолжать расти.', 'Джон Максвелл'),
    ('How we spend our days is, of course, how we spend our lives.', 'Annie Dillard', 'Как мы проводим дни, так мы, конечно, и проводим жизнь.', 'Энни Диллард'),
    ('Success is the sum of small efforts repeated day in and day out.', 'Robert Collier', 'Успех — это сумма небольших усилий, повторяемых изо дня в день.', 'Роберт Кольер'),
    ('It does not matter how slowly you go as long as you do not stop.', 'Confucius', 'Неважно, как медленно ты идёшь, главное — не останавливаться.', 'Конфуций'),
    ('The best time to plant a tree was twenty years ago. The second best time is now.', 'Chinese Proverb', 'Лучшее время посадить дерево было двадцать лет назад. Следующее лучшее время — сейчас.', 'Китайская пословица'),
    ('Well done is better than well said.', 'Benjamin Franklin', 'Хорошо сделать лучше, чем хорошо сказать.', 'Бенджамин Франклин'),
    ('Do something today that your future self will thank you for.', 'Anonymous', 'Сделайте сегодня то, за что вы будущий скажете спасибо.', 'Неизвестный автор'),
    ('A year from now you may wish you had started today.', 'Karen Lamb', 'Через год вы, возможно, пожалеете, что не начали сегодня.', 'Карен Лэмб'),
    ('Fall seven times, stand up eight.', 'Japanese Proverb', 'Упади семь раз — встань восемь.', 'Японская пословица'),
    ('Quality is not an act, it is a habit.', 'Aristotle', 'Качество — не поступок, а привычка.', 'Аристотель'),
    ('The journey of a thousand miles begins with a single step.', 'Lao Tzu', 'Путь в тысячу ли начинается с первого шага.', 'Лао-цзы'),
    ('What you do every day matters more than what you do once in a while.', 'Gretchen Rubin', 'То, что вы делаете каждый день, важнее того, что вы делаете время от времени.', 'Гретхен Рубин'),
    ('Discipline is the bridge between goals and accomplishment.', 'Jim Rohn', 'Дисциплина — это мост между целями и достижениями.', 'Джим Рон'),
    ('You will never always be motivated. You have to learn to be disciplined.', 'Anonymous', 'Мотивация не будет с вами всегда. Нужно научиться дисциплине.', 'Неизвестный автор'),
    ('Consistency is what transforms average into excellence.', 'Anonymous', 'Постоянство превращает среднее в превосходное.', 'Неизвестный автор'),
    ('Little by little, one travels far.', 'J.R.R. Tolkien', 'Шаг за шагом уходишь далеко.', 'Дж. Р. Р. Толкин'),
    ('Habits are the compound interest of self-improvement.', 'James Clear', 'Привычки — это сложный процент самосовершенствования.', 'Джеймс Клир'),
    ('Either you run the day or the day runs you.', 'Jim Rohn', 'Либо вы управляете днём, либо день управляет вами.', 'Джим Рон'),
    ('The pain of discipline weighs ounces; the pain of regret weighs tons.', 'Anonymous', 'Боль дисциплины весит граммы, боль сожаления — тонны.', 'Неизвестный автор'),
    ('Start where you are. Use what you have. Do what you can.', 'Arthur Ashe', 'Начните там, где вы есть. Используйте то, что имеете. Делайте, что можете.', 'Артур Эш'),
    ('Energy and persistence conquer all things.', 'Benjamin Franklin', 'Энергия и настойчивость побеждают всё.', 'Бенджамин Франклин'),
    ('We first make our habits, and then our habits make us.', 'John Dryden', 'Сначала мы создаём свои привычки, а потом привычки создают нас.', 'Джон Драйден'),
    ('Continuous improvement is better than delayed perfection.', 'Mark Twain', 'Постоянное улучшение лучше отложенного совершенства.', 'Марк Твен'),
    ('Do the hard jobs first. The easy jobs will take care of themselves.', 'Dale Carnegie', 'Сначала делайте трудное. Лёгкое сделается само.', 'Дейл Карнеги'),
    ('You do not have to be great to start, but you have to start to be great.', 'Zig Ziglar', 'Не обязательно быть великим, чтобы начать, но нужно начать, чтобы стать великим.', 'Зиг Зиглар'),
    ('Perseverance is not a long race; it is many short races one after another.', 'Walter Elliot', 'Упорство — это не один длинный забег, а много коротких, один за другим.', 'Уолтер Эллиот'),
    ('The secret of your future is hidden in your daily routine.', 'Mike Murdock', 'Секрет вашего будущего спрятан в вашем распорядке дня.', 'Майк Мёрдок'),
    ('Great things are done by a series of small things brought together.', 'Vincent van Gogh', 'Великое складывается из множества малых дел.', 'Винсент ван Гог'),
    ('Amateurs sit and wait for inspiration; the rest of us just get up and go to work.', 'Stephen King', 'Любители сидят и ждут вдохновения, а остальные просто встают и идут работать.', 'Стивен Кинг'),
    ('Nothing will work unless you do.', 'Maya Angelou', 'Ничего не заработает, пока не заработаете вы.', 'Майя Энджелоу'),
    ('The difference between who you are and who you want to be is what you do.', 'Anonymous', 'Разница между тем, кто вы есть, и тем, кем хотите быть, — в том, что вы делаете.', 'Неизвестный автор'),
    ('Action is the foundational key to all success.', 'Pablo Picasso', 'Действие — основа любого успеха.', 'Пабло Пикассо'),
    ('Focus on being productive instead of busy.', 'Tim Ferriss', 'Стремитесь быть продуктивным, а не занятым.', 'Тим Феррис'),
    ('Your habits will determine your future.', 'Jack Canfield', 'Ваши привычки определят ваше будущее.', 'Джек Кэнфилд'),
    ('Every action you take is a vote for the person you wish to become.', 'James Clear', 'Каждое ваше действие — это голос за человека, которым вы хотите стать.', 'Джеймс Клир'),
    ('The man who moves a mountain begins by carrying away small stones.', 'Confucius', 'Тот, кто сдвигает гору, начинает с того, что уносит мелкие камни.', 'Конфуций'),
    ('Willpower is like a muscle: the more you train it, the stronger it gets.', 'Anonymous', 'Сила воли — как мышца: чем больше тренируешь, тем она сильнее.', 'Неизвестный автор'),
    ('If you get tired, learn to rest, not to quit.', 'Banksy', 'Если устали — научитесь отдыхать, а не сдаваться.', 'Бэнкси'),
    ('Slow progress is still progress.', 'Anonymous', 'Медленный прогресс — всё равно прогресс.', 'Неизвестный автор'),
    ('The expert in anything was once a beginner.', 'Helen Hayes', 'Любой эксперт когда-то был новичком.', 'Хелен Хейс'),
    ('Motivation is what gets you started. Habit is what keeps you going.', 'Jim Ryun', 'Мотивация помогает начать. Привычка помогает продолжать.', 'Джим Рюн'),
    ('Do not wait. The time will never be just right.', 'Napoleon Hill', 'Не ждите. Идеального момента не будет никогда.', 'Наполеон Хилл'),
    ('Success usually comes to those too busy to be looking for it.', 'Henry David Thoreau', 'Успех обычно приходит к тем, кто слишком занят, чтобы его искать.', 'Генри Дэвид Торо'),
    ('Courage does not always roar. Sometimes it is the quiet voice saying I will try again tomorrow.', 'Mary Anne Radmacher', 'Смелость не всегда рычит. Иногда это тихий голос, который говорит: «Завтра попробую снова».', 'Мэри Энн Радмахер'),
    ('The only bad workout is the one that did not happen.', 'Anonymous', 'Плохая тренировка только одна — та, которой не было.', 'Неизвестный автор'),
    ('Discipline equals freedom.', 'Jocko Willink', 'Дисциплина — это свобода.', 'Джоко Виллинк'),
    ('Make each day your masterpiece.', 'John Wooden', 'Сделайте каждый день своим шедевром.', 'Джон Вуден'),
    ('Dripping water hollows out stone, not through force but through persistence.', 'Ovid', 'Капля камень точит не силой, а частым падением.', 'Овидий'),
    ('You are what you do, not what you say you will do.', 'Carl Jung', 'Вы — то, что вы делаете, а не то, что обещаете сделать.', 'Карл Юнг'),
    ('One day or day one. You decide.', 'Anonymous', '«Когда-нибудь» или «день первый». Решать вам.', 'Неизвестный автор'),
    ('The habit of persistence is the habit of victory.', 'Herbert Kaufman', 'Привычка к упорству — это привычка побеждать.', 'Герберт Кауфман')
) as v (text, author, text_ru, author_ru)
where not exists (select 1 from quotes q where q.text = v.text);

-- Demo habit for the first user (no-op on an empty auth.users table).
insert into habits (user_id, name, description, icon, color, frequency, target_count, sort_order)
select id, 'Drink water', 'Eight glasses a day', 'droplet', '#2A9D8F', 'x_per_week', 8, 0
from auth.users
order by created_at
limit 1
on conflict do nothing;
