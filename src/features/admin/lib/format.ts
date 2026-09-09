import { dateFromKey, daysBetween } from '@/lib/date'

/**
 * Day-granularity "joined" label relative to `todayKey`. Deliberately avoids
 * `Date.now()` (ESLint bans it in render) — recent joins read as "Nd ago",
 * older ones fall back to an absolute date.
 */
export function joinedLabel(createdAtIso: string, todayKey: string): string {
  const created = createdAtIso.slice(0, 10)
  const diff = daysBetween(created, todayKey)
  if (diff <= 0) return 'today'
  if (diff === 1) return '1d ago'
  if (diff < 30) return `${diff}d ago`
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    dateFromKey(created),
  )
}
