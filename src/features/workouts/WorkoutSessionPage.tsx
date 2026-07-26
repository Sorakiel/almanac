import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, ChevronLeft, Loader2, Timer } from 'lucide-react'
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
import { cn } from '@/lib/utils'

/** Focused live-session runner (no app shell) — spec-board screen 08. */
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
  const exerciseLabel =
    exercises.length > 0
      ? `exercise ${Math.min(currentIndex + 1, exercises.length)} / ${exercises.length}`
      : 'no exercises'

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
    <div className="flex min-h-dvh flex-col bg-bg text-foreground">
      {/* Focused top bar (replaces the nav shell) */}
      <header className="flex h-14 flex-none items-center justify-between gap-3 border-b bg-chrome px-4 pt-[env(safe-area-inset-top)] lg:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <button
            type="button"
            onClick={leave}
            aria-label="Leave session"
            className="-ml-1 rounded-full p-1 text-muted hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="truncate font-mono text-xs font-semibold">{workout.name}</span>
          <span className="flex flex-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-label text-accent">
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            {formatClock(elapsedMs)} elapsed
          </span>
        </div>
        <span className="flex-none rounded-full bg-surface px-3.5 py-[7px] font-mono text-[11px] text-muted">
          {exerciseLabel}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Workspace */}
        <div className="flex min-w-0 flex-1 flex-col px-5 py-6 lg:px-11 lg:py-9">
          <div className="flex items-center gap-4">
            <ProgressBlocks
              value={progress.doneSets}
              total={progress.totalSets}
              blocks={14}
              size="md"
              animated
              aria-label={`${progress.doneSets} of ${progress.totalSets} sets done`}
            />
            <div className="flex-1" />
            <span className="font-mono text-[15px] font-semibold tabular-nums">{progress.pct}%</span>
          </div>

          {exercises.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                title="No exercises in this session"
                description="Plan the workout first, then come back to run it."
                action={
                  <Button size="sm" onClick={leave}>
                    Plan this workout
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="mt-7">
                {currentExercise ? (
                  <CurrentExercisePanel exercise={currentExercise} currentSet={currentSet} />
                ) : null}
              </div>

              <div className="hidden flex-1 lg:block" />

              {/* Action bar: persistent rest + complete */}
              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => (restMs !== null ? skipRest() : startRest())}
                  className={cn(
                    'flex-none rounded-[15px] border px-4 font-mono text-[13px] transition-colors sm:w-[120px]',
                    restMs !== null
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'bg-surface text-muted hover:text-foreground',
                  )}
                >
                  <span className="flex items-center justify-center gap-1.5 py-[18px]">
                    <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                    {restMs !== null ? formatClock(restMs) : 'rest 90s'}
                  </span>
                </button>
                <Button
                  size="lg"
                  className="h-auto flex-1 py-[18px] text-base shadow-glow"
                  disabled={!currentSet || mutations.editSet.isPending}
                  onClick={completeCurrentSet}
                >
                  <Check className="h-4 w-4" />
                  {currentSet ? `Complete set ${currentSet.set_number}` : 'Session complete'}
                </Button>
              </div>

              {/* Mobile queue (rail is desktop-only) */}
              <div className="mt-9 lg:hidden">
                <SessionQueue exercises={exercises} currentIndex={currentIndex} />
              </div>
            </>
          )}
        </div>

        {/* Desktop queue rail */}
        {exercises.length > 0 ? (
          <aside className="hidden w-[360px] flex-none overflow-y-auto border-l bg-chrome px-6 py-7 lg:block">
            <SessionQueue exercises={exercises} currentIndex={currentIndex} />
          </aside>
        ) : null}
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
