import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ShieldMinus, ShieldPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/common/Tag'
import { SectionLabel } from '@/components/common/SectionLabel'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { Rail } from '@/components/common/desktop/rail'
import { AdminUserRail } from '@/features/admin/components/AdminUserRail'
import { useAdminUser } from '@/features/admin/hooks/useAdminUser'
import { useUserManagement } from '@/features/admin/hooks/useUserManagement'
import { joinedLabel } from '@/features/admin/lib/format'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import type { UserRole } from '@/features/admin/types'

const ROLE_TONE: Record<UserRole, 'accent' | 'muted' | 'teal'> = {
  owner: 'teal',
  admin: 'accent',
  user: 'muted',
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-2xl border bg-panel px-4 py-3.5">
      <p className="font-mono text-[9.5px] uppercase tracking-label text-muted-strong">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent ? 'text-accent' : ''}`}>
        {value}
      </p>
    </div>
  )
}

/** Admin/owner view of one user: stats, habits, feedback + role/delete actions. */
function AdminUserPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useSession()
  const { profile, isLoading: profileLoading } = useProfile()
  const { dateKey } = useToday()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
  const isOwner = profile?.role === 'owner'
  const { data, isLoading, isError } = useAdminUser(id, isAdmin)
  const { setRole, remove, isSettingRole, isRemoving } = useUserManagement()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (profileLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }
  if (!isAdmin) return <Navigate to="/" replace />

  if (isLoading || !data) {
    return isError ? (
      <EmptyState
        title="Couldn't load this user"
        action={
          <Button size="sm" variant="surface" onClick={() => navigate('/admin')}>
            Back to console
          </Button>
        }
      />
    ) : (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading user…</span>
      </div>
    )
  }

  const isSelf = data.id === user?.id
  const isOwnerRow = data.role === 'owner'
  const canManageRole = isOwner && !isOwnerRow && !isSelf
  const canDelete = !isSelf && !isOwnerRow && (data.role === 'user' || isOwner)

  const toggleAdmin = async () => {
    const next: UserRole = data.role === 'admin' ? 'user' : 'admin'
    try {
      await setRole({ target: data.id, role: next })
      toast.success(
        next === 'admin' ? `${data.name} is now an admin` : `${data.name} is now a member`,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not change role')
    }
  }

  const confirmRemove = async () => {
    try {
      await remove(data.id)
      toast.success(`${data.name} deleted`)
      navigate('/admin')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete user')
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
        <header className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            aria-label="Back to console"
            className="rounded-full p-1 text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="label-mono text-accent">// member</p>
            <h1 className="truncate text-2xl lg:text-[32px] lg:tracking-title">{data.name}</h1>
            <p className="mt-1 flex items-center gap-2 font-mono text-[11px] text-muted-strong">
              <Tag tone={ROLE_TONE[data.role]}>{data.role}</Tag>
              joined {joinedLabel(data.joinedAt, dateKey)}
              {data.timezone ? ` · ${data.timezone.replace(/_/g, ' ')}` : ''}
            </p>
          </div>
          {canManageRole ? (
            <Button variant="surface" size="sm" onClick={toggleAdmin} disabled={isSettingRole}>
              {data.role === 'admin' ? (
                <>
                  <ShieldMinus className="h-4 w-4" /> Remove admin
                </>
              ) : (
                <>
                  <ShieldPlus className="h-4 w-4" /> Make admin
                </>
              )}
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="surface"
              size="sm"
              className="text-accent"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ) : null}
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="habits" value={String(data.stats.habits)} accent />
          <Stat label="active · 30d" value={`${data.stats.activeDays30}d`} />
          <Stat label="completion" value={`${data.stats.completionPct}%`} />
          <Stat label="logs · 30d" value={String(data.stats.logs)} />
        </div>

        <section className="flex flex-col gap-3">
          <SectionLabel>HABITS</SectionLabel>
          {data.habits.length === 0 ? (
            <p className="rounded-card border bg-surface px-4 py-6 text-center text-sm text-muted">
              No active habits.
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
                    {h.frequencyLabel}
                  </span>
                  <span className="font-mono text-[11px] text-accent">{h.doneLast30}/30</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <SectionLabel>FEEDBACK</SectionLabel>
          {data.feedback.length === 0 ? (
            <p className="rounded-card border bg-surface px-4 py-6 text-center text-sm text-muted">
              No feedback submitted.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.feedback.map((f) => (
                <div key={f.id} className="rounded-card border bg-surface px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Tag tone={f.status === 'open' ? 'accent' : 'muted'}>{f.status}</Tag>
                    <span className="font-mono text-[10px] text-muted-strong">
                      {joinedLabel(f.createdAt, dateKey)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <ConfirmSheet
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${data.name}?`}
          description="This permanently removes the account and all of their habits, logs, and feedback. This cannot be undone."
          confirmLabel={isRemoving ? 'Deleting…' : 'Delete user'}
          pending={isRemoving}
          onConfirm={confirmRemove}
        />
      </div>
      <Rail>
        <AdminUserRail user={data} todayKey={dateKey} />
      </Rail>
    </>
  )
}

export default AdminUserPage
