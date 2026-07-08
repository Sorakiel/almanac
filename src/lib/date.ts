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
