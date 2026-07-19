import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { addFreeze, removeFreeze } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'

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
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  return useMutation({
    mutationFn: ({ habitId, date, freeze }: ToggleFreezeArgs) => {
      const day = date ?? dateKey
      return freeze ? addFreeze(userId, habitId, day) : removeFreeze(habitId, day)
    },
    onSuccess: (_data, { habitId }) => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.recentFreezes(userId, dateKey) })
      void queryClient.invalidateQueries({ queryKey: ['habitFreezes', habitId] })
    },
  })
}
