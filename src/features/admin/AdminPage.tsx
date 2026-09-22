import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { LoadingState } from '@/components/common/LoadingState'
import { AdminStat } from '@/features/admin/components/AdminStat'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Rail } from '@/components/common/desktop/rail'
import { AdminRail } from '@/features/admin/components/AdminRail'
import { MembersTable } from '@/features/admin/components/MembersTable'
import { SignupsChart } from '@/features/admin/components/SignupsChart'
import { FeedbackManager } from '@/features/admin/components/FeedbackManager'
import { SupportManager } from '@/features/admin/components/SupportManager'
import { AdminWorkspace } from '@/features/admin/components/desktop/AdminWorkspace'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'

/** Admin-only console. Gated by profile role; non-admins are bounced home. */
function AdminPage() {
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
      <EmptyState
        icon={RefreshCw}
        title="Couldn't load the console"
        description="Something went wrong reaching the server."
        action={
          <Button size="sm" variant="surface" onClick={refetch}>
            Try again
          </Button>
        }
      />
    ) : (
      <LoadingState label="Loading console…" />
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

  const { overview } = data
  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="Back"
          className="rounded-full p-1 text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="label-mono text-accent">// {isOwner ? 'owner' : 'admin'}</p>
          <h1 className="text-2xl">Overview</h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <AdminStat label="members" value={String(overview.totalMembers)} accent />
        <AdminStat label="active today" value={String(overview.activeToday)} />
        <AdminStat label="habits" value={String(overview.totalHabits)} />
        <AdminStat label="logs" value={String(overview.totalLogs)} />
      </div>

      <div>
        <p className="label-mono mb-3">// signups per week</p>
        <SignupsChart weeks={data.signups} height={100} />
      </div>

      <div>
        <p className="label-mono mb-3">// recent signups</p>
        <MembersTable
          members={data.members}
          todayKey={dateKey}
          isOwner={isOwner}
          currentUserId={currentUserId}
        />
      </div>

      <div>
        <p className="label-mono mb-3">// feedback</p>
        <FeedbackManager items={data.feedback} todayKey={dateKey} />
      </div>

      {isOwner ? (
        <div>
          <p className="label-mono mb-3">// support &amp; donations</p>
          <SupportManager />
        </div>
      ) : null}
    </section>
  )
}

export default AdminPage
