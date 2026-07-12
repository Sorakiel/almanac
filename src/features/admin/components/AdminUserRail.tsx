import { Avatar } from '@/components/common/Avatar'
import { Tag } from '@/components/common/Tag'
import { joinedLabel } from '@/features/admin/lib/format'
import type { AdminUserDetail, UserRole } from '@/features/admin/types'

interface AdminUserRailProps {
  user: AdminUserDetail
  todayKey: string
}

const ROLE_TONE: Record<UserRole, 'accent' | 'muted' | 'teal'> = {
  owner: 'teal',
  admin: 'accent',
  user: 'muted',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="text-muted">{label}</span>
      <span className="min-w-0 truncate font-mono tabular-nums">{value}</span>
    </div>
  )
}

/** Desktop context rail for the admin user-detail page: identity + snapshot. */
export function AdminUserRail({ user, todayKey }: AdminUserRailProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{user.name}</p>
          <Tag tone={ROLE_TONE[user.role]} className="mt-0.5">
            {user.role}
          </Tag>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">account</p>
        <div className="mt-2 flex flex-col">
          <Row label="joined" value={joinedLabel(user.joinedAt, todayKey)} />
          <Row label="timezone" value={user.timezone?.replace(/_/g, ' ') ?? '—'} />
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          last 30 days
        </p>
        <div className="mt-2 flex flex-col">
          <Row label="active days" value={`${user.stats.activeDays30}d`} />
          <Row label="completion" value={`${user.stats.completionPct}%`} />
          <Row label="habits" value={String(user.stats.habits)} />
        </div>
      </div>

      <div className="rounded-[16px] border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-accent">
          elevated access
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          You&apos;re viewing another member&apos;s data. Role changes and deletion are permanent.
        </p>
      </div>
    </div>
  )
}
