import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { fetchReadingInsightsData } from '@/features/insights/api/readingInsights.api'
import { computeReadingInsights } from '@/features/insights/lib/computeReadingInsights'
import { useModulesStore } from '@/stores/modules'
import type { ReadingInsights } from '@/features/insights/types'

interface UseReadingInsightsResult {
  data: ReadingInsights | null
  isLoading: boolean
}

/** Reading stats (books, pages, minutes) — gated on the Reading module. */
export function useReadingInsights(): UseReadingInsightsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const readingEnabled = useModulesStore((s) => s.enabled.reading)

  const query = useQuery({
    queryKey: ['insights', 'reading', userId, dateKey],
    queryFn: () => fetchReadingInsightsData(userId),
    enabled: Boolean(userId) && readingEnabled,
  })

  return {
    data: query.data ? computeReadingInsights(query.data, dateKey) : null,
    isLoading: query.isLoading,
  }
}
