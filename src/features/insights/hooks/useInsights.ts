import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { lastNDateKeys } from '@/lib/date'
import { fetchHabits, fetchLogsSince } from '@/features/habits/api/habits.api'
import { computeInsights } from '@/features/insights/lib/computeInsights'
import type { Insights } from '@/features/insights/types'

/** History depth: 60 days for current-vs-previous 30d rates, plus streak headroom. */
const FETCH_DAYS = 90

interface UseInsightsResult {
  insights: Insights | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Completion trends, streaks, and per-habit rates derived from habit logs. */
export function useInsights(): UseInsightsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const enabled = Boolean(userId)
  const windowKeys = lastNDateKeys(dateKey, FETCH_DAYS)

  const habitsQuery = useQuery({
    queryKey: ['insights', 'habits', userId],
    queryFn: () => fetchHabits(userId),
    enabled,
  })

  const logsQuery = useQuery({
    queryKey: ['insights', 'logs', userId, dateKey],
    queryFn: () => fetchLogsSince(userId, windowKeys[0]!),
    enabled,
  })

  const insights =
    habitsQuery.data && logsQuery.data
      ? computeInsights(habitsQuery.data, logsQuery.data, windowKeys)
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
