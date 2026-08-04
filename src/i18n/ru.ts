import type { Translations } from '@/i18n/types'

/**
 * Russian. Typed as `Translations`, so this file cannot drift from `en.ts`
 * without failing the build.
 *
 * House style: infinitives for actions ("Экспортировать" only where it is a
 * verb; nouns for section labels), «ты» is avoided entirely — the interface
 * addresses nobody directly, which is also how the English copy reads.
 */
export const ru: Translations = {
  nav: {
    today: 'Сегодня',
    habits: 'Привычки',
    insights: 'Аналитика',
    train: 'Тренировки',
    more: 'Ещё',
    hub: 'хаб',
    quickAdd: 'Быстро добавить',
    modules: 'Модули',
    primary: 'Основная навигация',
    openModule: 'Открыть «{name}»',
    showInNav: 'Показывать «{name}» в навигации',
    profileAndSettings: 'Профиль и настройки',
  },
  modules: {
    habits: { label: 'Привычки', description: 'Ежедневные отметки, серии и расписание.' },
    insights: { label: 'Аналитика', description: 'Тренды и выполнение по всем привычкам.' },
    workouts: { label: 'Тренировки', description: 'Планы, сессии и объём нагрузки.' },
    flow: { label: 'Фокус', description: 'Таймер глубокой работы для сфокусированных сессий.' },
    reflect: { label: 'Рефлексия', description: 'Дневник с настроением и цитатами.' },
    reading: { label: 'Чтение', description: 'Книги, страницы и серии чтения.' },
    social: { label: 'Друзья', description: 'Как идут серии у друзей.' },
  },
  rail: {
    commandCenter: 'командный центр',
    account: 'аккаунт',
    role: 'роль',
    joined: 'с нами',
    timezone: 'часовой пояс',
    owner: 'Владелец',
    admin: 'Админ',
    member: 'Участник',
    motto: 'Дисциплина — это практика, а не пункт назначения.',
  },
  settings: {
    appearance: 'Внешний вид',
    privacy: 'Приватность',
    you: 'Профиль',
    account: 'Аккаунт',
    desktop: 'Десктоп',
    admin: 'Админка',
    theme: 'Тема',
    dark: 'Тёмная',
    coffee: 'Кофейная',
    soundEffects: 'Звуки',
    usageAnalytics: 'Аналитика использования',
    usageAnalyticsHint:
      'Какие экраны открываются и сколько раз. Никогда — названия привычек, заметки и записи.',
    achievements: 'Достижения',
    support: 'Поддержать Almanac',
    timezone: 'Часовой пояс',
    dailyReminder: 'Ежедневное напоминание',
    exportData: 'Экспорт данных',
    runInBackground: 'Работать в фоне',
    adminConsole: 'Консоль администратора',
    signOut: 'Выйти',
    member: 'участник',
    joined: '{count} дн.',
    on: 'Вкл',
    off: 'Выкл',
    language: 'Язык',
    languageTitle: 'Язык',
    languageDescription:
      'Almanac переводится. Английский готов полностью, русский появляется экран за экраном.',
    languagePartial: 'Непереведённые экраны остаются на английском, пока их не доделают.',
  },
  export: {
    title: 'Экспорт данных',
    description: 'Данные принадлежат вам. Копию можно скачать в любой момент.',
    jsonTitle: 'Полный архив · JSON',
    jsonHint: 'Все привычки, отметки, тренировки, книги, заметки и рефлексии этого аккаунта.',
    csvTitle: 'Журнал привычек · CSV',
    csvHint: 'По строке на отметку — дата, привычка, счёт, заметка. Открывается в любой таблице.',
    localNote:
      'Файл собирается прямо в браузере и не покидает устройство, пока вы сами его куда-нибудь не отправите.',
    ready: 'Файл готов',
    failed: 'Не удалось выгрузить данные',
  },
  offline: {
    title: 'Нет сети.',
    body: 'Сохранённые данные доступны для чтения. Изменения сейчас не сохранятся — отметьте заново, когда связь вернётся.',
  },
  status: {
    online: 'на связи',
    offline: 'нет сети',
    syncing: 'синхронизация',
    habits: {
      one: '{count} привычка',
      few: '{count} привычки',
      many: '{count} привычек',
    },
  },
  errors: {
    signOut: 'Не удалось выйти',
  },
}
