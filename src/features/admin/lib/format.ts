/** Whole days between two `YYYY-MM-DD` keys (constant math, no `Date.now`). */
function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number)
  const [ty, tm, td] = toKey.split('-').map(Number)
  const from = Date.UTC(fy ?? 1970, (fm ?? 1) - 1, fd ?? 1)
  const to = Date.UTC(ty ?? 1970, (tm ?? 1) - 1, td ?? 1)
  return Math.round((to - from) / 86_400_000)
}

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
  const [y, m, d] = created.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)),
  )
}

/** Two-letter initials for an avatar chip. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}
