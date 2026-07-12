import { Dumbbell, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard'
import { splitWorkouts, summarize } from '@/features/workouts/lib/summary'
import type { WorkoutView } from '@/features/workouts/types'

interface WorkoutsWorkspaceProps {
  workouts: WorkoutView[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  onNew: () => void
  onEdit: (workout: WorkoutView) => void
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

/** Desktop workouts workspace: header, stat tiles, to-do / completed sections. */
export function WorkoutsWorkspace({
  workouts,
  isLoading,
  isError,
  refetch,
  onNew,
  onEdit,
}: WorkoutsWorkspaceProps) {
  const { active, completed } = splitWorkouts(workouts)
  const stats = summarize(workouts)

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">// train</p>
          <h1 className="mt-1.5 text-[40px] leading-none tracking-title">Workouts</h1>
          <p className="mt-2 text-[15px] text-muted">
            Plan sessions and log what you actually did.
          </p>
        </div>
        <Button onClick={onNew} className="shadow-glow">
          <Plus className="h-4 w-4" />
          New workout
        </Button>
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
        <>
          <section className="mt-7 flex gap-3.5">
            <Stat label="sessions" value={String(stats.total)} accent />
            <Stat label="completed" value={String(stats.completed)} />
            <Stat label="planned" value={String(stats.planned)} />
          </section>

          {active.length > 0 ? (
            <section className="mt-8 flex flex-col gap-3">
              <SectionLabel>TO DO</SectionLabel>
              {active.map((w) => (
                <WorkoutCard key={w.id} workout={w} onEdit={onEdit} />
              ))}
            </section>
          ) : null}

          {completed.length > 0 ? (
            <section className="mt-8 flex flex-col gap-3">
              <SectionLabel>COMPLETED</SectionLabel>
              {completed.map((w) => (
                <WorkoutCard key={w.id} workout={w} onEdit={onEdit} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
