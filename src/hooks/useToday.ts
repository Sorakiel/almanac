import { useEffect, useMemo } from 'react'
import { browserTimezone, formatLongDate } from '@/lib/date'
import { setDayClockTimezone, useDayKey } from '@/hooks/useDayKey'
import { useProfile } from '@/features/settings/hooks/useProfile'

interface Today {
  /** IANA timezone used to derive the local day. */
  timezone: string
  /** Local calendar date as `YYYY-MM-DD` — the habit_logs.date key. */
  dateKey: string
  /** Display string, e.g. "Monday, 8 July". */
  longDate: string
}

/**
 * The user's "today". Derives from the saved `profiles.timezone` when it's
 * loaded, falling back to the detected device zone — getting this wrong shifts
 * the streak boundary, so the explicit saved zone always wins.
 *
 * The date is live rather than resolved once at mount: `useDayKey` re-reads it
 * at local midnight and whenever the app returns to the foreground. Query keys
 * downstream embed `dateKey`, so a rollover moves every screen onto the new
 * day's data on its own.
 */
export function useToday(): Today {
  const { profile } = useProfile()
  const timezone = profile?.timezone ?? browserTimezone()
  const dateKey = useDayKey(timezone)

  // Keep the shared clock's midnight alarm on the user's real zone, not the
  // device's — they differ whenever someone travels or overrides it in settings.
  useEffect(() => {
    setDayClockTimezone(timezone)
  }, [timezone])

  return useMemo(
    () => ({
      timezone,
      dateKey,
      longDate: formatLongDate(timezone),
    }),
    [timezone, dateKey],
  )
}
