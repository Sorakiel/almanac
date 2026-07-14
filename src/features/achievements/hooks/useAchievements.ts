import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { fetchAchievementData } from '@/features/achievements/api/achievements.api'
import { computeAchievementStats } from '@/features/achievements/lib/stats'
import { evaluateAll } from '@/features/achievements/lib/evaluate'
import type { EvaluatedAchievement } from '@/features/achievements/types'

/** Accounts created before this join the beta cohort (permanent for them). */
const BETA_CUTOFF = '2027-07-01'

interface UseAchievementsResult {
  achievements: EvaluatedAchievement[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Evaluate the achievement catalog against the user's live stats. */
export function useAchievements(): UseAchievementsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const { profile } = useProfile()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['achievements', userId],
    queryFn: () => fetchAchievementData(userId),
    enabled: Boolean(userId),
  })

  const betaUser = (profile?.created_at ?? user?.created_at ?? '9999').slice(0, 10) < BETA_CUTOFF

  const achievements = query.data
    ? evaluateAll(computeAchievementStats({ ...query.data, betaUser, todayKey: dateKey }))
    : []

  return {
    achievements,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
