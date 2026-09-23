import type { Locale } from '@/i18n'

/**
 * BCP-47 tag for `Intl` from the interface language. `en-GB` rather than `en`
 * because the whole app is laid out day-before-month, which is also what
 * Russian does — switching languages must not reorder the date.
 */
export function intlLocale(locale: Locale): string {
  return locale === 'ru' ? 'ru-RU' : 'en-GB'
}

/** Sunday..Saturday day-of-week names in the interface language, index 0 = Sunday. */
export function weekdayLabels(locale: Locale, width: 'short' | 'long' = 'short'): string[] {
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), { weekday: width, timeZone: 'UTC' })
  // 2023-01-01 was a Sunday (UTC) — a fixed reference week, just to read labels off.
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(Date.UTC(2023, 0, 1 + i))))
}
