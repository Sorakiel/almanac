import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { fetchWorkoutInsightsData } from '@/features/insights/api/workoutInsights.api'
import { computeWorkoutInsights } from '@/features/insights/lib/computeWorkoutInsights'
import type { WorkoutInsights } from '@/features/insights/types'

interface UseWorkoutInsightsResult {
  data: WorkoutInsights | null
  isLoading: boolean
}

/** Training stats (sessions, volume, top exercises, PRs) from the user's workouts. */
export function useWorkoutInsights(): UseWorkoutInsightsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['insights', 'workouts', userId, dateKey],
    queryFn: () => fetchWorkoutInsightsData(userId),
    enabled: Boolean(userId),
  })

  return {
    data: query.data ? computeWorkoutInsights(query.data, dateKey) : null,
    isLoading: query.isLoading,
  }
}
