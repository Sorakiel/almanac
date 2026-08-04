/**
 * The source dictionary. English is the reference: `ru.ts` is typed against this
 * shape, so a key added here and forgotten there is a compile error rather than
 * a blank label in production.
 *
 * A leaf is either a string or a plural set. `{name}` placeholders are filled by
 * `t(key, vars)`; `{count}` additionally selects the plural form.
 */
export const en = {
  nav: {
    today: 'Today',
    habits: 'Habits',
    insights: 'Insights',
    train: 'Train',
    more: 'More',
    hub: 'hub',
    quickAdd: 'Quick add',
    modules: 'Modules',
    primary: 'Primary',
    openModule: 'Open {name}',
    showInNav: 'Show {name} in navigation',
    profileAndSettings: 'Profile and settings',
  },
  modules: {
    habits: { label: 'Habits', description: 'Daily tracking, streaks, and schedules.' },
    insights: { label: 'Insights', description: 'Trends and completion across every habit.' },
    workouts: { label: 'Train', description: 'Workout plans, sessions, and volume.' },
    flow: { label: 'Flow', description: 'Deep-work timer for focused sessions.' },
    reflect: { label: 'Reflect', description: 'Daily journaling with mood and quotes.' },
    reading: { label: 'Reading', description: 'Track books, pages, and reading streaks.' },
    social: { label: 'Friends', description: "See how friends' streaks are going." },
  },
  rail: {
    commandCenter: 'command center',
    account: 'account',
    role: 'role',
    joined: 'joined',
    timezone: 'timezone',
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    motto: 'Discipline is a practice, not a destination.',
  },
  settings: {
    appearance: 'Appearance',
    privacy: 'Privacy',
    you: 'You',
    account: 'Account',
    desktop: 'Desktop',
    admin: 'Admin',
    theme: 'Theme',
    dark: 'Dark',
    coffee: 'Coffee',
    soundEffects: 'Sound effects',
    usageAnalytics: 'Usage analytics',
    usageAnalyticsHint:
      'Which screens get opened, and counts. Never habit names, notes, or entries.',
    achievements: 'Achievements',
    support: 'Support Almanac',
    timezone: 'Timezone',
    dailyReminder: 'Daily reminder',
    exportData: 'Export data',
    runInBackground: 'Run in background',
    adminConsole: 'Admin console',
    signOut: 'Sign out',
    member: 'member',
    joined: '{count}-day',
    on: 'On',
    off: 'Off',
    language: 'Language',
    languageTitle: 'Language',
    languageDescription:
      'Almanac is being translated. English is complete; Russian is landing screen by screen.',
    languagePartial: 'Untranslated screens stay in English until they are done.',
  },
  export: {
    title: 'Export data',
    description: 'Your data is yours. Download a copy at any time.',
    jsonTitle: 'Full archive · JSON',
    jsonHint: 'Every habit, log, workout, book, note and reflection on this account.',
    csvTitle: 'Habit log · CSV',
    csvHint: 'One row per check-off — date, habit, count, note. Opens in any spreadsheet.',
    localNote:
      'The file is built in your browser and never leaves the device unless you send it somewhere.',
    ready: 'Export ready',
    failed: 'Could not export your data',
  },
  offline: {
    title: 'Offline.',
    body: 'Your saved data is here to read. Anything you change now won’t be saved — log it again once you’re back.',
  },
  status: {
    online: 'online',
    offline: 'offline',
    syncing: 'syncing',
    habits: {
      one: '{count} habit',
      other: '{count} habits',
    },
  },
  errors: {
    signOut: 'Could not sign out',
  },
} as const
