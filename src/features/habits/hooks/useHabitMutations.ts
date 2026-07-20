import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import {
  archiveHabit,
  createHabit,
  updateHabit,
  updateHabitOrder,
} from '@/features/habits/api/habits.api'
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

/** Create / edit / archive mutations, invalidating the habits list on settle. */
export function useHabitMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: habitKeys.all(userId) })
    // The detail page reads ['habit', id] — keep it in sync with edits.
    void queryClient.invalidateQueries({ queryKey: ['habit'] })
  }

  const create = useMutation({
    mutationFn: (input: HabitFormInput) => createHabit({ ...input, user_id: userId }),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: HabitFormInput }) => updateHabit(id, input),
    onSuccess: invalidate,
  })

  const archive = useMutation({
    mutationFn: (id: string) => archiveHabit(id),
    onSuccess: invalidate,
  })

  // Optimistic: the list snaps to the new order instantly, rolls back on error.
  const reorder = useMutation({
    mutationFn: (ordered: { id: string; sort_order: number }[]) => updateHabitOrder(ordered),
    onMutate: async (ordered) => {
      const key = habitKeys.all(userId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Habit[]>(key)
      if (previous) {
        const position = new Map(ordered.map((o) => [o.id, o.sort_order]))
        const next = previous
          .map((h) => (position.has(h.id) ? { ...h, sort_order: position.get(h.id)! } : h))
          .sort((a, b) => a.sort_order - b.sort_order)
        queryClient.setQueryData<Habit[]>(key, next)
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(habitKeys.all(userId), context.previous)
    },
    onSettled: invalidate,
  })

  return { create, update, archive, reorder }
}
