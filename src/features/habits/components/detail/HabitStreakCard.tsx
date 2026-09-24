import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface HabitStreakCardProps {
  streak: number
  best: number
  todayDone: boolean
  todayFrozen: boolean
  onToggleDone: () => void
}

/**
 * The prototype's .p-streak: the current run as one big number, or an
 * invitation when there is none — never a bare "0". Today's mark lives here
 * too, so the screen still closes the day in one tap.
 */
export function HabitStreakCard({
  streak,
  best,
  todayDone,
  todayFrozen,
  onToggleDone,
}: HabitStreakCardProps) {
  const { t } = useT()
  const today = todayDone
    ? t('habits.detail.doneToday')
    : todayFrozen
      ? t('habits.detail.frozenToday')
      : t('habits.detail.notDoneToday')

  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-surface p-[18px]">
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
      <button
        type="button"
        onClick={onToggleDone}
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
