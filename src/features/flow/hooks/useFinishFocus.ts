import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { setHabitCount } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { dailyTarget } from '@/features/habits/lib/frequency'
import { useLogFocusSession } from '@/features/flow/hooks/useLogFocusSession'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { toastWithUndo } from '@/lib/undoToast'
import { toUserError } from '@/lib/userError'
import { focusMsLeft, useFocusStore } from '@/stores/focus'

/**
 * How a Flow block ends. Run to the end: the whole block is logged and, if it
 * was for a habit, the habit is marked done. «Завершить» early: the minutes
 * so far are logged with Undo (the habit is left alone — it wasn't finished).
 */
export function useFinishFocus(now: number): { finishEarly: () => void } {
  const { t } = useT()
  const { user } = useSession()
  const { dateKey } = useToday()
  const { habits } = useHabits()
  const queryClient = useQueryClient()
  const logFocus = useLogFocusSession()
  const { endsAt, durationMin, label, habitId, pausedAt, stop } = useFocusStore()
  const running = endsAt !== null && durationMin !== null

  const markHabit = useCallback(
    async (id: string) => {
      const habit = habits.find((h) => h.id === id)
      if (!habit || !user) return
      try {
        await setHabitCount({
          userId: user.id,
          habitId: habit.id,
          date: dateKey,
          count: dailyTarget(habit),
        })
        void queryClient.invalidateQueries({ queryKey: habitKeys.history(habit.id) })
        void queryClient.invalidateQueries({ queryKey: ['habits'] })
        void queryClient.invalidateQueries({ queryKey: ['habitLogs'] })
      } catch (error) {
        toast.error(toUserError(error, t, 'flow.completeFailed'))
      }
    },
    [habits, user, dateKey, queryClient, t],
  )

  useEffect(() => {
    if (!running || pausedAt !== null || endsAt - now > 0) return
    logFocus(durationMin, label)
    if (habitId) void markHabit(habitId)
    stop()
    toast.success(t('flow.done'))
  }, [running, pausedAt, endsAt, now, durationMin, label, habitId, logFocus, markHabit, stop, t])

  const finishEarly = () => {
    if (!running) return
    const minutes = Math.max(
      0,
      Math.round(durationMin - focusMsLeft({ endsAt, pausedAt }, now) / 60_000),
    )
    const undo = logFocus(minutes, label)
    stop()
    if (undo) {
      toastWithUndo(
        t('flow.logged', { count: minutes, label: label ?? t('flow.defaultSessionLabel') }),
        t('common.undo'),
        undo,
      )
    }
  }

  return { finishEarly }
}
