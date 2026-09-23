-- Russian quotes. The quote of the day is the one English sentence left on a
-- Russian screen once the interface is translated, so each quote gets its own
-- Russian text and author. Nullable on purpose: a quote without a translation
-- is hidden in the Russian interface rather than shown in English.
--
-- Matched on the English text, because ids differ between projects. A quote
-- that is not in this list keeps nulls and simply never shows in Russian.

alter table quotes
  add column if not exists text_ru text,
  add column if not exists author_ru text;

comment on column quotes.text_ru is 'Russian text; null hides the quote in the Russian interface.';
comment on column quotes.author_ru is 'Author as written in Russian; null falls back to the original.';

update quotes q
set text_ru = v.text_ru, author_ru = v.author_ru
from (
  values
    ('Discipline is choosing between what you want now and what you want most.', 'Дисциплина — это выбор между тем, чего хочешь сейчас, и тем, чего хочешь больше всего.', 'Авраам Линкольн'),
    ('We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Мы — то, что мы делаем изо дня в день. Совершенство — не поступок, а привычка.', 'Уилл Дюрант'),
    ('The secret of getting ahead is getting started.', 'Секрет продвижения вперёд — начать.', 'Марк Твен'),
    ('Small daily improvements are the key to staggering long-term results.', 'Маленькие ежедневные улучшения — ключ к ошеломляющим результатам в долгую.', 'Неизвестный автор'),
    ('You do not rise to the level of your goals. You fall to the level of your systems.', 'Вы не поднимаетесь до уровня своих целей. Вы опускаетесь до уровня своих систем.', 'Джеймс Клир'),
    ('Motivation gets you going, but discipline keeps you growing.', 'Мотивация помогает начать, а дисциплина — продолжать расти.', 'Джон Максвелл'),
    ('How we spend our days is, of course, how we spend our lives.', 'Как мы проводим дни, так мы, конечно, и проводим жизнь.', 'Энни Диллард'),
    ('Success is the sum of small efforts repeated day in and day out.', 'Успех — это сумма небольших усилий, повторяемых изо дня в день.', 'Роберт Кольер'),
    ('It does not matter how slowly you go as long as you do not stop.', 'Неважно, как медленно ты идёшь, главное — не останавливаться.', 'Конфуций'),
    ('The best time to plant a tree was twenty years ago. The second best time is now.', 'Лучшее время посадить дерево было двадцать лет назад. Следующее лучшее время — сейчас.', 'Китайская пословица'),
    ('Well done is better than well said.', 'Хорошо сделать лучше, чем хорошо сказать.', 'Бенджамин Франклин'),
    ('Do something today that your future self will thank you for.', 'Сделайте сегодня то, за что вы будущий скажете спасибо.', 'Неизвестный автор'),
    ('A year from now you may wish you had started today.', 'Через год вы, возможно, пожалеете, что не начали сегодня.', 'Карен Лэмб'),
    ('Fall seven times, stand up eight.', 'Упади семь раз — встань восемь.', 'Японская пословица'),
    ('Quality is not an act, it is a habit.', 'Качество — не поступок, а привычка.', 'Аристотель'),
    ('The journey of a thousand miles begins with a single step.', 'Путь в тысячу ли начинается с первого шага.', 'Лао-цзы'),
    ('What you do every day matters more than what you do once in a while.', 'То, что вы делаете каждый день, важнее того, что вы делаете время от времени.', 'Гретхен Рубин'),
    ('Discipline is the bridge between goals and accomplishment.', 'Дисциплина — это мост между целями и достижениями.', 'Джим Рон'),
    ('You will never always be motivated. You have to learn to be disciplined.', 'Мотивация не будет с вами всегда. Нужно научиться дисциплине.', 'Неизвестный автор'),
    ('Consistency is what transforms average into excellence.', 'Постоянство превращает среднее в превосходное.', 'Неизвестный автор'),
    ('Little by little, one travels far.', 'Шаг за шагом уходишь далеко.', 'Дж. Р. Р. Толкин'),
    ('Habits are the compound interest of self-improvement.', 'Привычки — это сложный процент самосовершенствования.', 'Джеймс Клир'),
    ('Either you run the day or the day runs you.', 'Либо вы управляете днём, либо день управляет вами.', 'Джим Рон'),
    ('The pain of discipline weighs ounces; the pain of regret weighs tons.', 'Боль дисциплины весит граммы, боль сожаления — тонны.', 'Неизвестный автор'),
    ('Start where you are. Use what you have. Do what you can.', 'Начните там, где вы есть. Используйте то, что имеете. Делайте, что можете.', 'Артур Эш'),
    ('Energy and persistence conquer all things.', 'Энергия и настойчивость побеждают всё.', 'Бенджамин Франклин'),
    ('We first make our habits, and then our habits make us.', 'Сначала мы создаём свои привычки, а потом привычки создают нас.', 'Джон Драйден'),
    ('Continuous improvement is better than delayed perfection.', 'Постоянное улучшение лучше отложенного совершенства.', 'Марк Твен'),
    ('Do the hard jobs first. The easy jobs will take care of themselves.', 'Сначала делайте трудное. Лёгкое сделается само.', 'Дейл Карнеги'),
    ('You do not have to be great to start, but you have to start to be great.', 'Не обязательно быть великим, чтобы начать, но нужно начать, чтобы стать великим.', 'Зиг Зиглар'),
    ('Perseverance is not a long race; it is many short races one after another.', 'Упорство — это не один длинный забег, а много коротких, один за другим.', 'Уолтер Эллиот'),
    ('The secret of your future is hidden in your daily routine.', 'Секрет вашего будущего спрятан в вашем распорядке дня.', 'Майк Мёрдок'),
    ('Great things are done by a series of small things brought together.', 'Великое складывается из множества малых дел.', 'Винсент ван Гог'),
    ('Amateurs sit and wait for inspiration; the rest of us just get up and go to work.', 'Любители сидят и ждут вдохновения, а остальные просто встают и идут работать.', 'Стивен Кинг'),
    ('Nothing will work unless you do.', 'Ничего не заработает, пока не заработаете вы.', 'Майя Энджелоу'),
    ('The difference between who you are and who you want to be is what you do.', 'Разница между тем, кто вы есть, и тем, кем хотите быть, — в том, что вы делаете.', 'Неизвестный автор'),
    ('Action is the foundational key to all success.', 'Действие — основа любого успеха.', 'Пабло Пикассо'),
    ('Focus on being productive instead of busy.', 'Стремитесь быть продуктивным, а не занятым.', 'Тим Феррис'),
    ('Your habits will determine your future.', 'Ваши привычки определят ваше будущее.', 'Джек Кэнфилд'),
    ('Every action you take is a vote for the person you wish to become.', 'Каждое ваше действие — это голос за человека, которым вы хотите стать.', 'Джеймс Клир'),
    ('The man who moves a mountain begins by carrying away small stones.', 'Тот, кто сдвигает гору, начинает с того, что уносит мелкие камни.', 'Конфуций'),
    ('Willpower is like a muscle: the more you train it, the stronger it gets.', 'Сила воли — как мышца: чем больше тренируешь, тем она сильнее.', 'Неизвестный автор'),
    ('If you get tired, learn to rest, not to quit.', 'Если устали — научитесь отдыхать, а не сдаваться.', 'Бэнкси'),
    ('Slow progress is still progress.', 'Медленный прогресс — всё равно прогресс.', 'Неизвестный автор'),
    ('The expert in anything was once a beginner.', 'Любой эксперт когда-то был новичком.', 'Хелен Хейс'),
    ('Motivation is what gets you started. Habit is what keeps you going.', 'Мотивация помогает начать. Привычка помогает продолжать.', 'Джим Рюн'),
    ('Do not wait. The time will never be just right.', 'Не ждите. Идеального момента не будет никогда.', 'Наполеон Хилл'),
    ('Success usually comes to those too busy to be looking for it.', 'Успех обычно приходит к тем, кто слишком занят, чтобы его искать.', 'Генри Дэвид Торо'),
    ('Courage does not always roar. Sometimes it is the quiet voice saying I will try again tomorrow.', 'Смелость не всегда рычит. Иногда это тихий голос, который говорит: «Завтра попробую снова».', 'Мэри Энн Радмахер'),
    ('The only bad workout is the one that did not happen.', 'Плохая тренировка только одна — та, которой не было.', 'Неизвестный автор'),
    ('Discipline equals freedom.', 'Дисциплина — это свобода.', 'Джоко Виллинк'),
    ('Make each day your masterpiece.', 'Сделайте каждый день своим шедевром.', 'Джон Вуден'),
    ('Dripping water hollows out stone, not through force but through persistence.', 'Капля камень точит не силой, а частым падением.', 'Овидий'),
    ('You are what you do, not what you say you will do.', 'Вы — то, что вы делаете, а не то, что обещаете сделать.', 'Карл Юнг'),
    ('One day or day one. You decide.', '«Когда-нибудь» или «день первый». Решать вам.', 'Неизвестный автор'),
    ('The habit of persistence is the habit of victory.', 'Привычка к упорству — это привычка побеждать.', 'Герберт Кауфман')
) as v (text, text_ru, author_ru)
where q.text = v.text;
