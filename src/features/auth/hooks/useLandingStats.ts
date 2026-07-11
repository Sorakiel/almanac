import { useQuery } from '@tanstack/react-query'
import { fetchLandingStats, type LandingStats } from '@/features/auth/api/landingStats.api'

interface UseLandingStatsResult {
  stats: LandingStats | null
  isLoading: boolean
}

/** Community counters for the auth brand panel. Cached briefly; anon-safe. */
export function useLandingStats(): UseLandingStatsResult {
  const { data, isLoading } = useQuery({
    queryKey: ['landingStats'],
    queryFn: fetchLandingStats,
    staleTime: 1000 * 60 * 5,
  })

  return { stats: data ?? null, isLoading }
}
