import { AdminStat } from '@/features/admin/components/AdminStat'
import type { AdminOverview } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

/** The four headline counters; the caller lays them out. */
export function AdminOverviewStats({
  overview,
  size,
}: {
  overview: AdminOverview
  size?: 'md' | 'lg'
}) {
  const { t } = useT()
  return (
    <>
      <AdminStat
        label={t('admin.members')}
        value={String(overview.totalMembers)}
        accent
        size={size}
      />
      <AdminStat label={t('admin.activeToday')} value={String(overview.activeToday)} size={size} />
      <AdminStat label={t('admin.habits')} value={String(overview.totalHabits)} size={size} />
      <AdminStat label={t('admin.logs')} value={String(overview.totalLogs)} size={size} />
    </>
  )
}
