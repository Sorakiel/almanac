import { useId } from 'react'
import { Flame } from 'lucide-react'
import { useT } from '@/hooks/useT'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface TodayNudgeProps {
  habit: HabitWithTodayLog
  onMark: (habit: HabitWithTodayLog) => void
}

/**
 * The narrator, cut down to the one line that asks for something: the longest
 * streak that ends tonight, with the button that saves it.
 */
export function TodayNudge({ habit, onMark }: TodayNudgeProps) {
  const { t } = useT()
  const textId = useId()
  return (
    <div className="today-nudge">
      <Flame aria-hidden="true" />
      <span id={textId}>{t('dashboard.nudge', { name: habit.name, count: habit.streak })}</span>
      <button
        type="button"
        className="today-pill is-ghost"
        onClick={() => onMark(habit)}
        aria-describedby={textId}
      >
        {t('dashboard.nudgeAction')}
      </button>
    </div>
  )
}
