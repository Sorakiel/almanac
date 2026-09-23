import { addDaysToKey, dateFromKey } from '@/lib/date'

/**
 * Friendly label for a `YYYY-MM-DD` key, e.g. "Monday, 8 July". Parsed as UTC so
 * the label never drifts by a day across timezones (the key is already local).
 */
export function reflectionDateLabel(dateKey: string, locale: string = 'en-GB'): string {
  const date = dateFromKey(dateKey)
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

/**
 * Compact label for a `YYYY-MM-DD` key, e.g. "MON · 07 JUL" — used in tight rail
 * cards where the full weekday/month name would wrap.
 */
export function reflectionDateShortLabel(dateKey: string, locale: string = 'en-GB'): string {
  const date = dateFromKey(dateKey)
  const weekday = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'short' }).format(
    date,
  )
  const dayMonth = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
  }).format(date)
  return `${weekday} · ${dayMonth}`.toUpperCase()
}

/**
 * Current journaling streak: consecutive local days with an entry, counting back
 * from `todayKey` (today may still be blank, so the run may start at yesterday).
 * `dateKeys` is the set of days that have a reflection.
 */
export function journalStreak(dateKeys: Set<string>, todayKey: string): number {
  let cursor = todayKey
  // If there's nothing for today yet, the streak can still run through yesterday.
  if (!dateKeys.has(cursor)) cursor = addDaysToKey(cursor, -1)
  let streak = 0
  while (dateKeys.has(cursor)) {
    streak += 1
    cursor = addDaysToKey(cursor, -1)
  }
  return streak
}
