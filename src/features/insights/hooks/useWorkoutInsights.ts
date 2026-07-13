import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { fetchWorkoutInsightsData } from '@/features/insights/api/workoutInsights.api'
import { computeWorkoutInsights } from '@/features/insights/lib/computeWorkoutInsights'
import type { WorkoutInsights } from '@/features/insights/types'
import { useModulesStore } from '@/stores/modules'

interface UseWorkoutInsightsResult {
  data: WorkoutInsights | null
  isLoading: boolean
}

/** Training stats (sessions, volume, top exercises, PRs) from the user's workouts. */
export function useWorkoutInsights(): UseWorkoutInsightsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  // Training stats belong to the Workouts module — hide them when it's off.
  const workoutsEnabled = useModulesStore((s) => s.enabled.workouts)

  const query = useQuery({
    queryKey: ['insights', 'workouts', userId, dateKey],
    queryFn: () => fetchWorkoutInsightsData(userId),
    enabled: Boolean(userId) && workoutsEnabled,
  })

  return {
    // Gate on the flag too: a disabled query keeps its last cached data, which
    // would otherwise keep the section visible after the module is switched off.
    data: workoutsEnabled && query.data ? computeWorkoutInsights(query.data, dateKey) : null,
    isLoading: query.isLoading,
  }
}
