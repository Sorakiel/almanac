import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/hooks/useToday'
import {
  countRows,
  fetchActiveUserIds,
  fetchAllFeedback,
  fetchAllProfiles,
} from '@/features/admin/api/admin.api'
import { computeAdmin } from '@/features/admin/lib/computeAdmin'
import type { AdminData } from '@/features/admin/types'

interface UseAdminDataResult {
  data: AdminData | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Workspace-wide admin read-out. `enabled` should be the admin gate result so
 * the cross-user queries never fire for a non-admin (they'd return only self).
 */
export function useAdminData(enabled: boolean): UseAdminDataResult {
  const { dateKey } = useToday()

  const query = useQuery({
    queryKey: ['admin', 'overview', dateKey],
    enabled,
    queryFn: async (): Promise<AdminData> => {
      const [profiles, activeIds, habits, logs, feedback] = await Promise.all([
        fetchAllProfiles(),
        fetchActiveUserIds(dateKey),
        countRows('habits'),
        countRows('habit_logs'),
        fetchAllFeedback(),
      ])
      return computeAdmin(profiles, activeIds, habits, logs, feedback, dateKey)
    },
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
