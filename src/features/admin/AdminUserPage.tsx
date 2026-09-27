import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShieldMinus, ShieldPlus, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { AwardAchievements } from '@/features/achievements/components/AwardAchievements'
import { AdminStat } from '@/features/admin/components/AdminStat'
import { AdminMemberCard } from '@/features/admin/components/AdminMemberCard'
import { DeleteMemberConfirm } from '@/features/admin/components/DeleteMemberConfirm'
import { FeedbackManager } from '@/features/admin/components/FeedbackManager'
import { useAdminUser } from '@/features/admin/hooks/useAdminUser'
import { useMemberActions } from '@/features/admin/hooks/useMemberActions'
import type { AdminUserDetail } from '@/features/admin/types'
import { frequencyLabel } from '@/features/habits/lib/frequency'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'

/** Admin/owner view of one user: stats, habits, feedback + role/delete actions. */
function AdminUserPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { profile, isLoading: profileLoading } = useProfile()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
  const { data, isLoading, isError } = useAdminUser(id, isAdmin)

  if (profileLoading) return <LoadingState />
  if (!isAdmin) return <Navigate to="/" replace />

  if (isLoading || !data) {
    return isError ? (
      <EmptyState
        title={t('admin.userLoadFailed')}
        action={
          <Button size="sm" variant="surface" onClick={() => navigate('/admin')}>
            {t('admin.backToConsole')}
          </Button>
        }
      />
    ) : (
      <LoadingState label={t('admin.loadingUser')} />
    )
  }

  return <AdminUserView data={data} isOwner={profile?.role === 'owner'} />
}

function AdminUserView({ data, isOwner }: { data: AdminUserDetail; isOwner: boolean }) {
  const { t } = useT()
  const navigate = useNavigate()
  const { user } = useSession()
  const { dateKey } = useToday()
  const actions = useMemberActions(data, isOwner, user?.id ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // The module layout (`.dk-mgrid`): the member's data on the left, who they
  // are in a sticky 360px column on the right; the phone stacks them.
  return (
    <section className="w-full">
      <header className="mx-0.5 mb-4 mt-2 flex flex-wrap items-end gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          aria-label={t('admin.backToConsole')}
          className="rounded-full p-1 text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-callout font-medium text-muted">{t('admin.memberLabel')}</p>
          <h1 className="truncate text-large-title font-bold tracking-title">{data.name}</h1>
        </div>
        {actions.canManageRole ? (
          <Button
            variant="surface"
            size="sm"
            onClick={() => void actions.toggleAdmin()}
            disabled={actions.isSettingRole}
          >
            {data.role === 'admin' ? (
              <ShieldMinus className="h-4 w-4" />
            ) : (
              <ShieldPlus className="h-4 w-4" />
            )}
            {data.role === 'admin' ? t('admin.removeAdmin') : t('admin.makeAdmin')}
          </Button>
        ) : null}
        {actions.canDelete ? (
          <Button
            variant="surface"
            size="sm"
            className="text-danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" /> {t('admin.delete')}
          </Button>
        ) : null}
      </header>

      <div className="grid gap-5 lg:grid-cols-module lg:items-start lg:gap-6">
        <div className="grid min-w-0 grid-cols-1 content-start gap-5">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <AdminStat label={t('admin.habits')} value={String(data.stats.habits)} accent />
            <AdminStat
              label={t('admin.active30d')}
              value={t('admin.daysValue', { count: data.stats.activeDays30 })}
            />
            <AdminStat label={t('admin.completion')} value={`${data.stats.completionPct}%`} />
            <AdminStat label={t('admin.logs30d')} value={String(data.stats.logs)} />
          </div>

          <section>
            <p className="label-mono mx-1 mb-2">{t('admin.habitsSection')}</p>
            {data.habits.length === 0 ? (
              <p className="rounded-card bg-surface px-4 py-6 text-center text-callout text-muted">
                {t('admin.noHabits')}
              </p>
            ) : (
              <div className="divide-y overflow-hidden rounded-card bg-surface">
                {data.habits.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-callout"
                  >
                    <span className="min-w-0 flex-1 truncate">{h.name}</span>
                    <span className="text-footnote text-muted">
                      {frequencyLabel(h.frequency, t)}
                    </span>
                    <span className="num text-footnote text-accent">{h.doneLast30}/30</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <p className="label-mono mx-1 mb-2">{t('admin.feedbackSection')}</p>
            <FeedbackManager items={data.feedback} todayKey={dateKey} hideAuthor />
          </section>
        </div>

        <aside
          aria-label={t('admin.account')}
          className="grid min-w-0 grid-cols-1 content-start gap-5 lg:sticky lg:top-toolbar-clearance"
        >
          <AdminMemberCard user={data} todayKey={dateKey} />
          {isOwner ? <AwardAchievements userId={data.id} userName={data.name} /> : null}
        </aside>
      </div>

      <DeleteMemberConfirm
        name={data.name}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        pending={actions.isRemoving}
        onConfirm={() => void actions.remove(() => navigate('/admin'))}
      />
    </section>
  )
}

export default AdminUserPage
