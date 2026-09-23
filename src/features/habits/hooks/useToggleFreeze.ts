import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { HabitFreeze } from '@/features/habits/types'

interface ToggleFreezeArgs {
  habitId: string
  /** The day to protect/unprotect (defaults to today). */
  date?: string
  /** True to add protection, false to remove it. */
  freeze: boolean
}

/**
 * Freeze or unfreeze a day for a habit (заморозка). A frozen due-day is treated
 * as a skip in the streak calc, so a protected miss keeps the streak alive.
 */
export function useToggleFreeze() {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  const queryClient = useQueryClient()

  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.toggleFreeze,
    ({ habitId, date = dateKey, freeze }: ToggleFreezeArgs) => ({ userId, habitId, date, freeze }),
    {
      // Optimistic across every freeze window that is cached — the dashboard's
      // and this habit's own — so the snowflake flips on the tap, offline too.
      onMutate: async ({ habitId, date, freeze }) => {
        const roots = [habitKeys.freezesRoot(userId), habitKeys.freezesOf(habitId)]
        await Promise.all(roots.map((queryKey) => queryClient.cancelQueries({ queryKey })))
        const row: HabitFreeze = {
          id: `pending-${habitId}-${date}`,
          user_id: userId,
          habit_id: habitId,
          date,
          created_at: new Date().toISOString(),
        }
        for (const queryKey of roots) {
          queryClient.setQueriesData<HabitFreeze[]>({ queryKey }, (rows) => {
            if (!rows) return rows
            const rest = rows.filter((f) => !(f.habit_id === habitId && f.date === date))
            return freeze ? [...rest, row] : rest
          })
        }
      },
      // The settle invalidation in offlineMutations refetches the truth either way.
      onError: (_error, { habitId }) => {
        void queryClient.invalidateQueries({ queryKey: habitKeys.freezesRoot(userId) })
        void queryClient.invalidateQueries({ queryKey: habitKeys.freezesOf(habitId) })
      },
    },
  )
}
