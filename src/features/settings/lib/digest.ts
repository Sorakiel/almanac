import { intlLocale } from '@/lib/dateLocale'
import type { Locale } from '@/i18n'

/** Sunday..Saturday day-of-week names in the interface language, index 0 = Sunday. */
export function weekdayLabels(locale: Locale): string[] {
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    timeZone: 'UTC',
  })
  // 2023-01-01 was a Sunday (UTC) — a fixed reference week, just to read labels off.
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(Date.UTC(2023, 0, 1 + i))))
}
