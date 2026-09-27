import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useWorkoutSessionStore } from '@/features/workouts/stores/workoutSession'
import { estimateMinutes, plannedSetCount } from '@/features/workouts/lib/session'
import type { SessionExercise, WorkoutView } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'
import { dateFromKey } from '@/lib/date'
import { cn } from '@/lib/utils'

interface TodaySessionCardProps {
  workout: WorkoutView
  /** Already completed on the selected day. */
  doneToday: boolean
  /** Where the selected day sits relative to today — only today can start. */
  dayState: 'today' | 'past' | 'future'
  /** The selected day, `YYYY-MM-DD`. */
  dateKey: string
}

/** "Присед 5×5" — the prototype's exercise chip. */
function chipLabel(e: SessionExercise): string {
  const sets = e.targetSets ?? e.sets.length
  return sets && e.targetReps ? `${e.name} ${sets}×${e.targetReps}` : e.name
}

function Meta({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-footnote text-muted">
      <b className="num block text-callout font-medium text-foreground">{value}</b>
      {label}
    </div>
  )
}

/**
 * The selected day's plan — the prototype's `.m-hero`: what it is, when it was
 * last done, its exercises as chips, three numbers and one full-width teal
 * action. Only today starts a session.
 */
export function TodaySessionCard({ workout, doneToday, dayState, dateKey }: TodaySessionCardProps) {
  const { t, locale } = useT()
  const dateLocale = intlLocale(locale)
  const navigate = useNavigate()
  const start = useWorkoutSessionStore((s) => s.start)
  const hasActiveSession = useWorkoutSessionStore((s) => Boolean(s.sessions[workout.id]))
  const { exercises } = useWorkoutDetail(workout.id)
  const hasPlan = exercises.length > 0
  const isToday = dayState === 'today'
  const dayMonth = new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'long' })

  const kicker = [
    isToday
      ? t('workouts.hero.today')
      : t('workouts.hero.day', {
          date: new Intl.DateTimeFormat(dateLocale, {
            timeZone: 'UTC',
            weekday: 'short',
            day: 'numeric',
            month: 'long',
          }).format(dateFromKey(dateKey)),
        }),
    workout.completed_at
      ? t('workouts.hero.lastTime', { date: dayMonth.format(new Date(workout.completed_at)) })
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const openDetail = () => navigate(`/train/${workout.id}`)
  const startSession = () => {
    start(workout.id)
    navigate(`/train/${workout.id}/session`)
  }

  const sets = plannedSetCount(exercises)
  const minutes = estimateMinutes(exercises)
  const primary = isToday && hasPlan && !doneToday
  const action = !isToday
    ? { label: t('workouts.viewPlan'), onClick: openDetail }
    : !hasPlan
      ? { label: t('workouts.planSession'), onClick: openDetail }
      : hasActiveSession
        ? { label: t('workouts.hero.resume'), onClick: startSession }
        : doneToday
          ? { label: t('workouts.doneTrainAgain'), onClick: startSession }
          : { label: t('workouts.hero.start'), onClick: startSession }

  return (
    <div className="w-hero grid gap-3 rounded-3xl bg-surface p-4.5">
      <p className="text-footnote font-medium text-muted">{kicker}</p>
      <button
        type="button"
        onClick={openDetail}
        aria-label={t('a11y.viewPlan', { name: workout.name })}
        className="-mt-1 text-left"
      >
        <h2 className="text-title font-bold leading-tight tracking-title">{workout.name}</h2>
      </button>

      {hasPlan ? (
        <>
          <ul className="flex flex-wrap gap-1.5">
            {exercises.map((e) => (
              <li
                key={e.id}
                className="rounded-full bg-sheet-fill px-2.5 py-1.5 text-footnote font-medium"
              >
                {chipLabel(e)}
              </li>
            ))}
          </ul>
          <div className="flex gap-4">
            <Meta
              value={`${exercises.length}`}
              label={t('workouts.hero.exercises', { count: exercises.length })}
            />
            <Meta value={`${sets}`} label={t('workouts.hero.sets', { count: sets })} />
            <Meta value={`~${minutes}`} label={t('workouts.hero.minutes', { count: minutes })} />
          </div>
        </>
      ) : (
        <p className="text-callout text-muted">{t('workouts.noExercisesToStart')}</p>
      )}

      <button
        type="button"
        onClick={action.onClick}
        className={cn(
          'flex h-12 w-full items-center justify-center gap-2 rounded-full text-body font-semibold transition-transform active:scale-95',
          primary || hasActiveSession ? 'bg-teal text-white' : 'bg-sheet-fill text-foreground',
        )}
      >
        {primary || hasActiveSession ? (
          <Play className="h-4.5 w-4.5 fill-current" aria-hidden="true" />
        ) : null}
        {action.label}
      </button>
    </div>
  )
}
