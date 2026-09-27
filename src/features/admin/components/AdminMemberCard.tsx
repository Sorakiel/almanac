import { Avatar } from '@/components/common/Avatar'
import { RoleTag } from '@/features/admin/components/RoleTag'
import { useJoinedLabel } from '@/features/admin/hooks/useJoinedLabel'
import type { AdminUserDetail } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

interface AdminMemberCardProps {
  user: AdminUserDetail
  todayKey: string
}

/** The member at a glance: who, since when, where — and a word of caution. */
export function AdminMemberCard({ user, todayKey }: AdminMemberCardProps) {
  const { t } = useT()
  const joined = useJoinedLabel()
  const rows = [
    { label: t('admin.colJoined'), value: joined(user.joinedAt, todayKey) },
    { label: t('admin.timezone'), value: user.timezone?.replace(/_/g, ' ') ?? '—' },
  ]
  return (
    <section className="grid gap-3 rounded-card bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold">{user.name}</p>
          <RoleTag role={user.role} className="mt-0.5" />
        </div>
      </div>
      <dl className="divide-y">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-2 text-callout">
            <dt className="text-muted">{r.label}</dt>
            <dd className="truncate text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-footnote text-muted">{t('admin.userNote')}</p>
    </section>
  )
}
