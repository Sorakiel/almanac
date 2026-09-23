import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { MemberActionsSheet } from '@/features/admin/components/MemberActionsSheet'
import { cn } from '@/lib/utils'
import type { MemberRow } from '@/features/admin/types'
import { RoleTag } from '@/features/admin/components/RoleTag'
import { useJoinedLabel } from '@/features/admin/hooks/useJoinedLabel'
import { useT } from '@/hooks/useT'

interface MembersTableProps {
  members: MemberRow[]
  todayKey: string
  /** Whether the viewer is the owner (controls role actions in the menu). */
  isOwner: boolean
  /** The signed-in admin/owner id — forbids acting on your own row. */
  currentUserId: string
}

/** Recent-signups table: click a row to open the user; ⋯ for admin actions. */
export function MembersTable({ members, todayKey, isOwner, currentUserId }: MembersTableProps) {
  const { t } = useT()
  const joined = useJoinedLabel()
  const navigate = useNavigate()
  const [active, setActive] = useState<MemberRow | null>(null)

  return (
    <div className="overflow-x-auto rounded-card border bg-surface">
      <div className="min-w-[520px]">
        <div className="grid grid-cols-[1.9fr_0.7fr_0.8fr_0.7fr_auto] gap-3 border-b px-4 py-3 font-mono text-[10px] uppercase tracking-label text-muted-strong">
          <span>{t('admin.colMember')}</span>
          <span>{t('admin.colRole')}</span>
          <span>{t('admin.colJoined')}</span>
          <span>{t('admin.colActive')}</span>
          <span className="sr-only">{t('admin.colActions')}</span>
        </div>
        {members.map((m) => (
          <div
            key={m.id}
            className="relative grid grid-cols-[1.9fr_0.7fr_0.8fr_0.7fr_auto] items-center gap-3 border-b px-4 py-3 text-[13px] transition-colors last:border-b-0 hover:bg-panel/60"
          >
            {/* Stretched overlay: the row opens the user's detail. */}
            <button
              type="button"
              onClick={() => navigate(`/admin/user/${m.id}`)}
              aria-label={t('admin.viewMember', { name: m.name })}
              className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            />
            <span className="flex min-w-0 items-center gap-2.5">
              <Avatar name={m.name} size="sm" className="h-6 w-6 rounded-md text-[9px]" />
              <span className="truncate">{m.name}</span>
              {m.id === currentUserId ? (
                <span className="font-mono text-[9px] uppercase tracking-label text-muted-strong">
                  {t('admin.you')}
                </span>
              ) : null}
            </span>
            <span>
              <RoleTag role={m.role} />
            </span>
            <span className="font-mono text-[11px] text-muted-strong">
              {joined(m.joinedAt, todayKey)}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-strong">
              <span
                aria-hidden="true"
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  m.isActiveToday ? 'bg-teal' : 'bg-muted-strong',
                )}
              />
              {m.isActiveToday ? t('admin.activeNow') : '—'}
            </span>
            <button
              type="button"
              onClick={() => setActive(m)}
              aria-label={t('admin.actionsFor', { name: m.name })}
              className="relative z-10 rounded-lg p-1.5 text-muted-strong transition-colors hover:bg-surface hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {active ? (
        <MemberActionsSheet
          member={active}
          open={Boolean(active)}
          onOpenChange={(open) => !open && setActive(null)}
          isOwner={isOwner}
          currentUserId={currentUserId}
        />
      ) : null}
    </div>
  )
}
