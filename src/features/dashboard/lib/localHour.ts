/** Evening starts here: the reflection card joins Today from this hour on. */
export const EVENING_HOUR = 19

/** The hour (0–23) on the wall clock in `timezone` — the profile's zone, not the device's. */
export function localHour(timezone: string, instant: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(instant)
  return Number(hour)
}
