import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionLabel } from '@/components/common/SectionLabel'
import { CelebrationModal } from '@/components/common/CelebrationModal'
import { ExerciseBlock } from '@/features/workouts/components/ExerciseBlock'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useSessionMutations } from '@/features/workouts/hooks/useSessionMutations'

interface FlowWorkoutRunnerProps {
  workoutId: string
  /** Called after the congrats modal is dismissed — ends the flow session. */
  onFinish: () => void
}

/** In-flow workout runner: tick sets or mark the whole session done. */
export function FlowWorkoutRunner({ workoutId, onFinish }: FlowWorkoutRunnerProps) {
  const navigate = useNavigate()
  const { workout, exercises, isLoading } = useWorkoutDetail(workoutId)
  const mutations = useSessionMutations(workoutId)
  const [manualDone, setManualDone] = useState(false)

  if (isLoading || !workout) {
    return (
      <div className="flex justify-center py-10" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading workout…</span>
      </div>
    )
  }

  const done = Boolean(workout.completed_at)
  const doneSets = exercises.flatMap((e) => e.sets).filter((s) => s.done).length
  const totalSets = exercises.flatMap((e) => e.sets).length

  const completeWhole = () =>
    mutations.setCompleted.mutate(true, {
      onSuccess: () => setManualDone(true),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : 'Could not complete the workout'),
    })

  const celebrating = mutations.celebrate || manualDone

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel accessory={totalSets > 0 ? `${doneSets}/${totalSets} sets` : undefined}>
        SETS
      </SectionLabel>

      {exercises.length === 0 ? (
        <div className="rounded-card border border-dashed p-4 text-sm text-muted">
          This workout has no exercises yet.{' '}
          <button
            type="button"
            onClick={() => navigate(`/train/${workoutId}`)}
            className="text-accent underline-offset-2 hover:underline"
          >
            Add some on its page
          </button>
          .
        </div>
      ) : (
        exercises.map((ex) => (
          <ExerciseBlock key={ex.id} exercise={ex} mutations={mutations} variant="run" />
        ))
      )}

      <Button
        size="lg"
        variant={done ? 'surface' : 'primary'}
        className={done ? 'w-full' : 'w-full shadow-glow'}
        disabled={done || mutations.setCompleted.isPending}
        onClick={completeWhole}
      >
        <Check className="h-4 w-4" />
        {done ? 'Workout complete' : 'Mark whole workout done'}
      </Button>

      <CelebrationModal
        open={celebrating}
        onOpenChange={(o) => {
          if (!o) {
            mutations.dismissCelebrate()
            setManualDone(false)
            onFinish()
          }
        }}
        title="Workout complete!"
        message={`Great session — ${workout.name} is in the books. Recovery counts too.`}
        actionLabel="Finish"
      />
    </div>
  )
}
