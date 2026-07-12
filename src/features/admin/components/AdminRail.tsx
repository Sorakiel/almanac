import { ShieldCheck } from 'lucide-react'
import { Tag } from '@/components/common/Tag'
import type { AdminData, FeedbackStatus } from '@/features/admin/types'

interface AdminRailProps {
  data: AdminData
}

const STATUS_TONE: Record<FeedbackStatus, 'accent' | 'teal' | 'amber' | 'muted'> = {
  open: 'amber',
  planned: 'accent',
  done: 'teal',
  closed: 'muted',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="text-muted">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  )
}

/** Desktop Admin context rail: workspace counters, feedback, caution note. */
export function AdminRail({ data }: AdminRailProps) {
  const { overview, feedback } = data
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-accent/15 text-accent"
        >
          <ShieldCheck className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[15px] font-semibold">Admin</p>
          <p className="font-mono text-[10px] text-muted-strong">workspace tools</p>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          this workspace
        </p>
        <div className="mt-2 flex flex-col">
          <Row label="members" value={String(overview.totalMembers)} />
          <Row label="active today" value={String(overview.activeToday)} />
          <Row label="admins" value={String(overview.admins)} />
          <Row label="new · 7d" value={String(overview.newThisWeek)} />
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">feedback</p>
        {feedback.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">No feedback submitted yet.</p>
        ) : (
          <ul className="mt-2.5 flex flex-col gap-3">
            {feedback.slice(0, 4).map((f) => (
              <li key={f.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-mono text-[10px] text-muted-strong">
                    {f.authorName}
                  </span>
                  <Tag tone={STATUS_TONE[f.status]}>{f.status}</Tag>
                </div>
                <p className="line-clamp-2 text-[12.5px] leading-snug text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[16px] border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-accent">elevated access</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Cross-user views bypass the usual isolation — read-only, but handle with care.
        </p>
      </div>
    </div>
  )
}
