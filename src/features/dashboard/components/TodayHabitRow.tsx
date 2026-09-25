import { useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { PendingSyncMark } from '@/components/common/PendingSyncMark'
import { WeekDots } from '@/features/habits/components/WeekDots'
import { frequencyLabel } from '@/features/habits/lib/frequency'
import { isQuantitative, unitLabel } from '@/features/habits/lib/goal'
import { resolveHabitColor } from '@/features/habits/lib/habitVisuals'
import {
  claimHabitName,
  HABIT_NAME_ATTR,
  habitNameTransition,
} from '@/features/habits/lib/transition'
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
  /** Long-press (or right-click) on the check: skip today on purpose, or undo that. */
  onSkip?: (habit: HabitWithTodayLog) => void
}

/** How long a press on the check has to hold before it means "skip", not "tick". */
const LONG_PRESS_MS = 500

/** Circumference of the 28px check's progress ring (r = 13). */
const RING = 2 * Math.PI * 13

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * One habit on Today: a 44px check with a 28px circle, the name, a meta line
 * (flame + streak, cadence) and the week as seven dots. Ticking fills the
 * circle with a spring, draws the check and sends a ripple out; the page then
 * holds the row for a moment and folds it into "Done". A habit with a daily
 * amount ("8 glasses") counts up one per tap, drawn as a ring round the circle.
 * Holding the check skips the day on purpose: the row goes to "Done" with a
 * dashed circle, and the streak doesn't break.
 */
export function TodayHabitRow({ habit, phase, onToggle, onSkip }: TodayHabitRowProps) {
  const { t } = useT()
  const [ripples, setRipples] = useState(0)
  const hue = resolveHabitColor(habit.color).stroke
  const counted = isQuantitative(habit)
  const goal = habit.daily_goal
  const shown = Math.min(habit.todayCount, goal)

  const pressTimer = useRef<number | null>(null)
  // The click that ends a long press must not also tick the habit.
  const swallowClick = useRef(false)
  // Android opens a context menu on the same hold: that one must not skip twice.
  const pressFired = useRef(false)
  const cancelPress = () => {
    if (pressTimer.current !== null) window.clearTimeout(pressTimer.current)
    pressTimer.current = null
  }
  const startPress = () => {
    swallowClick.current = false
    pressFired.current = false
    if (!onSkip || habit.isComplete) return
    cancelPress()
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null
      swallowClick.current = true
      pressFired.current = true
      onSkip(habit)
    }, LONG_PRESS_MS)
  }
  const onContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    if (!onSkip || habit.isComplete) return
    event.preventDefault()
    if (pressFired.current) return
    cancelPress()
    pressFired.current = true
    onSkip(habit)
  }

  const toggle = () => {
    if (swallowClick.current) {
      swallowClick.current = false
      return
    }
    if (!habit.isComplete) setRipples((n) => n + 1)
    onToggle(habit)
  }

  return (
    <div className={cn('today-row-wrap', phase === 'collapsing' && 'is-collapsing')}>
      <div
        className={cn(
          'today-row',
          habit.isComplete && 'is-done',
          habit.skippedToday && 'is-skipped',
        )}
        style={{ '--hue': hue } as CSSProperties}
      >
        <button
          type="button"
          className="today-check"
          onClick={toggle}
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onContextMenu={onContextMenu}
          aria-pressed={habit.isComplete}
          aria-label={
            counted
              ? habit.isComplete
                ? t('habits.goal.clear', { name: habit.name, goal })
                : t('habits.goal.addOne', { name: habit.name, count: shown, goal })
              : habit.isComplete
                ? t('habits.aria.markIncomplete', { name: habit.name })
                : t('habits.aria.complete', { name: habit.name })
          }
        >
          {counted && !habit.isComplete ? (
            <svg className="today-ring" viewBox="0 0 28 28" aria-hidden="true">
              <circle
                cx="14"
                cy="14"
                r="13"
                style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - shown / goal) }}
              />
            </svg>
          ) : null}
          <i>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </i>
          {ripples > 0 ? <span key={ripples} aria-hidden="true" className="today-ripple" /> : null}
        </button>

        <Link
          to={`/habits/${habit.id}`}
          viewTransition
          onClick={(e) => claimHabitName(habit.id, e.currentTarget)}
          className="today-row-main"
        >
          <span
            className="today-row-name"
            {...{ [HABIT_NAME_ATTR]: '' }}
            style={habitNameTransition(habit.id)}
          >
            {habit.name}
          </span>
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
            {counted ? (
              <span className="today-goal">
                <span className="num">
                  {shown}/{goal}
                </span>{' '}
                {unitLabel(habit.unit, goal, t)}
              </span>
            ) : null}
            <span>
              {habit.skippedToday
                ? t('dashboard.skippedMeta')
                : capitalize(frequencyLabel(habit, t))}
            </span>
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
