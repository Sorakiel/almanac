import { AdminOverviewStats } from '@/features/admin/components/AdminOverviewStats'
import { AdminSections } from '@/features/admin/components/AdminSections'
import type { AdminData } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

interface AdminWorkspaceProps {
  data: AdminData
  todayKey: string
  isOwner: boolean
  currentUserId: string
}

/** Desktop admin "Overview" — KPIs, signups chart, recent-members table. */
export function AdminWorkspace({ data, todayKey, isOwner, currentUserId }: AdminWorkspaceProps) {
  const { t } = useT()
  return (
    <div className="mx-auto max-w-[900px]">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">{t('admin.workspaceLabel')}</p>
          <h1 className="mt-1.5 text-[40px] leading-none tracking-title">{t('admin.overview')}</h1>
          <p className="mt-2 text-[15px] text-muted">{t('admin.overviewSubtitle')}</p>
        </div>
        <div className="rounded-[11px] border px-3.5 py-2 font-mono text-[11px] text-muted">
          {t('admin.newThisWeek', { count: data.overview.newThisWeek })}
        </div>
      </header>

      <section className="mb-8 mt-7 flex gap-3.5">
        <AdminOverviewStats overview={data.overview} size="lg" />
      </section>

      <AdminSections
        data={data}
        todayKey={todayKey}
        isOwner={isOwner}
        currentUserId={currentUserId}
      />
    </div>
  )
}
