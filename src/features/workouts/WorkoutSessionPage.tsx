import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { SectionHead } from '@/components/common/SectionHead'
import { DoneSets } from '@/features/workouts/components/session/DoneSets'
import { ExerciseTrack } from '@/features/workouts/components/session/ExerciseTrack'
import { FinishedStage } from '@/features/workouts/components/session/FinishedStage'
import { RestStage } from '@/features/workouts/components/session/RestStage'
import { WorkStage } from '@/features/workouts/components/session/WorkStage'
import { useSessionRunner } from '@/features/workouts/hooks/useSessionRunner'
import { formatTimer } from '@/features/workouts/lib/sessionRun'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import '@/features/workouts/components/session/session.css'

/**
 * The live session, one set at a time (`MOD.session`; desktop `MOD.desk('session')`).
 * One tree for every width: on the phone the header, bar, stage, track and
 * (on demand) the sets list stack; on the desktop the bar and stage take the
 * left column, the track and the always-open "Done" list a sticky right one.
 */
function WorkoutSessionPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const run = useSessionRunner(id)

  if (run.isLoading) return <LoadingState label={t('workouts.loadingSession')} />

  if (run.isError || !run.workout) {
    return (
      <EmptyState
        title={t('workouts.loadSessionFailed')}
        action={
          <Button size="sm" variant="surface" onClick={() => navigate('/train')}>
            {t('workouts.backToTraining')}
          </Button>
        }
      />
    )
  }

  const { exercises, clock, cursor, exercise, values } = run
  const done = run.totals.sets
  const total = exercises.reduce((sum, e) => sum + e.sets.length, 0)
  const elapsed = formatTimer(clock.elapsedMs)
  const stageKey = run.finished
    ? 'fin'
    : clock.restMs !== null
      ? 'rest'
      : `${cursor?.exercise}-${cursor?.set}`

  const stage = run.finished ? (
    <FinishedStage
      elapsedMs={clock.elapsedMs}
      sets={run.totals.sets}
      volume={run.totals.volume}
      record={run.sessionRecord}
      onSave={run.onSave}
    />
  ) : clock.restMs !== null ? (
    <RestStage
      restMs={clock.restMs}
      restTotalMs={clock.restTotalMs}
      next={run.next}
      onAdjust={clock.adjustRest}
      onReady={clock.skipRest}
    />
  ) : exercise && cursor && values ? (
    <WorkStage
      exerciseName={exercise.name}
      setIndex={cursor.set}
      setTotal={exercise.sets.length}
      values={values}
      last={run.last}
      record={run.record}
      onAdjust={run.onAdjust}
      onDone={run.onDone}
      justDone={run.justDone}
    />
  ) : (
    <p className="text-callout text-muted">{t('workouts.session.noExercises')}</p>
  )

  return (
    <section className="w-full">
      <button
        type="button"
        onClick={() => navigate('/train')}
        className="-ml-1 mb-1 flex items-center gap-0.5 text-body text-accent"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        {t('workouts.title')}
      </button>

      {/* One header, one <h1> (the shell's compact title watches it): on the
          phone the name, the clock and the sets toggle in a row; on the
          desktop "Session in progress" over the large title. */}
      <header className="mx-0.5 mb-2.5 flex items-center justify-between gap-2.5 lg:mb-4 lg:mt-2 lg:block">
        <div className="min-w-0">
          <p className="hidden text-callout font-medium text-muted lg:block">
            {t('workouts.session.inProgress')}
          </p>
          <h1 className="truncate text-headline font-bold tracking-title lg:text-large-title">
            {run.workout.name}
          </h1>
          <p className="num text-footnote font-medium text-muted lg:hidden">{elapsed}</p>
        </div>
        <button
          type="button"
          onClick={run.toggleSets}
          aria-expanded={run.showSets}
          className="flex-none rounded-full bg-accent/15 px-3.5 py-2 text-callout font-semibold text-accent transition-transform active:scale-95 lg:hidden"
        >
          {run.showSets ? t('workouts.session.hideSets') : t('workouts.session.allSets')}
        </button>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-module lg:items-start lg:gap-6">
        <div className="contents lg:grid lg:min-w-0 lg:grid-cols-1 lg:content-start lg:gap-3.5">
          <div className="mx-0.5 flex items-center gap-2.5 text-footnote font-medium text-muted">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-teal motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-spring"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
            <span>
              {t('workouts.session.setsOf', { done, total })}
              <span className="hidden lg:inline"> · {elapsed}</span>
            </span>
          </div>

          <div
            key={stageKey}
            aria-live="polite"
            className={cn(
              'mt-3 grid justify-items-center gap-3 overflow-hidden rounded-sheet bg-surface px-4.5 pb-4.5 pt-5.5 text-center lg:mt-0 lg:px-8.5 lg:pb-8.5 lg:pt-10',
              stageKey !== 'rest' && stageKey !== 'fin' && 'ws-enter',
            )}
          >
            {stage}
          </div>
        </div>

        <aside
          aria-label={t('workouts.session.exercises')}
          className="contents lg:sticky lg:top-toolbar-clearance lg:grid lg:min-w-0 lg:grid-cols-1 lg:content-start lg:gap-3.5"
        >
          <section className="mt-3 lg:mt-0">
            <div className="hidden lg:block">
              <SectionHead>{t('workouts.session.exercises')}</SectionHead>
            </div>
            <ExerciseTrack exercises={exercises} cursor={cursor} onPick={run.onPick} />
          </section>
          <section className={cn('mt-5.5 lg:mt-0 lg:block', !run.showSets && 'hidden')}>
            <div className="hidden lg:block">
              <SectionHead>{t('workouts.session.doneList')}</SectionHead>
            </div>
            <DoneSets
              exercises={exercises}
              overrides={run.overrides}
              onUndoLast={run.onUndoLast}
              onFinishEarly={run.onFinishEarly}
            />
          </section>
        </aside>
      </div>
    </section>
  )
}

export default WorkoutSessionPage
