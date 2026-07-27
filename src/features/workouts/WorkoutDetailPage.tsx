import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Check, Dumbbell, Loader2, Pencil, Play, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconTile } from '@/components/common/IconTile'
import { Tag } from '@/components/common/Tag'
import { SectionLabel } from '@/components/common/SectionLabel'
import { EmptyState } from '@/components/common/EmptyState'
import { CelebrationModal } from '@/components/common/CelebrationModal'
import { Rail } from '@/components/common/desktop/rail'
import { ExerciseView } from '@/features/workouts/components/ExerciseView'
import { WorkoutFormSheet } from '@/features/workouts/components/WorkoutFormSheet'
import { WorkoutSessionRail } from '@/features/workouts/components/desktop/WorkoutSessionRail'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useSessionMutations } from '@/features/workouts/hooks/useSessionMutations'
import { useWorkoutSessionStore } from '@/stores/workoutSession'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import { useBreadcrumbLeaf } from '@/stores/breadcrumb'

/** Friendly label for a `YYYY-MM-DD` date, UTC-safe. */
function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)))
}

function WorkoutDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { workout, exercises, isLoading, isError } = useWorkoutDetail(id)
  useBreadcrumbLeaf(workout?.name)
  const mutations = useSessionMutations(id)
  const startSessionClock = useWorkoutSessionStore((s) => s.start)
  const hasActiveSession = useWorkoutSessionStore((s) => Boolean(s.sessions[id]))
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading workout…</span>
      </div>
    )
  }

  if (isError || !workout) {
    return (
      <EmptyState
        title="Couldn't load this workout"
        action={
          <Button size="sm" variant="surface" onClick={() => navigate('/train')}>
            Back to workouts
          </Button>
        }
      />
    )
  }

  const done = Boolean(workout.completed_at)
  const hasExercises = exercises.length > 0
  const subtitle =
    recurrenceLabel(workout) ??
    (workout.scheduled_date ? formatDate(workout.scheduled_date) : 'No date set')

  const toggleComplete = () =>
    mutations.setCompleted.mutate(!done, {
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not update the workout'),
    })

  const startSession = () => {
    startSessionClock(id)
    navigate(`/train/${id}/session`)
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/train')}
            aria-label="Back to workouts"
            className="rounded-full p-1 text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <IconTile icon={Dumbbell} tone="bg-teal/15 text-teal" size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl lg:text-[30px] lg:tracking-title">{workout.name}</h1>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
              {subtitle}
              {done ? <Tag tone="teal">done</Tag> : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Schedule & delete"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] border text-muted transition-colors hover:text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
          <Button size="sm" variant="surface" onClick={() => navigate(`/train/${id}/edit`)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </header>

        <section className="flex flex-col gap-3">
          <SectionLabel accessory={`${exercises.length} exercises`}>EXERCISES</SectionLabel>
          {!hasExercises ? (
            <p className="rounded-card border border-dashed bg-surface/40 px-4 py-8 text-center text-sm text-muted">
              No exercises planned yet — tap Edit to build the session.
            </p>
          ) : (
            exercises.map((ex) => <ExerciseView key={ex.id} exercise={ex} />)
          )}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          {hasExercises ? (
            <Button
              size="lg"
              className="w-full shadow-glow sm:w-auto sm:min-w-[220px]"
              onClick={startSession}
            >
              <Play className="h-4 w-4" />
              {hasActiveSession ? 'Resume session' : done ? 'Train again' : 'Start session'}
            </Button>
          ) : null}
          <Button
            size="lg"
            variant="surface"
            className="w-full sm:w-auto sm:min-w-[200px]"
            disabled={mutations.setCompleted.isPending}
            onClick={toggleComplete}
          >
            <Check className="h-4 w-4" />
            {done ? 'Completed — tap to reopen' : 'Mark complete'}
          </Button>
        </div>
      </div>

      <Rail>
        <WorkoutSessionRail workout={workout} exercises={exercises} />
      </Rail>

      {settingsOpen ? (
        <WorkoutFormSheet
          open
          onOpenChange={setSettingsOpen}
          workout={workout}
          onDeleted={() => navigate('/train')}
        />
      ) : null}

      <CelebrationModal
        open={mutations.celebrate}
        onOpenChange={(o) => !o && mutations.dismissCelebrate()}
        title="Workout complete!"
        message={`Every set of ${workout.name} is done. Strong session — well earned.`}
      />
    </>
  )
}

export default WorkoutDetailPage
