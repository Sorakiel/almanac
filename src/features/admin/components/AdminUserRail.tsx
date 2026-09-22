import { Avatar } from '@/components/common/Avatar'
import { Tag } from '@/components/common/Tag'
import { RailCard, RailNote, RailRow } from '@/components/rail/RailCard'
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

      <RailCard label="account">
        <RailRow label="joined" value={joinedLabel(user.joinedAt, todayKey)} />
        <RailRow label="timezone" value={user.timezone?.replace(/_/g, ' ') ?? '—'} />
      </RailCard>

      <RailNote label="elevated access">
        You&apos;re viewing another member&apos;s data. Role changes and deletion are permanent.
      </RailNote>
    </div>
  )
}
