import { useQuery } from '@tanstack/react-query'
import {
  fetchFocusSessionsSince,
  type FocusSessionRow,
} from '@/features/flow/api/focusSessions.api'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { addDaysToKey } from '@/lib/date'

interface FocusWeekResult {
  /** This week's blocks, newest first. */
  rows: FocusSessionRow[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * The last seven days of focus blocks. Keyed under `['insights', 'focus',
 * userId]` so logging or undoing a block refreshes it with everything else.
 */
export function useFocusWeek(): FocusWeekResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const query = useQuery({
    queryKey: ['insights', 'focus', userId, 'week', dateKey],
    queryFn: () => fetchFocusSessionsSince(userId, addDaysToKey(dateKey, -6)),
    enabled: Boolean(userId),
  })
  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
