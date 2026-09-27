import { AdminStat } from '@/features/admin/components/AdminStat'
import type { AdminOverview } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

/** The four headline counters; the caller lays them out. */
export function AdminOverviewStats({ overview }: { overview: AdminOverview }) {
  const { t } = useT()
  return (
    <>
      <AdminStat label={t('admin.members')} value={String(overview.totalMembers)} accent />
      <AdminStat label={t('admin.activeToday')} value={String(overview.activeToday)} />
      <AdminStat label={t('admin.habits')} value={String(overview.totalHabits)} />
      <AdminStat label={t('admin.logs')} value={String(overview.totalLogs)} />
    </>
  )
}
