import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { useToday } from '@/hooks/useToday'
import { useT } from '@/hooks/useT'
import { trackEvent } from '@/lib/analytics'
import { patchQueryData, rollbackQueryData } from '@/lib/optimistic'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import type { ChecklistDraftItem } from '@/features/habits/api/habits.api'
import {
  draftHabit,
  dropHabit,
  findHabit,
  putHabit,
  seedNewHabit,
  withInput,
} from '@/features/habits/hooks/habitCache'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { Habit, HabitInsert } from '@/features/habits/types'
import { toUserError } from '@/lib/userError'

export interface HabitFormInput {
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  frequency: HabitInsert['frequency']
  target_count: number
  time_of_day: HabitInsert['time_of_day']
  /** Units that close a day; omitted on a write that leaves it as it is. */
  daily_goal?: number
  unit?: string | null
  /** Local minutes since midnight; null turns the habit's reminder off. */
  reminder_at?: number | null
}

/** A create: the form's fields plus what only exists at creation time. */
export interface NewHabitInput extends HabitFormInput {
  /** Pass one to refer to the habit (Undo, navigation) before it is saved. */
  id?: string
  checklist?: ChecklistDraftItem[]
}

type HabitOrder = { id: string; sort_order: number }[]

/**
 * Create / edit / archive / restore / delete / reorder habits. Every one patches the
 * cache first and never needs awaiting — offline the write queues and the
 * screen already shows its result.
 */
export function useHabitMutations() {
  const { t } = useT()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const listKey = habitKeys.all(userId)
  const cancelList = () => queryClient.cancelQueries({ queryKey: listKey })

  const create = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.createHabit,
    ({ id = crypto.randomUUID(), checklist = [], ...input }: NewHabitInput) => ({
      input,
      userId,
      id,
      checklist,
    }),
    {
      onMutate: async ({ input, id, checklist = [] }) => {
        if (!id) return
        await cancelList()
        seedNewHabit(queryClient, draftHabit(id, userId, input), checklist, dateKey)
      },
      onSuccess: (habit) => trackEvent('habit_created', { frequency: habit.frequency }),
      onError: (_error, { id }) => {
        if (id) dropHabit(queryClient, userId, id)
      },
    },
  )

  const update = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.updateHabit,
    (args: { id: string; input: HabitFormInput }) => ({ ...args, userId }),
    {
      onMutate: async ({ id, input }) => {
        await cancelList()
        const previous = findHabit(queryClient, userId, id)
        if (previous) putHabit(queryClient, userId, withInput(previous, input))
        return { previous }
      },
      onError: (_error, _vars, context) => {
        if (context?.previous) putHabit(queryClient, userId, context.previous)
      },
    },
  )

  const archive = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.archiveHabit,
    (id: string) => ({ id, userId }),
    {
      onMutate: async ({ id }) => {
        await cancelList()
        const previous = findHabit(queryClient, userId, id)
        dropHabit(queryClient, userId, id)
        return { previous }
      },
      onError: (_error, _vars, context) => {
        if (context?.previous) putHabit(queryClient, userId, context.previous)
      },
    },
  )

  /** The Undo of `archive`: takes the row itself so it can reappear before the write lands. */
  const restore = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.restoreHabit,
    (habit: Habit) => ({ habit, userId }),
    {
      onMutate: async ({ habit }) => {
        await cancelList()
        putHabit(queryClient, userId, { ...habit, archived_at: null })
      },
      onError: (_error, { habit }) => dropHabit(queryClient, userId, habit.id),
    },
  )

  /** For good — no Undo exists for this one, so the UI confirms before calling it. */
  const remove = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.deleteHabit,
    (id: string) => ({ id, userId }),
    {
      onMutate: async ({ id }) => {
        await cancelList()
        const previous = findHabit(queryClient, userId, id)
        dropHabit(queryClient, userId, id)
        return { previous }
      },
      // Its own queries now describe a row that no longer exists.
      onSuccess: (_data, { id }) => {
        for (const queryKey of [
          habitKeys.detail(id),
          habitKeys.history(id),
          habitKeys.freezesOf(id),
          habitKeys.subtasks(id),
        ]) {
          // Inactive only: the detail page may still be mounted mid-navigation,
          // and removing a watched query makes it fetch the deleted row again.
          queryClient.removeQueries({ queryKey, type: 'inactive' })
        }
      },
      // Toasted here: the page that fired it has already navigated away.
      onError: (error, _vars, context) => {
        if (context?.previous) putHabit(queryClient, userId, context.previous)
        toast.error(toUserError(error, t, 'habits.deleteFailed'))
      },
    },
  )

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

  return { create, update, archive, restore, remove, reorder }
}
