import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import {
  fetchGrantedIds,
  grantAchievement,
  revokeAchievement,
} from '@/features/achievements/api/grants.api'

/** Read + toggle a user's manual achievement grants (owner action, RLS-enforced). */
export function useUserGrants(userId: string, enabled: boolean) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const grantedBy = user?.id ?? ''
  const key = ['achievementGrants', userId]

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchGrantedIds(userId),
    enabled: enabled && Boolean(userId),
  })

  const toggle = useMutation({
    mutationFn: ({ achievementId, on }: { achievementId: string; on: boolean }) =>
      on
        ? grantAchievement(userId, achievementId, grantedBy)
        : revokeAchievement(userId, achievementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key })
      void queryClient.invalidateQueries({ queryKey: ['achievements', userId] })
    },
  })

  return {
    granted: new Set(query.data ?? []),
    isLoading: query.isLoading,
    toggle,
  }
}
