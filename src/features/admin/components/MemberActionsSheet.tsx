import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ExternalLink, ShieldMinus, ShieldPlus, Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { useUserManagement } from '@/features/admin/hooks/useUserManagement'
import type { MemberRow } from '@/features/admin/types'

interface MemberActionsSheetProps {
  member: MemberRow
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Only the owner may appoint/demote admins. */
  isOwner: boolean
  /** The signed-in admin/owner — used to forbid acting on your own row. */
  currentUserId: string
}

/** Per-member actions: view detail, appoint/demote admin (owner), delete. */
export function MemberActionsSheet({
  member,
  open,
  onOpenChange,
  isOwner,
  currentUserId,
}: MemberActionsSheetProps) {
  const navigate = useNavigate()
  const { setRole, remove, isSettingRole, isRemoving } = useUserManagement()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isSelf = member.id === currentUserId
  const isOwnerRow = member.role === 'owner'
  // Owner can toggle admin on anyone who isn't the owner or themselves.
  const canManageRole = isOwner && !isOwnerRow && !isSelf
  // Admins delete users; only the owner may delete an admin. Never the owner/self.
  const canDelete = !isSelf && !isOwnerRow && (member.role === 'user' || isOwner)

  const toggleAdmin = async () => {
    const next = member.role === 'admin' ? 'user' : 'admin'
    try {
      await setRole({ target: member.id, role: next })
      toast.success(
        next === 'admin' ? `${member.name} is now an admin` : `${member.name} is now a member`,
      )
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not change role')
    }
  }

  const confirmRemove = async () => {
    try {
      await remove(member.id)
      toast.success(`${member.name} deleted`)
      setConfirmDelete(false)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete user')
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} title={member.name} description={member.role}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              navigate(`/admin/user/${member.id}`)
            }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium hover:bg-surface"
          >
            <ExternalLink className="h-4 w-4 text-muted" aria-hidden="true" />
            View details
          </button>

          {canManageRole ? (
            <button
              type="button"
              onClick={toggleAdmin}
              disabled={isSettingRole}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium hover:bg-surface disabled:opacity-60"
            >
              {member.role === 'admin' ? (
                <>
                  <ShieldMinus className="h-4 w-4 text-muted" aria-hidden="true" />
                  Remove admin
                </>
              ) : (
                <>
                  <ShieldPlus className="h-4 w-4 text-accent" aria-hidden="true" />
                  Make admin
                </>
              )}
            </button>
          ) : null}

          {canDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-accent hover:bg-surface"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete user
            </button>
          ) : null}

          {!canManageRole && !canDelete ? (
            <p className="px-4 py-2 text-sm text-muted-strong">
              No actions available for this member.
            </p>
          ) : null}
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${member.name}?`}
        description="This permanently removes the account and all of their habits, logs, and feedback. This cannot be undone."
        confirmLabel={isRemoving ? 'Deleting…' : 'Delete user'}
        pending={isRemoving}
        onConfirm={confirmRemove}
      />
    </>
  )
}
