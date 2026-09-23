import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, ShieldMinus, ShieldPlus, Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { DeleteMemberConfirm } from '@/features/admin/components/DeleteMemberConfirm'
import { useMemberActions } from '@/features/admin/hooks/useMemberActions'
import type { MemberRow } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

interface MemberActionsSheetProps {
  member: MemberRow
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Only the owner may appoint/demote admins. */
  isOwner: boolean
  /** The signed-in admin/owner — used to forbid acting on your own row. */
  currentUserId: string
}

const ROW =
  'flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium hover:bg-surface'

/** Per-member actions: view detail, appoint/demote admin (owner), delete. */
export function MemberActionsSheet({
  member,
  open,
  onOpenChange,
  isOwner,
  currentUserId,
}: MemberActionsSheetProps) {
  const { t } = useT()
  const navigate = useNavigate()
  const actions = useMemberActions(member, isOwner, currentUserId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const close = () => onOpenChange(false)

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={member.name}
        description={t(`admin.roles.${member.role}`)}
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              close()
              navigate(`/admin/user/${member.id}`)
            }}
            className={ROW}
          >
            <ExternalLink className="h-4 w-4 text-muted" aria-hidden="true" />
            {t('admin.viewDetails')}
          </button>

          {actions.canManageRole ? (
            <button
              type="button"
              onClick={() => void actions.toggleAdmin(close)}
              disabled={actions.isSettingRole}
              className={`${ROW} disabled:opacity-60`}
            >
              {member.role === 'admin' ? (
                <ShieldMinus className="h-4 w-4 text-muted" aria-hidden="true" />
              ) : (
                <ShieldPlus className="h-4 w-4 text-accent" aria-hidden="true" />
              )}
              {member.role === 'admin' ? t('admin.removeAdmin') : t('admin.makeAdmin')}
            </button>
          ) : null}

          {actions.canDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={`${ROW} text-accent`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('admin.deleteUser')}
            </button>
          ) : null}

          {!actions.canManageRole && !actions.canDelete ? (
            <p className="px-4 py-2 text-sm text-muted-strong">{t('admin.noActions')}</p>
          ) : null}
        </div>
      </Sheet>

      <DeleteMemberConfirm
        name={member.name}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        pending={actions.isRemoving}
        onConfirm={() =>
          void actions.remove(() => {
            setConfirmDelete(false)
            close()
          })
        }
      />
    </>
  )
}
