import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LoadingState } from '@/components/common/LoadingState'
import { Rail } from '@/components/rail/Rail'
import { AdminRail } from '@/features/admin/components/AdminRail'
import { AdminWorkspace } from '@/features/admin/components/desktop/AdminWorkspace'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { ErrorState } from '@/components/common/ErrorState'
import { AdminOverviewStats } from '@/features/admin/components/AdminOverviewStats'
import { AdminSections } from '@/features/admin/components/AdminSections'
import { useT } from '@/hooks/useT'

/** Admin-only console. Gated by profile role; non-admins are bounced home. */
function AdminPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const { user } = useSession()
  const { profile, isLoading: profileLoading } = useProfile()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
  const isOwner = profile?.role === 'owner'
  const currentUserId = user?.id ?? ''
  const { data, isLoading, isError, refetch } = useAdminData(isAdmin)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { dateKey } = useToday()

  if (profileLoading) return <LoadingState />
  if (!isAdmin) return <Navigate to="/" replace />
  if (isLoading || !data) {
    return isError ? (
      <ErrorState title={t('admin.loadFailed')} onRetry={refetch} />
    ) : (
      <LoadingState label={t('admin.loading')} />
    )
  }

  if (isDesktop) {
    return (
      <>
        <AdminWorkspace
          data={data}
          todayKey={dateKey}
          isOwner={isOwner}
          currentUserId={currentUserId}
        />
        <Rail>
          <AdminRail data={data} isOwner={isOwner} todayKey={dateKey} />
        </Rail>
      </>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label={t('admin.back')}
          className="rounded-full p-1 text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="label-mono text-accent">
            {t('admin.roleLabel', { role: t(isOwner ? 'admin.roles.owner' : 'admin.roles.admin') })}
          </p>
          <h1 className="text-2xl">{t('admin.overview')}</h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <AdminOverviewStats overview={data.overview} />
      </div>

      <AdminSections
        data={data}
        todayKey={dateKey}
        isOwner={isOwner}
        currentUserId={currentUserId}
        chartHeight={100}
      />
    </section>
  )
}

export default AdminPage
