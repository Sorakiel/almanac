import { Crown, ShieldCheck } from 'lucide-react'
import { Tag } from '@/components/common/Tag'
import { RailCard, RailNote, RailRow } from '@/components/rail/RailCard'
import { RailIdentity } from '@/components/rail/RailIdentity'
import { joinedLabel } from '@/features/admin/lib/format'
import type { AdminData, FeedbackStatus } from '@/features/admin/types'

interface AdminRailProps {
  data: AdminData
  /** The viewer is the owner — unlocks role management, shown in the header. */
  isOwner: boolean
  todayKey: string
}

const STATUS_TONE: Record<FeedbackStatus, 'accent' | 'teal' | 'amber' | 'muted'> = {
  open: 'amber',
  planned: 'accent',
  done: 'teal',
  closed: 'muted',
}

/** Desktop Admin context rail: workspace counters, feedback, caution note. */
export function AdminRail({ data, isOwner, todayKey }: AdminRailProps) {
  const { overview, feedback } = data
  return (
    <div className="flex flex-col gap-3.5">
      <RailIdentity
        icon={isOwner ? Crown : ShieldCheck}
        tone={isOwner ? 'bg-teal/15 text-teal' : 'bg-accent/15 text-accent'}
        title={isOwner ? 'Owner' : 'Admin'}
        subtitle={isOwner ? 'full control' : 'workspace tools'}
      />

      <RailCard label="this workspace">
        <RailRow label="members" value={String(overview.totalMembers)} />
        <RailRow label="active today" value={String(overview.activeToday)} />
        <RailRow label="admins" value={String(overview.admins)} />
        <RailRow label="new · 7d" value={String(overview.newThisWeek)} />
      </RailCard>

      <RailCard label="feedback">
        {feedback.length === 0 ? (
          <p className="text-[13px] text-muted">No feedback submitted yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {feedback.slice(0, 4).map((f) => (
              <li key={f.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 truncate font-mono text-[10px] text-muted-strong">
                    {f.authorName}
                  </span>
                  <Tag tone={STATUS_TONE[f.status]} className="flex-none">
                    {f.status}
                  </Tag>
                  <span className="ml-auto flex-none font-mono text-[10px] text-muted-strong">
                    {joinedLabel(f.createdAt, todayKey)}
                  </span>
                </div>
                <p className="line-clamp-2 text-[12.5px] leading-snug text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        )}
      </RailCard>

      <RailNote
        label={isOwner ? 'owner access' : 'elevated access'}
        tone={isOwner ? 'teal' : 'accent'}
      >
        {isOwner
          ? 'You can appoint or remove admins and delete accounts. These actions are permanent — handle with care.'
          : 'Cross-user views bypass the usual isolation — read-only, but handle with care.'}
      </RailNote>
    </div>
  )
}
