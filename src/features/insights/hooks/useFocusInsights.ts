import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { fetchFocusInsightsData } from '@/features/insights/api/focusInsights.api'
import { computeFocusInsights } from '@/features/insights/lib/computeFocusInsights'
import { useModulesStore } from '@/stores/modules'
import type { FocusInsights } from '@/features/insights/types'

interface UseFocusInsightsResult {
  data: FocusInsights | null
  isLoading: boolean
}

/** Deep Work stats (focus hours, streak, heatmap) — gated on the Flow module. */
export function useFocusInsights(): UseFocusInsightsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const flowEnabled = useModulesStore((s) => s.enabled.flow)

  const query = useQuery({
    queryKey: ['insights', 'focus', userId, dateKey],
    queryFn: () => fetchFocusInsightsData(userId),
    enabled: Boolean(userId) && flowEnabled,
  })

  return {
    // Gate on the flag too: a disabled query keeps its last cached data, which
    // would otherwise keep the section visible after Flow is switched off.
    data: flowEnabled && query.data ? computeFocusInsights(query.data, dateKey) : null,
    isLoading: query.isLoading,
  }
}
