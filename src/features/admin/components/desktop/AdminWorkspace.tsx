import { MembersTable } from '@/features/admin/components/MembersTable'
import { SignupsChart } from '@/features/admin/components/SignupsChart'
import { FeedbackManager } from '@/features/admin/components/FeedbackManager'
import type { AdminData } from '@/features/admin/types'

interface AdminWorkspaceProps {
  data: AdminData
  todayKey: string
  isOwner: boolean
  currentUserId: string
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-2xl border bg-panel px-5 py-[18px]">
      <p className="font-mono text-[9.5px] uppercase tracking-label text-muted-strong">{label}</p>
      <p
        className={`mt-1 text-[27px] font-semibold tabular-nums tracking-title ${accent ? 'text-accent' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

/** Desktop admin "Overview" — KPIs, signups chart, recent-members table. */
export function AdminWorkspace({ data, todayKey, isOwner, currentUserId }: AdminWorkspaceProps) {
  const { overview } = data

  return (
    <div className="mx-auto max-w-[900px]">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">// workspace</p>
          <h1 className="mt-1.5 text-[40px] leading-none tracking-title">Overview</h1>
          <p className="mt-2 text-[15px] text-muted">
            Members, activity, and feedback at a glance.
          </p>
        </div>
        <div className="rounded-[11px] border px-3.5 py-2 font-mono text-[11px] text-muted">
          {overview.newThisWeek} new · 7d
        </div>
      </header>

      <section className="mt-7 flex gap-3.5">
        <Stat label="members" value={String(overview.totalMembers)} accent />
        <Stat label="active today" value={String(overview.activeToday)} />
        <Stat label="habits" value={String(overview.totalHabits)} />
        <Stat label="logs" value={String(overview.totalLogs)} />
      </section>

      <p className="label-mono mb-3 mt-8">// signups per week</p>
      <SignupsChart weeks={data.signups} />

      <p className="label-mono mb-3 mt-8">// recent signups</p>
      <MembersTable
        members={data.members}
        todayKey={todayKey}
        isOwner={isOwner}
        currentUserId={currentUserId}
      />

      <p className="label-mono mb-3 mt-8">// feedback</p>
      <FeedbackManager items={data.feedback} todayKey={todayKey} />
    </div>
  )
}
