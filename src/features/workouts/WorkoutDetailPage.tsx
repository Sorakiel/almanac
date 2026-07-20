import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Check, Dumbbell, Loader2, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconTile } from '@/components/common/IconTile'
import { Tag } from '@/components/common/Tag'
import { SectionLabel } from '@/components/common/SectionLabel'
import { EmptyState } from '@/components/common/EmptyState'
import { CelebrationModal } from '@/components/common/CelebrationModal'
import { Rail } from '@/components/common/desktop/rail'
import { ExerciseBlock } from '@/features/workouts/components/ExerciseBlock'
import { AddExerciseSheet } from '@/features/workouts/components/AddExerciseSheet'
import { WorkoutFormSheet } from '@/features/workouts/components/WorkoutFormSheet'
import { WorkoutSessionRail } from '@/features/workouts/components/desktop/WorkoutSessionRail'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useSessionMutations } from '@/features/workouts/hooks/useSessionMutations'
import { useExerciseLibrary } from '@/features/workouts/hooks/useExerciseLibrary'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import { useBreadcrumbLeaf } from '@/stores/breadcrumb'
import { cn } from '@/lib/utils'

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
  const { exercises: library } = useExerciseLibrary()
  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

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
  const subtitle =
    recurrenceLabel(workout) ??
    (workout.scheduled_date ? formatDate(workout.scheduled_date) : 'No date set')

  const toggleComplete = () =>
    mutations.setCompleted.mutate(!done, {
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not update the workout'),
    })

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
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 rounded-[11px] border px-3.5 py-[9px] font-mono text-xs text-muted transition-colors hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
        </header>

        <section className="flex flex-col gap-3">
          <SectionLabel accessory={`${exercises.length} exercises`}>EXERCISES</SectionLabel>
          {exercises.length === 0 ? (
            <p className="rounded-card border bg-surface px-4 py-8 text-center text-sm text-muted">
              No exercises yet — add the first one below.
            </p>
          ) : (
            exercises.map((ex) => <ExerciseBlock key={ex.id} exercise={ex} mutations={mutations} />)
          )}

          <Button
            variant="surface"
            size="lg"
            className="border-dashed"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add exercise
          </Button>
        </section>

        <Button
          size="lg"
          variant={done ? 'surface' : 'primary'}
          className={cn('w-full', !done && 'shadow-glow')}
          disabled={mutations.setCompleted.isPending}
          onClick={toggleComplete}
        >
          <Check className="h-4 w-4" />
          {done ? 'Completed — tap to reopen' : 'Complete workout'}
        </Button>
      </div>

      <Rail>
        <WorkoutSessionRail workout={workout} exercises={exercises} />
      </Rail>

      {editOpen ? (
        <WorkoutFormSheet
          open
          onOpenChange={setEditOpen}
          workout={workout}
          onDeleted={() => navigate('/train')}
        />
      ) : null}
      {addOpen ? (
        <AddExerciseSheet
          open
          onOpenChange={setAddOpen}
          sortOrder={exercises.length}
          library={library}
          mutations={mutations}
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
