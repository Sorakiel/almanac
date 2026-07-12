import { Tag } from '@/components/common/Tag'
import { initials, joinedLabel } from '@/features/admin/lib/format'
import type { MemberRow } from '@/features/admin/types'

interface MembersTableProps {
  members: MemberRow[]
  todayKey: string
}

/** Recent-signups table: avatar · name · role · joined. Scrolls on narrow. */
export function MembersTable({ members, todayKey }: MembersTableProps) {
  return (
    <div className="overflow-x-auto rounded-card border bg-surface">
      <div className="min-w-[380px]">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 border-b px-4 py-3 font-mono text-[10px] uppercase tracking-label text-muted-strong">
          <span>member</span>
          <span>role</span>
          <span>joined</span>
        </div>
        {members.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[2fr_1fr_1fr] items-center gap-3 border-b px-4 py-3 text-[13px] last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-border/20 font-mono text-[9px]"
              >
                {initials(m.name)}
              </span>
              <span className="truncate">{m.name}</span>
            </span>
            <span>
              <Tag tone={m.role === 'admin' ? 'accent' : 'muted'}>{m.role}</Tag>
            </span>
            <span className="font-mono text-[11px] text-muted-strong">
              {joinedLabel(m.joinedAt, todayKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
