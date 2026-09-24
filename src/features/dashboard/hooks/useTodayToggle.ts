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

interface TodayToggle {
  phases: ReadonlyMap<string, SettlePhase>
  onToggle: (habit: HabitWithTodayLog) => void
}

/**
 * A tap on Today: haptic, the optimistic write, the row held in place while
 * its check draws, and an Undo for the tap that closed the habit.
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

    // One tap from nothing to done is one tap to take back. A multi-count
    // habit clears to zero on untick, so its Undo would take more than it gave.
    if (completes && target === 1) {
      toastWithUndo(t('dashboard.checked', { name: habit.name }), t('common.undo'), () => {
        const now = latest.current.find((h) => h.id === habit.id)
        if (!now?.isComplete) return
        release(habit.id)
        toggle.mutate(
          { habit: now },
          { onError: (error) => toast.error(toUserError(error, t, 'dashboard.habitUpdateFailed')) },
        )
      })
    }
  }

  return { phases, onToggle }
}
