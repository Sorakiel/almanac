import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { lastNDateKeys } from '@/lib/date'
import { fetchHabits, fetchLogsSince } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { computeInsights } from '@/features/insights/lib/computeInsights'
import type { Insights, InsightRange } from '@/features/insights/types'

/**
 * History depth: 60 days for current-vs-previous 30d rates, plus streak
 * headroom. Also the ceiling for the "all" range — fine for now, this app is
 * only weeks old, but revisit if "all" needs to reach further back.
 */
const FETCH_DAYS = 90

interface UseInsightsResult {
  insights: Insights | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Completion trends, streaks, and per-habit rates derived from habit logs. */
export function useInsights(range: InsightRange = '30d'): UseInsightsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const enabled = Boolean(userId)
  const windowKeys = lastNDateKeys(dateKey, FETCH_DAYS)

  const from = windowKeys[0]!

  // Same call, same key as the habit list: the app shell keeps `useHabits`
  // mounted, so this used to refetch a list already sitting in the cache.
  const habitsQuery = useQuery({
    queryKey: habitKeys.all(userId),
    queryFn: () => fetchHabits(userId),
    enabled,
  })

  // The logs, by contrast, stay a separate entry on purpose. Insights needs 90
  // days, the dashboard 64; sharing would mean making the screen people open
  // every day carry a month of history it never renders.
  const logsQuery = useQuery({
    queryKey: habitKeys.logsSince(userId, from),
    queryFn: () => fetchLogsSince(userId, from),
    enabled,
  })

  const insights =
    habitsQuery.data && logsQuery.data
      ? computeInsights(habitsQuery.data, logsQuery.data, windowKeys, range)
      : null

  return {
    insights,
    isLoading: habitsQuery.isLoading || logsQuery.isLoading,
    isError: habitsQuery.isError || logsQuery.isError,
    refetch: () => {
      void habitsQuery.refetch()
      void logsQuery.refetch()
    },
  }
}
