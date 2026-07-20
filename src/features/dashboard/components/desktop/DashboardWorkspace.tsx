import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Cascade } from '@/components/common/Cascade'
import { CountUp } from '@/components/common/CountUp'
import { EmptyState } from '@/components/common/EmptyState'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { StatusLine } from '@/components/common/StatusLine'
import { NowBlock } from '@/features/dashboard/components/NowBlock'
import { TodaysWorkoutsBlock } from '@/features/dashboard/components/TodaysWorkoutsBlock'
import { DesktopHabitTile } from '@/features/dashboard/components/desktop/DesktopHabitTile'
import { useFocusStore } from '@/stores/focus'
import { useToday } from '@/hooks/useToday'
import { useUiStore } from '@/stores/ui'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface DashboardWorkspaceProps {
  habits: HabitWithTodayLog[]
  greeting: string
  firstName: string
}

function StatTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string
  unit?: string
  accent?: boolean
}) {
  const isInt = /^\d+$/.test(value)
  return (
    <div className="flex-1 rounded-2xl border bg-panel px-5 py-[18px]">
      <p className="font-mono text-[9.5px] uppercase tracking-label text-muted-strong">{label}</p>
      <p
        className={`mt-1 text-[30px] font-semibold tabular-nums tracking-title ${accent ? 'text-accent' : ''}`}
      >
        {isInt ? <CountUp value={Number(value)} /> : value}
        {unit ? <span className="text-base text-muted-strong">{unit}</span> : null}
      </p>
    </div>
  )
}

/** Desktop "Today" workspace — the spec board's centre column, wired to data. */
export function DashboardWorkspace({ habits, greeting, firstName }: DashboardWorkspaceProps) {
  const { longDate } = useToday()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const focusRunning = useFocusStore((s) => s.endsAt !== null && s.durationMin !== null)

  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const completed = due.filter((h) => h.isComplete).length
  const pct = due.length ? Math.round((completed / due.length) * 100) : 0
  const weekRate = habits.length
    ? Math.round((habits.reduce((sum, h) => sum + h.rate, 0) / habits.length) * 100)
    : 0
  const weekday = longDate.split(',')[0] ?? ''
  const datePart = longDate.replace(/^[^,]*,\s*/, '')

  return (
    <div className="mx-auto max-w-[900px]">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="label-mono">// {weekday}</p>
          <h1 className="mt-1.5 text-[44px] leading-none tracking-title">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {datePart} · {completed} of {due.length} habits
            {focusRunning ? ' · 1 focus block running' : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">load</p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <ProgressBlocks
                value={completed}
                total={Math.max(due.length, 1)}
                blocks={12}
                size="lg"
                animated
                aria-label={`${pct}% of today done`}
              />
              <span className="font-mono text-lg font-semibold tabular-nums">
                <CountUp value={pct} />%
              </span>
            </div>
          </div>
          <Button onClick={openNewHabit} className="rounded-[13px] shadow-glow">
            <Plus className="h-4 w-4" />
            Capture
          </Button>
        </div>
      </header>

      <Cascade>
        {focusRunning ? (
          <section className="mt-8">
            <p className="label-mono mb-3 text-accent">▶ now · focus block</p>
            <NowBlock habits={habits} />
          </section>
        ) : null}

        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="label-mono">today · habits</span>
            <span className="font-mono text-[11px] text-muted-strong">
              {completed} / {due.length} done
            </span>
          </div>
          {habits.length === 0 ? (
            <EmptyState
              title="Start your first habit"
              description="One small daily action, tracked."
              action={
                <Button size="sm" onClick={openNewHabit}>
                  <Plus className="h-4 w-4" />
                  Add habit
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {habits.map((habit) => (
                <DesktopHabitTile key={habit.id} habit={habit} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-8">
          <TodaysWorkoutsBlock />
        </div>

        <section className="mt-6 flex gap-3">
          <StatTile label="today" value={String(pct)} unit="%" />
          <StatTile label="this week" value={String(weekRate)} unit="%" accent />
          <StatTile label="active" value={String(habits.length)} unit=" habits" />
        </section>

        <StatusLine habitCount={habits.length} className="mt-6" />
      </Cascade>
    </div>
  )
}
