import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { fetchReflectInsightsData } from '@/features/insights/api/reflectInsights.api'
import { computeReflectInsights } from '@/features/insights/lib/computeReflectInsights'
import { useModulesStore } from '@/stores/modules'
import type { ReflectInsights } from '@/features/insights/types'

interface UseReflectInsightsResult {
  data: ReflectInsights | null
  isLoading: boolean
}

/** Journaling stats (entries, streak, consistency) — gated on the Reflect module. */
export function useReflectInsights(): UseReflectInsightsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const reflectEnabled = useModulesStore((s) => s.enabled.reflect)

  const query = useQuery({
    queryKey: ['insights', 'reflect', userId, dateKey],
    queryFn: () => fetchReflectInsightsData(userId),
    enabled: Boolean(userId) && reflectEnabled,
  })

  return {
    // Gate on the flag too: a disabled query keeps its last cached data, which
    // would otherwise keep the section visible after the module is switched off.
    data: reflectEnabled && query.data ? computeReflectInsights(query.data, dateKey) : null,
    isLoading: query.isLoading,
  }
}
