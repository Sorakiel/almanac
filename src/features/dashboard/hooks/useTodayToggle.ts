import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useToggleHabit } from '@/features/habits/hooks/useToggleHabit'
import { dailyTarget } from '@/features/habits/lib/frequency'
import { useT } from '@/hooks/useT'
import { haptic } from '@/lib/platform/haptics'
import { toastWithUndo } from '@/lib/undoToast'
import { toUserError } from '@/lib/userError'
import type { HabitWithTodayLog } from '@/features/habits/types'
import { useSettlingRows, type SettlePhase } from './useSettlingRows'

/**
 * The habit as the toggle must see it for its next tap to land on `count`:
 * the toggle writes "clear" for a complete habit and "+1" otherwise, so Undo
 * reuses the same queued write instead of a second path.
 */
function atCount(habit: HabitWithTodayLog, count: number): HabitWithTodayLog {
  return count === 0
    ? { ...habit, isComplete: true }
    : { ...habit, isComplete: false, todayCount: count - 1 }
}

interface TodayToggle {
  phases: ReadonlyMap<string, SettlePhase>
  onToggle: (habit: HabitWithTodayLog) => void
}

/**
 * A tap on Today: haptic, the optimistic write, the row held in place while
 * its check draws, and an Undo for the tap that closed the habit — or, for a
 * habit counted up to a daily amount, the tap that cleared it to zero.
 */
export function useTodayToggle(habits: HabitWithTodayLog[]): TodayToggle {
  const { t } = useT()
  const toggle = useToggleHabit()
  const { phases, settle, release } = useSettlingRows()

  // Undo runs seconds after the tap, against whatever the habit is by then.
  const latest = useRef(habits)
  useEffect(() => {
    latest.current = habits
  }, [habits])

  const onToggle = (habit: HabitWithTodayLog) => {
    haptic('light')
    const target = dailyTarget(habit)
    const completes = !habit.isComplete && habit.todayCount + 1 >= target
    if (completes) settle(habit.id)
    else release(habit.id)

    toggle.mutate(
      { habit },
      {
        onError: (error) => {
          release(habit.id)
          toast.error(toUserError(error, t, 'dashboard.habitUpdateFailed'))
        },
      },
    )

    // Undo the taps that change what the day reads as: the one that closed
    // the habit, and the one that wiped a counted habit ("8 of 8") to zero.
    // A +1 on the way to the goal is its own undo-free step.
    const before = habit.todayCount
    const clears = habit.isComplete && target > 1
    if (!completes && !clears) return
    const message = clears
      ? t('dashboard.cleared', { name: habit.name })
      : t('dashboard.checked', { name: habit.name })
    toastWithUndo(message, t('common.undo'), () => {
      const now = latest.current.find((h) => h.id === habit.id)
      if (!now || now.isComplete !== completes) return
      release(habit.id)
      toggle.mutate(
        { habit: atCount(now, before) },
        { onError: (error) => toast.error(toUserError(error, t, 'dashboard.habitUpdateFailed')) },
      )
    })
  }

  return { phases, onToggle }
}
