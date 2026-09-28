import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { addDaysToKey } from '@/lib/date'
import { fetchRecentReadingSessions } from '@/features/reading/api/sessions.api'
import { readingKeys } from '@/features/reading/hooks/queryKeys'
import { RECENT_DAYS } from '@/features/reading/lib/rhythm'
import type { ReadingSession } from '@/features/reading/types'

/** Every book's reading sessions over the last weeks — rhythm and streak. */
export function useRecentReading(): { sessions: ReadingSession[]; isLoading: boolean } {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const query = useQuery({
    queryKey: readingKeys.recent(userId),
    queryFn: () => fetchRecentReadingSessions(userId, addDaysToKey(dateKey, -RECENT_DAYS)),
    enabled: Boolean(userId),
  })
  return { sessions: query.data ?? [], isLoading: query.isLoading }
}
