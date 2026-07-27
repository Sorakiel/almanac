import { useState } from 'react'
import { Dumbbell, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Cascade } from '@/components/common/Cascade'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard'
import { WeekStrip } from '@/features/workouts/components/WeekStrip'
import { TodaySessionCard } from '@/features/workouts/components/TodaySessionCard'
import { SessionResumeBanner } from '@/features/workouts/components/SessionResumeBanner'
import { dayStateFor } from '@/features/workouts/lib/week'
import { workoutForDay } from '@/features/workouts/lib/week'
import { splitWorkouts } from '@/features/workouts/lib/summary'
import type { TrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'
import type { WorkoutView } from '@/features/workouts/types'

interface WorkoutsWorkspaceProps {
  workouts: WorkoutView[]
  overview: TrainingOverview
  isLoading: boolean
  isError: boolean
  refetch: () => void
  onNew: () => void
}

/** Friendly "Monday, 6 July" from a `YYYY-MM-DD` key, UTC-safe. */
function dayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)),
  )
}

/** Desktop training workspace: week strip, the selected day's session, sessions. */
export function WorkoutsWorkspace({
  workouts,
  overview,
  isLoading,
  isError,
  refetch,
  onNew,
}: WorkoutsWorkspaceProps) {
  const [selectedKey, setSelectedKey] = useState(overview.todayKey)
  const { active, completed } = splitWorkouts(workouts)
  const selected = workoutForDay(overview.workouts, selectedKey, overview.timezone)

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <header>
        <p className="label-mono">// {overview.week.label}</p>
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <h1 className="text-[40px] leading-none tracking-title">Training</h1>
          <Button onClick={onNew} className="flex-none shadow-glow">
            <Plus className="h-4 w-4" />
            New workout
          </Button>
        </div>
        <p className="mt-2 text-[15px] text-muted">Plan sessions and log what you actually did.</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-24" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">Loading workouts…</span>
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load your workouts"
          description="Something went wrong reaching the server."
          action={
            <Button size="sm" variant="surface" onClick={refetch}>
              Try again
            </Button>
          }
        />
      ) : workouts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet"
            description="Add your first training session to start a log."
            action={
              <Button size="sm" onClick={onNew}>
                <Plus className="h-4 w-4" />
                New workout
              </Button>
            }
          />
        </div>
      ) : (
        <Cascade>
          <SessionResumeBanner workouts={overview.workouts} />

          <section className="mt-7">
            <WeekStrip
              days={overview.week.days}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
            />
          </section>

          <section className="mt-8">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-strong">
              {selectedKey === overview.todayKey ? 'today' : dayLabel(selectedKey)}
            </p>
            {selected ? (
              <TodaySessionCard
                workout={selected.workout}
                doneToday={selected.done}
                dayState={dayStateFor(selectedKey, overview.todayKey)}
              />
            ) : (
              <div className="rounded-[22px] border border-dashed p-7 text-center">
                <p className="text-sm text-muted">No session scheduled — rest day.</p>
              </div>
            )}
          </section>

          {active.length > 0 ? (
            <section className="mt-8 flex flex-col gap-3">
              <SectionLabel>TO DO</SectionLabel>
              {active.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </section>
          ) : null}

          {completed.length > 0 ? (
            <section className="mt-8 flex flex-col gap-3">
              <SectionLabel>COMPLETED</SectionLabel>
              {completed.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </section>
          ) : null}
        </Cascade>
      )}
    </div>
  )
}
