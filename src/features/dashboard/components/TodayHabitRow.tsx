import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { PendingSyncMark } from '@/components/common/PendingSyncMark'
import { WeekDots } from '@/features/habits/components/WeekDots'
import { frequencyLabel } from '@/features/habits/lib/frequency'
import { resolveHabitColor } from '@/features/habits/lib/habitVisuals'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'
import type { SettlePhase } from '@/features/dashboard/hooks/useSettlingRows'
import { StreakOdometer } from './StreakOdometer'

interface TodayHabitRowProps {
  habit: HabitWithTodayLog
  /** Set while a just-ticked row holds in place and then folds away. */
  phase?: SettlePhase
  onToggle: (habit: HabitWithTodayLog) => void
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * One habit on Today: a 44px check with a 28px circle, the name, a meta line
 * (flame + streak, cadence) and the week as seven dots. Ticking fills the
 * circle with a spring, draws the check and sends a ripple out; the page then
 * holds the row for a moment and folds it into "Done".
 */
export function TodayHabitRow({ habit, phase, onToggle }: TodayHabitRowProps) {
  const { t } = useT()
  const [ripples, setRipples] = useState(0)
  const hue = resolveHabitColor(habit.color).stroke

  const toggle = () => {
    if (!habit.isComplete) setRipples((n) => n + 1)
    onToggle(habit)
  }

  return (
    <div className={cn('today-row-wrap', phase === 'collapsing' && 'is-collapsing')}>
      <div
        className={cn('today-row', habit.isComplete && 'is-done')}
        style={{ '--hue': hue } as CSSProperties}
      >
        <button
          type="button"
          className="today-check"
          onClick={toggle}
          aria-pressed={habit.isComplete}
          aria-label={
            habit.isComplete
              ? t('habits.aria.markIncomplete', { name: habit.name })
              : t('habits.aria.complete', { name: habit.name })
          }
        >
          <i>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </i>
          {ripples > 0 ? <span key={ripples} aria-hidden="true" className="today-ripple" /> : null}
        </button>

        <Link to={`/habits/${habit.id}`} className="today-row-main">
          <span className="today-row-name">{habit.name}</span>
          <span className="today-row-meta">
            {habit.streak > 0 ? (
              <span
                className="today-flame num"
                title={t('habits.streakDays', { count: habit.streak })}
              >
                <Flame aria-hidden="true" />
                <StreakOdometer value={habit.streak} />
              </span>
            ) : null}
            <span>{capitalize(frequencyLabel(habit, t))}</span>
          </span>
          <span className="today-hint" aria-hidden="true">
            {t('dashboard.details')}
          </span>
        </Link>

        <PendingSyncMark habitId={habit.id} />
        <WeekDots week={habit.week} color={hue} />
      </div>
    </div>
  )
}
