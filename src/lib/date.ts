/**
 * Date helpers. Instants are stored in UTC, but a habit's "today" is the user's
 * LOCAL calendar date — getting this wrong silently corrupts streaks, so the
 * local date is always derived from an explicit IANA timezone.
 */

/** The user's local calendar date as `YYYY-MM-DD` for the given timezone. */
export function localDateKey(timezone: string, instant: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the key shape we store.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

/** Day of week for a `YYYY-MM-DD` key: 0 = Sunday … 6 = Saturday (UTC-safe). */
export function weekdayOfKey(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay()
}

/** True when the date key falls on Saturday or Sunday. */
export function isWeekendKey(dateKey: string): boolean {
  const day = weekdayOfKey(dateKey)
  return day === 0 || day === 6
}

/** Resolve the browser's IANA timezone, falling back to UTC. */
export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

/** Human-friendly long date, e.g. "Monday, 8 July". */
export function formatLongDate(timezone: string, instant: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(instant)
}

/**
 * The last `n` local date keys ending at (and including) `endKey`, oldest→newest.
 * Operates on the `YYYY-MM-DD` string via UTC math to avoid timezone drift.
 */
export function lastNDateKeys(endKey: string, n: number): string[] {
  const [y, m, d] = endKey.split('-').map(Number)
  const end = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    keys.push(new Date(end - i * 86_400_000).toISOString().slice(0, 10))
  }
  return keys
}
