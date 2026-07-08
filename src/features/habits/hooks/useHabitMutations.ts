import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { archiveHabit, createHabit, updateHabit } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { HabitInsert } from '@/features/habits/types'

export interface HabitFormInput {
  name: string
  description?: string | null
  color?: string | null
  frequency: HabitInsert['frequency']
  target_count: number
}

/** Create / edit / archive mutations, invalidating the habits list on settle. */
export function useHabitMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: habitKeys.all(userId) })

  const create = useMutation({
    mutationFn: (input: HabitFormInput) => createHabit({ ...input, user_id: userId }),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: HabitFormInput }) =>
      updateHabit(id, input),
    onSuccess: invalidate,
  })

  const archive = useMutation({
    mutationFn: (id: string) => archiveHabit(id),
    onSuccess: invalidate,
  })

  return { create, update, archive }
}
