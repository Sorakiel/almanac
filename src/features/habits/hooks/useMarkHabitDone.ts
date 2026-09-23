import { useQueryClient } from '@tanstack/react-query'
import { useOfflineMutation, type OfflineMutation } from '@/hooks/useOfflineMutation'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { patchQueryData, rollbackQueryData, type OptimisticContext } from '@/lib/optimistic'
import { OFFLINE_MUTATION_KEYS, type SetHabitCountVariables } from '@/lib/offlineMutations'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { dailyTarget } from '@/features/habits/lib/frequency'
import type { Habit, HabitLog } from '@/features/habits/types'

/**
 * The detail page's "Mark done for today": sets today's count to the full
 * target (or clears it). Optimistic on the history the page draws from, and
 * queued like every other habit write, so it survives an offline reload.
 */
export function useMarkHabitDone(
  habit: Habit | undefined,
): OfflineMutation<void, SetHabitCountVariables, boolean, OptimisticContext<HabitLog[]>> {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const habitId = habit?.id ?? ''
  const historyKey = habitKeys.history(habitId, dateKey)

  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.setHabitCount,
    (done: boolean) => ({
      userId,
      habitId,
      date: dateKey,
      count: done && habit ? dailyTarget(habit) : 0,
    }),
    {
      onMutate: ({ count }) =>
        patchQueryData<HabitLog[]>(queryClient, historyKey, (logs) => {
          if (!logs) return undefined
          const rest = logs.filter((l) => l.date !== dateKey)
          if (count === 0) return rest
          const today: HabitLog = {
            id: `pending-${habitId}-${dateKey}`,
            user_id: userId,
            habit_id: habitId,
            date: dateKey,
            count,
            note: null,
            created_at: new Date().toISOString(),
          }
          return [...rest, today]
        }),
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, historyKey, context),
    },
  )
}
