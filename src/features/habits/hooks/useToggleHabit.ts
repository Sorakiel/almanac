import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { setHabitCount } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { dailyTarget } from '@/features/habits/lib/frequency'
import { emitActivity } from '@/features/social/api/social.api'
import { isStreakMilestone } from '@/features/social/lib/milestones'
import type { HabitLog, HabitWithTodayLog } from '@/features/habits/types'

interface ToggleArgs {
  habit: HabitWithTodayLog
}

/**
 * One-tap completion. A tap increments the day's count (so multi-target habits
 * fill up); tapping a completed habit clears it. The recent-logs cache is
 * updated optimistically for instant feedback and rolled back on error.
 */
export function useToggleHabit() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const logsKey = habitKeys.recentLogs(userId, dateKey)

  return useMutation({
    mutationFn: ({ habit }: ToggleArgs) => {
      const nextCount = habit.isComplete ? 0 : habit.todayCount + 1
      return setHabitCount({ userId, habitId: habit.id, date: dateKey, count: nextCount })
    },
    onMutate: async ({ habit }: ToggleArgs) => {
      await queryClient.cancelQueries({ queryKey: logsKey })
      const previous = queryClient.getQueryData<HabitLog[]>(logsKey) ?? []
      const nextCount = habit.isComplete ? 0 : habit.todayCount + 1

      // Replace today's row for this habit (or drop it when cleared).
      const others = previous.filter((log) => !(log.habit_id === habit.id && log.date === dateKey))
      const next: HabitLog[] =
        nextCount <= 0
          ? others
          : [
              ...others,
              {
                id: `optimistic-${habit.id}-${dateKey}`,
                user_id: userId,
                habit_id: habit.id,
                date: dateKey,
                count: nextCount,
                note: null,
                created_at: new Date().toISOString(),
              },
            ]

      queryClient.setQueryData<HabitLog[]>(logsKey, next)
      return { previous }
    },
    onSuccess: (_data, { habit }: ToggleArgs) => {
      // When this tap completes the habit and pushes its streak to a milestone,
      // publish a privacy-safe feed event (a day count only — never the habit
      // name). Completing on a due day extends the run by one. Best-effort +
      // idempotent (deduped in the DB); a miss never affects the completion.
      const completing = !habit.isComplete && habit.todayCount + 1 >= dailyTarget(habit)
      const newStreak = habit.streak + 1
      if (completing && isStreakMilestone(newStreak)) {
        void emitActivity({
          user_id: userId,
          kind: 'streak_reached',
          subject: habit.id,
          meta: { days: newStreak },
          event_date: dateKey,
        }).catch(() => undefined)
      }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(logsKey, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: logsKey })
    },
  })
}
