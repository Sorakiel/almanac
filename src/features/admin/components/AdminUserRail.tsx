import { Avatar } from '@/components/common/Avatar'
import { RailCard, RailNote, RailRow } from '@/components/rail/RailCard'
import { RoleTag } from '@/features/admin/components/RoleTag'
import { useJoinedLabel } from '@/features/admin/hooks/useJoinedLabel'
import type { AdminUserDetail } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

interface AdminUserRailProps {
  user: AdminUserDetail
  todayKey: string
}

/** Desktop context rail for the admin user-detail page: identity + snapshot. */
export function AdminUserRail({ user, todayKey }: AdminUserRailProps) {
  const { t } = useT()
  const joined = useJoinedLabel()
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{user.name}</p>
          <RoleTag role={user.role} className="mt-0.5" />
        </div>
      </div>

      <RailCard label={t('admin.account')}>
        <RailRow label={t('admin.colJoined')} value={joined(user.joinedAt, todayKey)} />
        <RailRow label={t('admin.timezone')} value={user.timezone?.replace(/_/g, ' ') ?? '—'} />
      </RailCard>

      <RailNote label={t('admin.elevatedAccess')}>{t('admin.userNote')}</RailNote>
    </div>
  )
}
