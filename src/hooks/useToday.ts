import { useMemo } from 'react'
import { browserTimezone, formatLongDate, localDateKey } from '@/lib/date'
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
 */
export function useToday(): Today {
  const { profile } = useProfile()
  const timezone = profile?.timezone ?? browserTimezone()

  return useMemo(
    () => ({
      timezone,
      dateKey: localDateKey(timezone),
      longDate: formatLongDate(timezone),
    }),
    [timezone],
  )
}
