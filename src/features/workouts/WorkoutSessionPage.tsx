import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { CelebrationModal } from '@/components/common/CelebrationModal'
import { CurrentExercisePanel } from '@/features/workouts/components/session/CurrentExercisePanel'
import { SessionQueue } from '@/features/workouts/components/session/SessionQueue'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useSessionMutations } from '@/features/workouts/hooks/useSessionMutations'
import { useSessionClock } from '@/features/workouts/hooks/useSessionClock'
import { useWorkoutSessionStore } from '@/stores/workoutSession'
import {
  currentExerciseIndex,
  currentSet as firstUndoneSet,
  formatClock,
  sessionProgress,
} from '@/features/workouts/lib/session'

/** Focused live-session runner (no app shell) — the spec-board session screen. */
function WorkoutSessionPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { workout, exercises, isLoading, isError } = useWorkoutDetail(id)
  const mutations = useSessionMutations(id)
  const startedAt = useWorkoutSessionStore((s) => s.startedAt[id] ?? null)
  const start = useWorkoutSessionStore((s) => s.start)
  const end = useWorkoutSessionStore((s) => s.end)
  const { elapsedMs, restMs, startRest, skipRest } = useSessionClock(startedAt)

  // Deep-linking straight to the session (or a reload) starts the clock once.
  useEffect(() => {
    if (id) start(id)
  }, [id, start])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading session…</span>
      </div>
    )
  }

  if (isError || !workout) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-5">
        <EmptyState
          title="Couldn't load this session"
          action={
            <Button size="sm" variant="surface" onClick={() => navigate('/train')}>
              Back to training
            </Button>
          }
        />
      </div>
    )
  }

  const progress = sessionProgress(exercises)
  const currentIndex = currentExerciseIndex(exercises)
  const currentExercise = currentIndex >= 0 ? exercises[currentIndex] : null
  const currentSet = currentExercise ? firstUndoneSet(currentExercise) : null

  const completeCurrentSet = () => {
    if (!currentSet) return
    mutations.editSet.mutate(
      { id: currentSet.id, patch: { done: true } },
      { onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not log the set') },
    )
    startRest()
  }

  const leave = () => navigate(`/train/${id}`)

  return (
    <div className="min-h-dvh bg-bg px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
      <div className="mx-auto w-full max-w-[1040px]">
        <header className="flex items-center gap-3 py-3">
          <button
            type="button"
            onClick={leave}
            aria-label="Leave session"
            className="rounded-full p-1 text-muted hover:text-foreground"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-title">
            {workout.name}
          </h1>
          <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-label text-muted">
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            {formatClock(elapsedMs)} elapsed
          </span>
        </header>

        <div className="flex items-center gap-3 pb-5">
          <span className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
            {exercises.length > 0 ? `exercise ${Math.min(currentIndex + 1, exercises.length)} / ${exercises.length}` : 'no exercises'}
          </span>
          <ProgressBlocks
            value={progress.doneSets}
            total={progress.totalSets}
            blocks={14}
            size="sm"
            animated
            className="flex-1"
            aria-label={`${progress.doneSets} of ${progress.totalSets} sets done`}
          />
          <span className="font-mono text-xs tabular-nums text-muted">{progress.pct}%</span>
        </div>

        {exercises.length === 0 ? (
          <EmptyState
            title="No exercises in this session"
            description="Plan the workout first, then come back to run it."
            action={
              <Button size="sm" onClick={leave}>
                Plan this workout
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            {currentExercise ? (
              <CurrentExercisePanel
                exercise={currentExercise}
                currentSet={currentSet}
                restMs={restMs}
                onCompleteSet={completeCurrentSet}
                onSkipRest={skipRest}
                disabled={mutations.editSet.isPending}
              />
            ) : null}
            <aside className="lg:pt-1">
              <SessionQueue exercises={exercises} currentIndex={currentIndex} />
            </aside>
          </div>
        )}
      </div>

      <CelebrationModal
        open={mutations.celebrate}
        onOpenChange={(o) => {
          if (!o) {
            mutations.dismissCelebrate()
            end(id)
            navigate(`/train/${id}`)
          }
        }}
        title="Session complete!"
        message={`Every set of ${workout.name} is logged. Strong work — recovery counts too.`}
        actionLabel="Finish"
      />
    </div>
  )
}

export default WorkoutSessionPage
