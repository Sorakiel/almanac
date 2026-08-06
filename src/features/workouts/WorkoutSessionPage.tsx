import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Ban,
  Check,
  ChevronLeft,
  EllipsisVertical,
  Flag,
  Loader2,
  Pause,
  Play,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { CelebrationModal } from '@/components/common/CelebrationModal'
import { CurrentExercisePanel } from '@/features/workouts/components/session/CurrentExercisePanel'
import { SessionPulse } from '@/features/workouts/components/session/SessionPulse'
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
import { useT } from '@/hooks/useT'

/** Focused live-session runner (no app shell) — spec-board screen 08. */
function WorkoutSessionPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { workout, exercises, isLoading, isError } = useWorkoutDetail(id)
  const mutations = useSessionMutations(id)
  const record = useWorkoutSessionStore((s) => s.sessions[id])
  const start = useWorkoutSessionStore((s) => s.start)
  const pause = useWorkoutSessionStore((s) => s.pause)
  const end = useWorkoutSessionStore((s) => s.end)
  const { elapsedMs, running, restMs, startRest, skipRest } = useSessionClock(record)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [finishing, setFinishing] = useState(false)

  // Deep-linking straight to the session (or a reload) starts the clock once,
  // but a paused session is left paused — the user resumes it explicitly. Read
  // the store imperatively (not via the `record` dep) so clearing the session
  // on finish/discard doesn't immediately re-create it before we navigate away.
  useEffect(() => {
    if (id && !useWorkoutSessionStore.getState().sessions[id]) start(id)
  }, [id, start])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">{t('workouts.loadingSession')}</span>
      </div>
    )
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
      ? `exercise ${Math.min(currentIndex + 1, exercises.length)} / ${exercises.length}`
      : 'no exercises'

  const completeCurrentSet = () => {
    if (!currentSet) return
    mutations.editSet.mutate(
      { id: currentSet.id, patch: { done: true } },
      {
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : t('workouts.session.logFailed')),
      },
    )
    startRest()
  }

  const togglePause = () => (running ? pause(id) : start(id))
  const leave = () => navigate(`/train/${id}`)

  // Finish now — mark the workout done even if some sets are unticked, then
  // reuse the celebration to bow out (its dismiss clears the clock + navigates).
  const finishWorkout = () => {
    setMenuOpen(false)
    mutations.setCompleted.mutate(true, {
      onSuccess: () => setFinishing(true),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : t('workouts.session.finishFailed')),
    })
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
          <span className="truncate font-mono text-xs font-semibold">{workout.name}</span>
          <span
            className={cn(
              'flex flex-none items-center gap-1.5 font-mono text-[11px] uppercase tabular-nums tracking-label',
              running ? 'text-accent' : 'text-muted-strong',
            )}
          >
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            {formatClock(elapsedMs)}
            <span className="hidden sm:inline">{running ? 'elapsed' : 'paused'}</span>
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
          <span className="rounded-full bg-surface px-3.5 py-[7px] font-mono text-[11px] text-muted">
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
          <div className="flex items-center gap-4">
            <ProgressBlocks
              value={progress.doneSets}
              total={progress.totalSets}
              blocks={14}
              size="lg"
              animated
              aria-label={t('a11y.setsDone', {
                done: progress.doneSets,
                total: progress.totalSets,
              })}
            />
            <div className="flex-1" />
            <span className="font-mono text-2xl font-semibold tabular-nums lg:text-[28px]">
              {progress.pct}%
            </span>
          </div>

          {exercises.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                title="{t('workouts.session.noExercises')}"
                description="{t('workouts.planFirst')}"
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

              <SessionPulse
                running={running}
                restMs={restMs}
                doneSets={progress.doneSets}
                totalSets={progress.totalSets}
                elapsedMs={elapsedMs}
                className="mt-7 h-[152px] flex-none lg:mt-9 lg:h-auto lg:min-h-0 lg:flex-1"
              />

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

      <CelebrationModal
        open={mutations.celebrate || finishing}
        onOpenChange={(o) => {
          if (!o) {
            mutations.dismissCelebrate()
            setFinishing(false)
            end(id)
            navigate(`/train/${id}`)
          }
        }}
        title={t('workouts.session.completeBang')}
        message={`Nice work on ${workout.name} — logged and done. Recovery counts too.`}
        actionLabel={t('workouts.session.finish')}
      />
    </div>
  )
}

export default WorkoutSessionPage
