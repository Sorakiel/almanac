import { useQuery } from '@tanstack/react-query'
import { fetchFocusSessionsSince } from '@/features/flow/api/focusSessions.api'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'

/**
 * Focus minutes logged this calendar month, or null until loaded. Keyed under
 * `['insights', 'focus', userId]` like the week, so a logged block refreshes it.
 */
export function useFocusMonth(): number | null {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const monthStart = `${dateKey.slice(0, 8)}01`
  const query = useQuery({
    queryKey: ['insights', 'focus', userId, 'month', monthStart],
    queryFn: () => fetchFocusSessionsSince(userId, monthStart),
    enabled: Boolean(userId),
  })
  return query.data ? query.data.reduce((sum, row) => sum + row.minutes, 0) : null
}
