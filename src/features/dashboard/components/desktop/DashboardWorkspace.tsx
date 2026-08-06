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
import { useT } from '@/hooks/useT'

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
  glowPct,
}: {
  label: string
  value: string
  unit?: string
  accent?: boolean
  /** 0–100: when set, tints the tile's canvas by how close it is to done — the
   * same ambient-glow language as the mobile hero card (`TodaySummary`). */
  glowPct?: number
}) {
  const isInt = /^\d+$/.test(value)
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border bg-panel px-5 py-[18px]">
      {glowPct !== undefined ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 85% 0%, rgb(var(--color-accent) / ${(0.05 + (glowPct / 100) * 0.22).toFixed(3)}) 0%, transparent 72%)`,
          }}
        />
      ) : null}
      <p className="relative font-mono text-[9.5px] uppercase tracking-label text-muted-strong">
        {label}
      </p>
      <p
        className={`relative mt-1 text-[30px] font-semibold tabular-nums tracking-title ${accent ? 'text-accent' : ''}`}
      >
        {isInt ? <CountUp value={Number(value)} /> : value}
        {unit ? <span className="text-base text-muted-strong">{unit}</span> : null}
      </p>
    </div>
  )
}

/** Desktop "Today" workspace — the spec board's centre column, wired to data. */
export function DashboardWorkspace({ habits, greeting, firstName }: DashboardWorkspaceProps) {
  const { t } = useT()
  const { longDate } = useToday()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const focusRunning = useFocusStore((s) => s.endsAt !== null && s.durationMin !== null)

  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const completed = due.filter((h) => h.isComplete).length
  const pct = due.length ? Math.round((completed / due.length) * 100) : 0
  const weekRate = habits.length
    ? Math.round((habits.reduce((sum, h) => sum + h.rate, 0) / habits.length) * 100)
    : 0
  const bestStreak = habits.reduce((best, h) => Math.max(best, h.streak), 0)
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
          {/* The count lives on the habit section's own header, three lines
              down — one copy is enough. */}
          <p className="mt-2 text-[15px] text-muted">
            {datePart}
            {focusRunning ? t('dashboard.focusBlockRunning') : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
              {t('dashboard.load')}
            </p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <ProgressBlocks
                value={completed}
                total={Math.max(due.length, 1)}
                blocks={12}
                size="lg"
                animated
                aria-label={t('dashboard.percentOfTodayDone', { pct })}
              />
              <span className="font-mono text-lg font-semibold tabular-nums">
                <CountUp value={pct} />%
              </span>
            </div>
          </div>
          <Button onClick={openNewHabit} className="rounded-[13px] shadow-glow">
            <Plus className="h-4 w-4" />
            {t('dashboard.capture')}
          </Button>
        </div>
      </header>

      <Cascade>
        {focusRunning ? (
          <section className="mt-8">
            <p className="label-mono mb-3 text-accent">{t('dashboard.nowFocusBlock')}</p>
            <NowBlock />
          </section>
        ) : null}

        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="label-mono">{t('dashboard.todayHabitsMono')}</span>
          </div>
          {habits.length === 0 ? (
            <EmptyState
              title={t('dashboard.startFirstHabit')}
              description={t('dashboard.startFirstHabitHint')}
              action={
                <Button size="sm" onClick={openNewHabit}>
                  <Plus className="h-4 w-4" />
                  {t('dashboard.addHabit')}
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

        {/* Today's percentage is the header's own headline number and the
            donut in the rail — a third copy in a tile taught nothing. The slot
            carries the longest live streak instead, which nothing else on this
            screen answers. */}
        <section className="mt-6 flex gap-3">
          <StatTile
            label={t('dashboard.bestStreak')}
            value={String(bestStreak)}
            unit={t('dashboard.daysUnit')}
            glowPct={pct}
          />
          <StatTile label={t('dashboard.thisWeek')} value={String(weekRate)} unit="%" accent />
          <StatTile
            label={t('dashboard.active')}
            value={String(habits.length)}
            unit={t('dashboard.habitsUnit')}
          />
        </section>

        <StatusLine habitCount={habits.length} className="mt-6" />
      </Cascade>
    </div>
  )
}
