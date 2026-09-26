import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Ban, Check, ChevronLeft, EllipsisVertical, Flag, Pause, Play, Timer } from 'lucide-react'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { CurrentExercisePanel } from '@/features/workouts/components/session/CurrentExercisePanel'
import { RestRing } from '@/features/workouts/components/session/RestRing'
import { SessionQueue } from '@/features/workouts/components/session/SessionQueue'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useSessionMutations } from '@/features/workouts/hooks/useSessionMutations'
import { useSessionClock } from '@/features/workouts/hooks/useSessionClock'
import { useWorkoutSessionStore } from '@/features/workouts/stores/workoutSession'
import {
  currentExerciseIndex,
  currentSet as firstUndoneSet,
  formatClock,
  nextSetLabel,
  sessionProgress,
} from '@/features/workouts/lib/session'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

/** Focused live-session runner (no app shell) — spec-board screen 08. */
function WorkoutSessionPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { workout, exercises, isLoading, isError } = useWorkoutDetail(id)
  // Done is said once, quietly, and the runner steps aside — no modal to dismiss.
  const wrapUp = () => {
    toast(t('workouts.finishedToast', { name: workout?.name ?? '' }))
    useWorkoutSessionStore.getState().end(id)
    navigate(`/train/${id}`)
  }
  const mutations = useSessionMutations(id, { onFinished: wrapUp })
  const record = useWorkoutSessionStore((s) => s.sessions[id])
  const start = useWorkoutSessionStore((s) => s.start)
  const pause = useWorkoutSessionStore((s) => s.pause)
  const end = useWorkoutSessionStore((s) => s.end)
  const { elapsedMs, running, restMs, restTotalMs, restEndsAt, startRest, skipRest } =
    useSessionClock(record)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Deep-linking straight to the session (or a reload) starts the clock once,
  // but a paused session is left paused — the user resumes it explicitly. Read
  // the store imperatively (not via the `record` dep) so clearing the session
  // on finish/discard doesn't immediately re-create it before we navigate away.
  useEffect(() => {
    if (id && !useWorkoutSessionStore.getState().sessions[id]) start(id)
  }, [id, start])

  if (isLoading) {
    return <LoadingState label={t('workouts.loadingSession')} fullScreen />
  }

  if (isError || !workout) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-5">
        <EmptyState
          title={t('workouts.loadSessionFailed')}
          action={
            <Button size="sm" variant="surface" onClick={() => navigate('/train')}>
              {t('workouts.backToTraining')}
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
      ? t('workouts.exerciseOf', {
          n: Math.min(currentIndex + 1, exercises.length),
          total: exercises.length,
        })
      : t('workouts.noExercisesShort')

  const completeCurrentSet = () => {
    if (!currentSet) return
    mutations.editSet.mutate(
      { set: currentSet, done: true },
      {
        onError: (e) => toast.error(toUserError(e, t, 'workouts.session.logFailed')),
      },
    )
    // The set's own rest if it has one, the standard interval otherwise.
    startRest(currentSet.rest_seconds ?? undefined)
  }

  const togglePause = () => (running ? pause(id) : start(id))
  const leave = () => navigate(`/train/${id}`)

  // Finish now — mark the workout done even if some sets are unticked. Not
  // awaited: offline the write queues and the runner still steps aside.
  const finishWorkout = () => {
    setMenuOpen(false)
    mutations.setCompleted.mutate(true, {
      onError: (e) => toast.error(toUserError(e, t, 'workouts.session.finishFailed')),
    })
    wrapUp()
  }

  // Abandon the live session: drop the timer, keep whatever sets were logged.
  const discardSession = () => {
    end(id)
    setConfirmDiscard(false)
    toast(t('workouts.session.discarded'))
    navigate(`/train/${id}`)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-foreground">
      {/* Focused top bar (replaces the nav shell) */}
      <header className="flex h-14 flex-none items-center justify-between gap-3 border-b bg-chrome px-4 pt-[env(safe-area-inset-top)] lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={leave}
            aria-label={t('workouts.session.leave')}
            className="-ml-1 rounded-full p-1 text-muted hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="min-w-0 truncate text-footnote font-semibold">{workout.name}</span>
          <span
            className={cn(
              'flex flex-none items-center gap-1.5 text-footnote',
              running ? 'text-accent' : 'text-muted-strong',
            )}
          >
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="num">{formatClock(elapsedMs)}</span>
            <span className="hidden sm:inline">
              {running ? t('workouts.clockElapsed') : t('workouts.clockPaused')}
            </span>
          </span>
          <button
            type="button"
            onClick={togglePause}
            aria-label={running ? t('workouts.pauseSession') : t('workouts.resumeSession')}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full border text-muted transition-colors hover:text-foreground"
          >
            {running ? (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="flex flex-none items-center gap-2">
          <span className="rounded-full bg-surface px-3.5 py-1.5 text-footnote text-muted">
            {exerciseLabel}
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('workouts.session.options')}
            className="flex h-8 w-8 items-center justify-center rounded-full border text-muted transition-colors hover:text-foreground"
          >
            <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Workspace */}
        <div className="flex min-w-0 flex-1 flex-col px-5 py-6 lg:px-11 lg:py-9">
          {/* Compact "N of M" — no ring while working; rest gets its own card. */}
          <div className="flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.totalSets}
              aria-valuenow={progress.doneSets}
              aria-label={t('a11y.setsDone', {
                done: progress.doneSets,
                total: progress.totalSets,
              })}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10"
            >
              <div
                className="h-full rounded-full bg-teal motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-sheet"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <span className="text-footnote font-medium tabular-nums text-muted">
              {t('workouts.session.setsOf', {
                done: progress.doneSets,
                total: progress.totalSets,
              })}
            </span>
          </div>
          <RestRing
            restMs={restMs}
            restTotalMs={restTotalMs}
            restEndsAt={restEndsAt}
            next={nextSetLabel(exercises, t)}
            onSkip={skipRest}
            className="mt-2.5"
          />

          {exercises.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                title={t('workouts.session.noExercises')}
                description={t('workouts.planFirst')}
                action={
                  <Button size="sm" onClick={leave}>
                    {t('workouts.planThisWorkout')}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="mt-8">
                {currentExercise ? (
                  <CurrentExercisePanel exercise={currentExercise} currentSet={currentSet} />
                ) : null}
              </div>

              {/* Action bar: persistent rest + complete */}
              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => (restMs !== null ? skipRest() : startRest())}
                  className={cn(
                    'flex-none whitespace-nowrap rounded-control border px-4 text-footnote transition-colors sm:min-w-[120px]',
                    restMs !== null
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'bg-surface text-muted hover:text-foreground',
                  )}
                >
                  <span className="flex items-center justify-center gap-1.5 py-[18px]">
                    <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                    {restMs !== null ? (
                      <span className="num">{formatClock(restMs)}</span>
                    ) : (
                      t('workouts.restDefault')
                    )}
                  </span>
                </button>
                <Button
                  size="lg"
                  className="h-auto flex-1 py-[18px] text-base shadow-glow"
                  disabled={!currentSet}
                  onClick={completeCurrentSet}
                >
                  <Check className="h-4 w-4" />
                  {currentSet
                    ? t('workouts.session.completeSet', { number: currentSet.set_number })
                    : t('workouts.session.complete')}
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

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title={t('workouts.session.title')} mono>
        <div className="flex flex-col gap-3">
          <Button size="lg" disabled={mutations.setCompleted.isPending} onClick={finishWorkout}>
            <Flag className="h-4 w-4" />
            {t('workouts.session.finishWorkout')}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-accent"
            onClick={() => {
              setMenuOpen(false)
              setConfirmDiscard(true)
            }}
          >
            <Ban className="h-4 w-4" />
            {t('workouts.session.discard')}
          </Button>
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title={t('workouts.session.discardConfirm')}
        description={t('workouts.session.discardHint')}
        confirmLabel={t('workouts.session.discard')}
        onConfirm={discardSession}
      />
    </div>
  )
}

export default WorkoutSessionPage
