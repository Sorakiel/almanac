import { useQueryClient } from '@tanstack/react-query'
import { useOfflineMutation, type OfflineMutation } from '@/hooks/useOfflineMutation'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { patchQueryData, rollbackQueryData, type OptimisticContext } from '@/lib/optimistic'
import { OFFLINE_MUTATION_KEYS, type SetHabitCountVariables } from '@/lib/offlineMutations'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { Habit, HabitLog } from '@/features/habits/types'

/**
 * The detail page's writes to today: "Mark" sets the count to the full goal
 * (0 clears it), and a counted habit's − / + step it one unit at a time. Optimistic on the history the page draws from, and
 * queued like every other habit write, so it survives an offline reload.
 */
export function useSetTodayCount(
  habit: Habit | undefined,
): OfflineMutation<void, SetHabitCountVariables, number, OptimisticContext<HabitLog[]>> {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const habitId = habit?.id ?? ''
  const historyKey = habitKeys.history(habitId, dateKey)

  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.setHabitCount,
    (count: number) => ({ userId, habitId, date: dateKey, count: Math.max(0, count) }),
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
