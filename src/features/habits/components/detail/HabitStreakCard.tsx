import { Minus, Plus } from 'lucide-react'
import { isQuantitative, unitLabel } from '@/features/habits/lib/goal'
import type { Habit } from '@/features/habits/types'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface HabitStreakCardProps {
  habit: Pick<Habit, 'name' | 'daily_goal' | 'unit'>
  streak: number
  best: number
  todayDone: boolean
  todayFrozen: boolean
  todayCount: number
  onSetCount: (count: number) => void
}

const STEP =
  'grid h-11 w-11 place-items-center rounded-full bg-sheet-fill transition-transform active:scale-95 disabled:opacity-40'

/**
 * The prototype's .p-streak: the current run as one big number, or an
 * invitation when there is none — never a bare "0". Today's mark lives here
 * too, so the screen still closes the day in one tap; a habit with a daily
 * amount gets − / + instead, since a mis-tap there has to come back one unit.
 */
export function HabitStreakCard({
  habit,
  streak,
  best,
  todayDone,
  todayFrozen,
  todayCount,
  onSetCount,
}: HabitStreakCardProps) {
  const { t } = useT()
  const goal = habit.daily_goal
  const counted = isQuantitative(habit)
  const today = todayDone
    ? t('habits.detail.doneToday')
    : todayFrozen
      ? t('habits.detail.frozenToday')
      : t('habits.detail.notDoneToday')

  const summary = (
    <div className="grid min-w-0 flex-1 gap-1">
      {streak > 0 ? (
        <>
          <span className="num text-[56px] font-medium leading-none tracking-[-0.04em] text-accent">
            {streak}
          </span>
          <span className="text-body font-medium">
            {t('habits.detail.daysInARow', { count: streak })}
          </span>
        </>
      ) : (
        <span className="text-headline font-semibold">{t('habits.detail.startStreak')}</span>
      )}
      <span className="text-sm text-muted">
        {t('habits.detail.record', { count: best })} · {today}
      </span>
    </div>
  )

  if (!counted) {
    return (
      <div className="flex items-center gap-3 rounded-[22px] bg-surface p-[18px]">
        {summary}
        <button
          type="button"
          onClick={() => onSetCount(todayDone ? 0 : goal)}
          aria-pressed={todayDone}
          className={cn(
            'flex-none self-end rounded-pill px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95',
            todayDone ? 'bg-accent/[0.16] text-accent' : 'bg-accent-solid text-on-accent-solid',
          )}
        >
          {todayDone ? t('habits.detail.marked') : t('habits.detail.mark')}
        </button>
      </div>
    )
  }

  // A counted habit: today's amount gets its own row under the run, so the
  // title keeps the card's width and the − / + stay a full 44px each.
  return (
    <div className="grid gap-4 rounded-[22px] bg-surface p-[18px]">
      {summary}
      <div className="flex items-center gap-3 border-t border-foreground/10 pt-3.5">
        <span className="min-w-0 flex-1 text-body" aria-live="polite">
          <span className={cn('num font-semibold', todayDone && 'text-accent')}>
            {todayCount}/{goal}
          </span>{' '}
          <span className="text-muted">{unitLabel(habit.unit, goal, t)}</span>
        </span>
        <button
          type="button"
          className={cn(STEP, 'text-muted')}
          disabled={todayCount === 0}
          aria-label={t('habits.form.decrease')}
          onClick={() => onSetCount(todayCount - 1)}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={cn(STEP, 'text-accent')}
          aria-label={t('habits.goal.addOne', { name: habit.name, count: todayCount, goal })}
          onClick={() => onSetCount(todayCount + 1)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
