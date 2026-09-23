import { toast } from 'sonner'
import { useUserManagement } from '@/features/admin/hooks/useUserManagement'
import type { UserRole } from '@/features/admin/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

interface Member {
  id: string
  name: string
  role: UserRole
}

interface MemberActions {
  /** Only the owner appoints/demotes, and never on the owner row or themselves. */
  canManageRole: boolean
  /** Admins delete users; only the owner deletes an admin. Never the owner/self. */
  canDelete: boolean
  toggleAdmin: (onDone?: () => void) => Promise<void>
  remove: (onDone?: () => void) => Promise<void>
  isSettingRole: boolean
  isRemoving: boolean
}

/** Role and delete actions on one member, with the permission rules and toasts. */
export function useMemberActions(
  member: Member,
  isOwner: boolean,
  currentUserId: string,
): MemberActions {
  const { t } = useT()
  const { setRole, remove, isSettingRole, isRemoving } = useUserManagement()
  const isSelf = member.id === currentUserId
  const isOwnerRow = member.role === 'owner'
  const vars = { name: member.name }

  return {
    canManageRole: isOwner && !isOwnerRow && !isSelf,
    canDelete: !isSelf && !isOwnerRow && (member.role === 'user' || isOwner),
    toggleAdmin: async (onDone) => {
      const next: UserRole = member.role === 'admin' ? 'user' : 'admin'
      try {
        await setRole({ target: member.id, role: next })
        toast.success(t(next === 'admin' ? 'admin.nowAdmin' : 'admin.nowMember', vars))
        onDone?.()
      } catch (error) {
        toast.error(toUserError(error, t, 'admin.roleFailed'))
      }
    },
    remove: async (onDone) => {
      try {
        await remove(member.id)
        toast.success(t('admin.deleted', vars))
        onDone?.()
      } catch (error) {
        toast.error(toUserError(error, t, 'admin.deleteFailed'))
      }
    },
    isSettingRole,
    isRemoving,
  }
}
