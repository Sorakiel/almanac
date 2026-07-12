import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Rail } from '@/components/common/desktop/rail'
import { AdminRail } from '@/features/admin/components/AdminRail'
import { MembersTable } from '@/features/admin/components/MembersTable'
import { SignupsChart } from '@/features/admin/components/SignupsChart'
import { AdminWorkspace } from '@/features/admin/components/desktop/AdminWorkspace'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-24" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
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

  if (profileLoading) return <Spinner label="Loading…" />
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
      <Spinner label="Loading console…" />
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
          <AdminRail data={data} isOwner={isOwner} />
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
        <Stat label="members" value={String(overview.totalMembers)} accent />
        <Stat label="active today" value={String(overview.activeToday)} />
        <Stat label="habits" value={String(overview.totalHabits)} />
        <Stat label="logs" value={String(overview.totalLogs)} />
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
    </section>
  )
}

export default AdminPage
