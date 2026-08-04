import type { Locale } from '@/i18n'

/**
 * BCP-47 tag for `Intl` from the interface language. `en-GB` rather than `en`
 * because the whole app is laid out day-before-month, which is also what
 * Russian does — switching languages must not reorder the date.
 */
export function intlLocale(locale: Locale): string {
  return locale === 'ru' ? 'ru-RU' : 'en-GB'
}
