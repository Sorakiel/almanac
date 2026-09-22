import { dateFromKey, daysBetween } from '@/lib/date'
import type { TFunction } from '@/hooks/useT'

/**
 * Day-granularity "joined" label relative to `todayKey`. Deliberately avoids
 * `Date.now()` (ESLint bans it in render) — recent joins read as "Nd ago",
 * older ones fall back to an absolute date.
 */
export function joinedLabel(
  createdAtIso: string,
  todayKey: string,
  t: TFunction,
  locale: string,
): string {
  const created = createdAtIso.slice(0, 10)
  const diff = daysBetween(created, todayKey)
  if (diff <= 0) return t('admin.today')
  if (diff < 30) return t('admin.daysAgo', { count: diff })
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
    dateFromKey(created),
  )
}
