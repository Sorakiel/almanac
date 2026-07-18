import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteFeedback, updateFeedbackStatus } from '@/features/admin/api/admin.api'
import type { FeedbackStatus } from '@/features/admin/types'

interface UseFeedbackManagementResult {
  setStatus: (input: { id: string; status: FeedbackStatus }) => Promise<void>
  remove: (id: string) => Promise<void>
  isUpdating: boolean
  isRemoving: boolean
}

/**
 * Admin/owner feedback triage: change status (resolve/reject/reopen) or delete.
 * Guards live in the RLS policies (migration 0015). Both invalidate every admin
 * query so the console overview and the per-user detail reflect the change.
 */
export function useFeedbackManagement(): UseFeedbackManagementResult {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin'] })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      updateFeedbackStatus(id, status),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: invalidate,
  })

  return {
    setStatus: statusMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isUpdating: statusMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
}
