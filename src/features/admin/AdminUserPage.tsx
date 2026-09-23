import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShieldMinus, ShieldPlus, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Rail } from '@/components/rail/Rail'
import { Button } from '@/components/ui/button'
import { AwardAchievements } from '@/features/achievements/components/AwardAchievements'
import { AdminStat } from '@/features/admin/components/AdminStat'
import { AdminUserRail } from '@/features/admin/components/AdminUserRail'
import { DeleteMemberConfirm } from '@/features/admin/components/DeleteMemberConfirm'
import { FeedbackManager } from '@/features/admin/components/FeedbackManager'
import { RoleTag } from '@/features/admin/components/RoleTag'
import { useAdminUser } from '@/features/admin/hooks/useAdminUser'
import { useJoinedLabel } from '@/features/admin/hooks/useJoinedLabel'
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
  const joined = useJoinedLabel()
  const actions = useMemberActions(data, isOwner, user?.id ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
        <header className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            aria-label={t('admin.backToConsole')}
            className="rounded-full p-1 text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="label-mono text-accent">{t('admin.memberLabel')}</p>
            <h1 className="truncate text-2xl lg:text-[32px] lg:tracking-title">{data.name}</h1>
            <p className="mt-1 flex items-center gap-2 font-mono text-[11px] text-muted-strong">
              <RoleTag role={data.role} />
              {t('admin.joinedLine', { when: joined(data.joinedAt, dateKey) })}
              {data.timezone ? ` · ${data.timezone.replace(/_/g, ' ')}` : ''}
            </p>
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
              className="text-accent"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" /> {t('admin.delete')}
            </Button>
          ) : null}
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminStat label={t('admin.habits')} value={String(data.stats.habits)} accent />
          <AdminStat
            label={t('admin.active30d')}
            value={t('admin.daysValue', { count: data.stats.activeDays30 })}
          />
          <AdminStat label={t('admin.completion')} value={`${data.stats.completionPct}%`} />
          <AdminStat label={t('admin.logs30d')} value={String(data.stats.logs)} />
        </div>

        <section className="flex flex-col gap-3">
          <SectionLabel>{t('admin.habitsSection')}</SectionLabel>
          {data.habits.length === 0 ? (
            <p className="rounded-card border bg-surface px-4 py-6 text-center text-sm text-muted">
              {t('admin.noHabits')}
            </p>
          ) : (
            <div className="overflow-hidden rounded-card border bg-surface">
              {data.habits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate">{h.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
                    {frequencyLabel(h.frequency, t)}
                  </span>
                  <span className="font-mono text-[11px] text-accent">{h.doneLast30}/30</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <SectionLabel>{t('admin.feedbackSection')}</SectionLabel>
          <FeedbackManager items={data.feedback} todayKey={dateKey} hideAuthor />
        </section>

        {isOwner ? <AwardAchievements userId={data.id} userName={data.name} /> : null}

        <DeleteMemberConfirm
          name={data.name}
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          pending={actions.isRemoving}
          onConfirm={() => void actions.remove(() => navigate('/admin'))}
        />
      </div>
      <Rail>
        <AdminUserRail user={data} todayKey={dateKey} />
      </Rail>
    </>
  )
}

export default AdminUserPage
