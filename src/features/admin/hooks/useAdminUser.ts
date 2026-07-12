import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/hooks/useToday'
import { lastNDateKeys } from '@/lib/date'
import {
  fetchUserFeedback,
  fetchUserHabits,
  fetchUserLogsSince,
  fetchUserProfile,
} from '@/features/admin/api/admin.api'
import { computeUserDetail } from '@/features/admin/lib/computeUserDetail'
import type { AdminUserDetail } from '@/features/admin/types'

interface UseAdminUserResult {
  data: AdminUserDetail | null
  isLoading: boolean
  isError: boolean
}

/**
 * One user's admin detail — habits, feedback, and 30-day stats. `enabled` is
 * the admin/owner gate so the cross-user reads never fire for a normal user.
 */
export function useAdminUser(userId: string, enabled: boolean): UseAdminUserResult {
  const { dateKey } = useToday()

  const query = useQuery({
    queryKey: ['admin', 'user', userId, dateKey],
    enabled: enabled && Boolean(userId),
    queryFn: async (): Promise<AdminUserDetail> => {
      const sinceKey = lastNDateKeys(dateKey, 30)[0]!
      const [profile, habits, logs, feedback] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserHabits(userId),
        fetchUserLogsSince(userId, sinceKey),
        fetchUserFeedback(userId),
      ])
      return computeUserDetail(profile, habits, logs, feedback, dateKey)
    },
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
