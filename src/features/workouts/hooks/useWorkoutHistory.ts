import { useQuery } from '@tanstack/react-query'
import { fetchSessionHistory, type SessionHistoryRow } from '@/features/workouts/api/history.api'
import { workoutKeys } from '@/features/workouts/hooks/queryKeys'
import { useSession } from '@/hooks/useSession'

interface UseWorkoutHistoryResult {
  rows: SessionHistoryRow[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Finished sessions, newest first — the history list and the lift chart read it. */
export function useWorkoutHistory(): UseWorkoutHistoryResult {
  const { user } = useSession()
  const userId = user?.id ?? ''
  const query = useQuery({
    queryKey: workoutKeys.history(userId),
    queryFn: () => fetchSessionHistory(),
    enabled: Boolean(userId),
  })
  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
