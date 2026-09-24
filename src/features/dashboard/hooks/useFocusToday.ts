import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { fetchFocusMinutesOn } from '@/features/dashboard/api/focusToday.api'

/**
 * Today's focused minutes. Keyed under `['insights', 'focus', userId]` on
 * purpose: logging a session invalidates that prefix, so the ring refills the
 * moment a block ends without the flow feature knowing this screen exists.
 */
export function useFocusToday(enabled: boolean): number {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['insights', 'focus', userId, 'today', dateKey],
    queryFn: () => fetchFocusMinutesOn(userId, dateKey),
    enabled: enabled && Boolean(userId),
  })
  return query.data ?? 0
}
