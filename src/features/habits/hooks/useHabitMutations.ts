import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { trackEvent } from '@/lib/analytics'
import { patchQueryData, rollbackQueryData } from '@/lib/optimistic'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { Habit, HabitInsert } from '@/features/habits/types'

export interface HabitFormInput {
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  frequency: HabitInsert['frequency']
  target_count: number
  time_of_day: HabitInsert['time_of_day']
}

type HabitOrder = { id: string; sort_order: number }[]

/** Create / edit / archive / reorder habits, invalidating the list on settle. */
export function useHabitMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const listKey = habitKeys.all(userId)

  const create = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.createHabit,
    (input: HabitFormInput) => ({ input, userId }),
    { onSuccess: (habit) => trackEvent('habit_created', { frequency: habit.frequency }) },
  )
  const update = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.updateHabit,
    (args: { id: string; input: HabitFormInput }) => ({ ...args, userId }),
  )
  const archive = useOfflineMutation(OFFLINE_MUTATION_KEYS.archiveHabit, (id: string) => ({
    id,
    userId,
  }))

  // Optimistic: the list snaps to the new order instantly, rolls back on error.
  const reorder = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.reorderHabits,
    (ordered: HabitOrder) => ({ ordered, userId }),
    {
      onMutate: ({ ordered }) =>
        patchQueryData<Habit[]>(queryClient, listKey, (previous) => {
          if (!previous) return undefined
          const position = new Map(ordered.map((o) => [o.id, o.sort_order]))
          return previous
            .map((h) => ({ ...h, sort_order: position.get(h.id) ?? h.sort_order }))
            .sort((a, b) => a.sort_order - b.sort_order)
        }),
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, listKey, context),
    },
  )

  return { create, update, archive, reorder }
}
