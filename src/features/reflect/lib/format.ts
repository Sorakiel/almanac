/**
 * Friendly label for a `YYYY-MM-DD` key, e.g. "Monday, 8 July". Parsed as UTC so
 * the label never drifts by a day across timezones (the key is already local).
 */
export function reflectionDateLabel(dateKey: string, locale: string = 'en-GB'): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1))
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
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1))
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
  const [y, m, d] = todayKey.split('-').map(Number)
  let cursor = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  // If there's nothing for today yet, the streak can still run through yesterday.
  if (!dateKeys.has(new Date(cursor).toISOString().slice(0, 10))) cursor -= 86_400_000
  let streak = 0
  while (dateKeys.has(new Date(cursor).toISOString().slice(0, 10))) {
    streak += 1
    cursor -= 86_400_000
  }
  return streak
}
