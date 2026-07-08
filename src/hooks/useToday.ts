import { useMemo } from 'react'
import { browserTimezone, formatLongDate, localDateKey } from '@/lib/date'

interface Today {
  /** IANA timezone used to derive the local day. */
  timezone: string
  /** Local calendar date as `YYYY-MM-DD` — the habit_logs.date key. */
  dateKey: string
  /** Display string, e.g. "Monday, 8 July". */
  longDate: string
}

/**
 * The user's "today". Uses the browser timezone in Phase 1; swap to
 * profiles.timezone once the settings module lands (CLAUDE.md §5).
 */
export function useToday(): Today {
  return useMemo(() => {
    const timezone = browserTimezone()
    return {
      timezone,
      dateKey: localDateKey(timezone),
      longDate: formatLongDate(timezone),
    }
  }, [])
}
