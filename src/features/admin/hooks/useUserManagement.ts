import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteUser, setUserRole } from '@/features/admin/api/admin.api'
import type { UserRole } from '@/features/admin/types'

interface UseUserManagementResult {
  setRole: (input: { target: string; role: UserRole }) => Promise<void>
  remove: (target: string) => Promise<void>
  isSettingRole: boolean
  isRemoving: boolean
}

/**
 * Owner appoints/demotes admins; admin/owner deletes users. All guards live in
 * the SECURITY DEFINER RPCs (migration 0007) — the UI only gates what it shows.
 * Both invalidate every admin query so the console reflects the change.
 */
export function useUserManagement(): UseUserManagementResult {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin'] })

  const roleMutation = useMutation({
    mutationFn: ({ target, role }: { target: string; role: UserRole }) => setUserRole(target, role),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (target: string) => deleteUser(target),
    onSuccess: invalidate,
  })

  return {
    setRole: roleMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isSettingRole: roleMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
}
