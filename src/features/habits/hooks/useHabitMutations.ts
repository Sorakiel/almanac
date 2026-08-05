import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { trackEvent } from '@/lib/analytics'
import {
  OFFLINE_MUTATION_KEYS,
  type ArchiveHabitVariables,
  type CreateHabitVariables,
  type ReorderHabitsVariables,
  type UpdateHabitVariables,
} from '@/lib/offlineMutations'
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

type ReorderContext = { previous: Habit[] | undefined } | undefined

/**
 * Create / edit / archive mutations, invalidating the habits list on settle.
 *
 * mutationFn and the settle invalidation for each live here once in
 * registerOfflineMutations (src/lib/offlineMutations.ts) — see useToggleHabit
 * for why. Each mutate/mutateAsync below is a thin wrapper that injects
 * userId so callers keep passing just what they already did.
 */
export function useHabitMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''

  const createMutation = useMutation<Habit, Error, CreateHabitVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.createHabit,
    onSuccess: (habit) => trackEvent('habit_created', { frequency: habit.frequency }),
  })
  const create = {
    ...createMutation,
    mutate: (input: HabitFormInput, options?: MutateOptions<Habit, Error, CreateHabitVariables>) =>
      createMutation.mutate({ input, userId }, options),
    mutateAsync: (input: HabitFormInput) => createMutation.mutateAsync({ input, userId }),
  }

  const updateMutation = useMutation<void, Error, UpdateHabitVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.updateHabit,
  })
  const update = {
    ...updateMutation,
    mutate: (
      args: { id: string; input: HabitFormInput },
      options?: MutateOptions<void, Error, UpdateHabitVariables>,
    ) => updateMutation.mutate({ ...args, userId }, options),
    mutateAsync: (args: { id: string; input: HabitFormInput }) =>
      updateMutation.mutateAsync({ ...args, userId }),
  }

  const archiveMutation = useMutation<void, Error, ArchiveHabitVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.archiveHabit,
  })
  const archive = {
    ...archiveMutation,
    mutate: (id: string, options?: MutateOptions<void, Error, ArchiveHabitVariables>) =>
      archiveMutation.mutate({ id, userId }, options),
    mutateAsync: (id: string) => archiveMutation.mutateAsync({ id, userId }),
  }

  // Optimistic: the list snaps to the new order instantly, rolls back on error.
  const reorderMutation = useMutation<void, Error, ReorderHabitsVariables, ReorderContext>({
    mutationKey: OFFLINE_MUTATION_KEYS.reorderHabits,
    onMutate: async ({ ordered }: ReorderHabitsVariables) => {
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
  })
  const reorder = {
    ...reorderMutation,
    mutate: (
      ordered: { id: string; sort_order: number }[],
      options?: MutateOptions<void, Error, ReorderHabitsVariables, ReorderContext>,
    ) => reorderMutation.mutate({ ordered, userId }, options),
    mutateAsync: (ordered: { id: string; sort_order: number }[]) =>
      reorderMutation.mutateAsync({ ordered, userId }),
  }

  return { create, update, archive, reorder }
}
