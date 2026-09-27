import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { AdminAccessCard } from '@/features/admin/components/AdminAccessCard'
import { AdminOverviewStats } from '@/features/admin/components/AdminOverviewStats'
import { FeedbackManager } from '@/features/admin/components/FeedbackManager'
import { MembersTable } from '@/features/admin/components/MembersTable'
import { SignupsChart } from '@/features/admin/components/SignupsChart'
import { SupportManager } from '@/features/admin/components/SupportManager'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'

/**
 * Admin-only console, gated by profile role (non-admins are bounced home). One
 * tree for every width: on desktop the module layout (`.dk-mgrid`) — members
 * and support on the left; access, signups and feedback in a sticky 360px
 * column on the right. The phone stacks the same blocks.
 */
function AdminPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const { user } = useSession()
  const { profile, isLoading: profileLoading } = useProfile()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
  const isOwner = profile?.role === 'owner'
  const currentUserId = user?.id ?? ''
  const { data, isLoading, isError, refetch } = useAdminData(isAdmin)
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

  return (
    <section className="w-full">
      <header className="mx-0.5 mb-4 mt-2 flex items-end gap-3">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label={t('admin.back')}
          className="-ml-1 mb-1.5 rounded-full p-1 text-muted hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="text-callout font-medium text-muted">
            {t('admin.newThisWeek', { count: data.overview.newThisWeek })}
          </p>
          <h1 className="text-large-title font-bold tracking-title">{t('admin.overview')}</h1>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-module lg:items-start lg:gap-6">
        <div className="grid min-w-0 grid-cols-1 content-start gap-5">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <AdminOverviewStats overview={data.overview} />
          </div>
          <section>
            <p className="label-mono mx-1 mb-2">{t('admin.recentSignups')}</p>
            <MembersTable
              members={data.members}
              todayKey={dateKey}
              isOwner={isOwner}
              currentUserId={currentUserId}
            />
          </section>
          {isOwner ? (
            <section>
              <p className="label-mono mx-1 mb-2">{t('admin.supportLabel')}</p>
              <SupportManager />
            </section>
          ) : null}
        </div>

        <aside
          aria-label={t('admin.feedbackLabel')}
          className="grid min-w-0 grid-cols-1 content-start gap-5 lg:sticky lg:top-toolbar-clearance"
        >
          <AdminAccessCard isOwner={isOwner} />
          <section>
            <p className="label-mono mx-1 mb-2">{t('admin.signupsPerWeek')}</p>
            <SignupsChart weeks={data.signups} height={100} />
          </section>
          <section>
            <p className="label-mono mx-1 mb-2">{t('admin.feedbackLabel')}</p>
            <FeedbackManager items={data.feedback} todayKey={dateKey} />
          </section>
        </aside>
      </div>
    </section>
  )
}

export default AdminPage
