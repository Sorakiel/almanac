import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { Tag } from '@/components/common/Tag'
import { MemberActionsSheet } from '@/features/admin/components/MemberActionsSheet'
import { initials, joinedLabel } from '@/features/admin/lib/format'
import type { MemberRow, UserRole } from '@/features/admin/types'

interface MembersTableProps {
  members: MemberRow[]
  todayKey: string
  /** Whether the viewer is the owner (controls role actions in the menu). */
  isOwner: boolean
  /** The signed-in admin/owner id — forbids acting on your own row. */
  currentUserId: string
}

const ROLE_TONE: Record<UserRole, 'accent' | 'muted' | 'teal'> = {
  owner: 'teal',
  admin: 'accent',
  user: 'muted',
}

/** Recent-signups table: click a row to open the user; ⋯ for admin actions. */
export function MembersTable({ members, todayKey, isOwner, currentUserId }: MembersTableProps) {
  const navigate = useNavigate()
  const [active, setActive] = useState<MemberRow | null>(null)

  return (
    <div className="overflow-x-auto rounded-card border bg-surface">
      <div className="min-w-[420px]">
        <div className="grid grid-cols-[1.9fr_0.8fr_0.9fr_auto] gap-3 border-b px-4 py-3 font-mono text-[10px] uppercase tracking-label text-muted-strong">
          <span>member</span>
          <span>role</span>
          <span>joined</span>
          <span className="sr-only">actions</span>
        </div>
        {members.map((m) => (
          <div
            key={m.id}
            className="relative grid grid-cols-[1.9fr_0.8fr_0.9fr_auto] items-center gap-3 border-b px-4 py-3 text-[13px] transition-colors last:border-b-0 hover:bg-panel/60"
          >
            {/* Stretched overlay: the row opens the user's detail. */}
            <button
              type="button"
              onClick={() => navigate(`/admin/user/${m.id}`)}
              aria-label={`View ${m.name}`}
              className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            />
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-border/20 font-mono text-[9px]"
              >
                {initials(m.name)}
              </span>
              <span className="truncate">{m.name}</span>
              {m.id === currentUserId ? (
                <span className="font-mono text-[9px] uppercase tracking-label text-muted-strong">
                  you
                </span>
              ) : null}
            </span>
            <span>
              <Tag tone={ROLE_TONE[m.role]}>{m.role}</Tag>
            </span>
            <span className="font-mono text-[11px] text-muted-strong">
              {joinedLabel(m.joinedAt, todayKey)}
            </span>
            <button
              type="button"
              onClick={() => setActive(m)}
              aria-label={`Actions for ${m.name}`}
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
